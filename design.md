# Mind Shot MVP 技术设计文档

> **MVP 原则**: 用最简单的方式实现核心功能，先跑起来再说

## 1. 技术栈（极简版）

### 前端
- **React 18** - 就用 Create React App 起手
- **Ant Design Mobile** - 移动端 UI 组件
- **axios** - HTTP 请求
- **localStorage** - 本地状态存储就够了

### 后端  
- **Flask** - 单应用，不搞微服务
- **SQLite** - 本地数据库，够用了
- **Flask-JWT-Extended** - Token 认证
- **Flask-CORS** - 跨域
- **OpenAI API** - 直接调 GPT（或者先 mock）

### 存储
- **MinIO** - 本地跑个 Docker 容器就行
- 或者直接用文件系统存储也可以

## 2. 项目结构

```
mind-shot/
├── frontend/              # 前端
│   ├── public/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── pages/
│   │   │   ├── ChatPage.jsx
│   │   │   └── LoginPage.jsx
│   │   ├── components/
│   │   │   ├── MessageBubble.jsx
│   │   │   ├── InputBar.jsx
│   │   │   └── DetailDrawer.jsx
│   │   ├── api/
│   │   │   └── api.js
│   │   └── utils/
│   │       └── auth.js
│   └── package.json
│
├── backend/              # 后端
│   ├── app.py           # 主应用（一个文件搞定）
│   ├── models.py        # 数据模型
│   ├── config.py        # 配置
│   ├── requirements.txt
│   └── mindshot.db      # SQLite 数据库文件
│
└── docker-compose.yml   # 只用来跑 MinIO
```

## 3. 数据库设计（3张表搞定）

### users 表
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### messages 表
```sql
CREATE TABLE messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    role TEXT NOT NULL,              -- 'user' 或 'agent'
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text', -- 'text', 'rich_card'
    metadata TEXT,                    -- JSON 字符串
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
);
```

### attachments 表
```sql
CREATE TABLE attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id INTEGER NOT NULL,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (message_id) REFERENCES messages (id)
);
```

## 4. API 设计（只做必要的）

```
POST   /api/login                  # 登录
POST   /api/register               # 注册
GET    /api/messages               # 获取消息列表
POST   /api/messages               # 发送消息（同步返回 Agent 回复）
POST   /api/upload                 # 上传文件
```

就这5个接口，够用了。

## 5. 后端实现（单文件）

```python
# backend/app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
import sqlite3
import hashlib
import json
from datetime import datetime
import openai
import os

app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = 'your-secret-key-change-it'
CORS(app)
jwt = JWTManager(app)

# 初始化数据库
def init_db():
    conn = sqlite3.connect('mindshot.db')
    c = conn.cursor()
    
    c.execute('''CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')
    
    c.execute('''CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        message_type TEXT DEFAULT 'text',
        metadata TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )''')
    
    conn.commit()
    conn.close()

# 注册
@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    password_hash = hashlib.sha256(password.encode()).hexdigest()
    
    try:
        conn = sqlite3.connect('mindshot.db')
        c = conn.cursor()
        c.execute('INSERT INTO users (username, password_hash) VALUES (?, ?)',
                  (username, password_hash))
        conn.commit()
        conn.close()
        return jsonify({'message': 'ok'}), 201
    except sqlite3.IntegrityError:
        return jsonify({'error': '用户名已存在'}), 400

# 登录
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    password_hash = hashlib.sha256(password.encode()).hexdigest()
    
    conn = sqlite3.connect('mindshot.db')
    c = conn.cursor()
    c.execute('SELECT id FROM users WHERE username=? AND password_hash=?',
              (username, password_hash))
    user = c.fetchone()
    conn.close()
    
    if user:
        token = create_access_token(identity=user[0])
        return jsonify({'token': token}), 200
    else:
        return jsonify({'error': '用户名或密码错误'}), 401

# 获取消息列表
@app.route('/api/messages', methods=['GET'])
@jwt_required()
def get_messages():
    user_id = get_jwt_identity()
    
    conn = sqlite3.connect('mindshot.db')
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute('''SELECT * FROM messages 
                 WHERE user_id=? 
                 ORDER BY created_at ASC''', (user_id,))
    messages = [dict(row) for row in c.fetchall()]
    conn.close()
    
    return jsonify({'messages': messages}), 200

# 发送消息（同步处理）
@app.route('/api/messages', methods=['POST'])
@jwt_required()
def send_message():
    user_id = get_jwt_identity()
    data = request.json
    content = data.get('content')
    
    # 1. 保存用户消息
    conn = sqlite3.connect('mindshot.db')
    c = conn.cursor()
    c.execute('''INSERT INTO messages (user_id, role, content, message_type) 
                 VALUES (?, ?, ?, ?)''',
              (user_id, 'user', content, 'text'))
    user_msg_id = c.lastrowid
    
    # 2. 调用 GPT 获取回复（简化版）
    # TODO: 替换为真实的 OpenAI API 调用
    agent_response = get_agent_response(content)
    
    # 3. 保存 Agent 消息
    c.execute('''INSERT INTO messages (user_id, role, content, message_type, metadata) 
                 VALUES (?, ?, ?, ?, ?)''',
              (user_id, 'agent', agent_response['content'], 
               agent_response['type'], json.dumps(agent_response.get('metadata', {}))))
    agent_msg_id = c.lastrowid
    
    conn.commit()
    
    # 4. 获取刚才插入的两条消息
    c.execute('SELECT * FROM messages WHERE id IN (?, ?)', (user_msg_id, agent_msg_id))
    conn.row_factory = sqlite3.Row
    new_messages = [dict(row) for row in c.fetchall()]
    conn.close()
    
    return jsonify({'messages': new_messages}), 201

# 简单的 Agent 逻辑（先 mock，后面再接真实 LLM）
def get_agent_response(user_input):
    # MVP: 先返回固定回复，后面再接 OpenAI
    if '提醒' in user_input or '日程' in user_input:
        return {
            'content': '📅 好的，我已经帮你记下了！',
            'type': 'rich_card',
            'metadata': {
                'card_type': 'schedule',
                'actions': ['查看日历', '归档']
            }
        }
    elif '想做' in user_input or '灵感' in user_input:
        return {
            'content': '💡 关于这个想法，我整理了一些思路',
            'type': 'rich_card',
            'metadata': {
                'card_type': 'idea',
                'actions': ['继续完善', '转为待办']
            }
        }
    else:
        return {
            'content': f'收到：{user_input}。Agent 正在思考中...',
            'type': 'text'
        }

# 上传文件（简化版，先存本地）
@app.route('/api/upload', methods=['POST'])
@jwt_required()
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': '没有文件'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': '文件名为空'}), 400
    
    # MVP: 直接存本地 uploads 目录
    upload_dir = 'uploads'
    os.makedirs(upload_dir, exist_ok=True)
    
    filename = f"{datetime.now().timestamp()}_{file.filename}"
    filepath = os.path.join(upload_dir, filename)
    file.save(filepath)
    
    file_url = f'/uploads/{filename}'
    
    return jsonify({'url': file_url}), 201

if __name__ == '__main__':
    init_db()
    app.run(debug=True, host='0.0.0.0', port=5000)
```

## 6. 前端实现（核心代码）

### App.jsx
```jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ChatPage from './pages/ChatPage';
import LoginPage from './pages/LoginPage';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={
          token ? <Navigate to="/" /> : <LoginPage setToken={setToken} />
        } />
        <Route path="/" element={
          token ? <ChatPage /> : <Navigate to="/login" />
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

### ChatPage.jsx
```jsx
import React, { useState, useEffect } from 'react';
import { List, Input, Button } from 'antd-mobile';
import axios from 'axios';
import MessageBubble from '../components/MessageBubble';
import DetailDrawer from '../components/DetailDrawer';

const API_BASE = 'http://localhost:5000/api';

function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  // 加载消息
  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    const token = localStorage.getItem('token');
    const res = await axios.get(`${API_BASE}/messages`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setMessages(res.data.messages);
  };

  // 发送消息
  const sendMessage = async () => {
    if (!input.trim()) return;
    
    setLoading(true);
    const token = localStorage.getItem('token');
    
    try {
      const res = await axios.post(
        `${API_BASE}/messages`,
        { content: input },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setMessages([...messages, ...res.data.messages]);
      setInput('');
    } catch (error) {
      alert('发送失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 头部 */}
      <div style={{ padding: '12px', background: '#f5f5f5', borderBottom: '1px solid #ddd' }}>
        <h3 style={{ margin: 0 }}>Mind Shot</h3>
      </div>

      {/* 消息列表 */}
      <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
        {messages.map(msg => (
          <MessageBubble 
            key={msg.id} 
            message={msg}
            onClick={() => msg.role === 'agent' && setSelectedMessage(msg)}
          />
        ))}
      </div>

      {/* 输入框 */}
      <div style={{ padding: '12px', borderTop: '1px solid #ddd' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Input
            placeholder="像发微信一样..."
            value={input}
            onChange={setInput}
            onEnterPress={sendMessage}
            style={{ flex: 1 }}
          />
          <Button color="primary" onClick={sendMessage} loading={loading}>
            发送
          </Button>
        </div>
      </div>

      {/* 详情抽屉 */}
      <DetailDrawer 
        message={selectedMessage}
        onClose={() => setSelectedMessage(null)}
      />
    </div>
  );
}

export default ChatPage;
```

### MessageBubble.jsx（简化版）
```jsx
import React from 'react';

function MessageBubble({ message, onClick }) {
  const isUser = message.role === 'user';
  
  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: '12px'
    }}>
      <div
        onClick={onClick}
        style={{
          maxWidth: '70%',
          padding: '12px',
          borderRadius: '12px',
          background: isUser ? '#95ec69' : '#fff',
          boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
          cursor: message.message_type === 'rich_card' ? 'pointer' : 'default'
        }}
      >
        {message.content}
        {message.message_type === 'rich_card' && (
          <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
            点击查看详情 →
          </div>
        )}
      </div>
    </div>
  );
}

export default MessageBubble;
```

## 7. 快速启动

### 后端启动
```bash
cd backend
pip install flask flask-cors flask-jwt-extended
python app.py
```

### 前端启动
```bash
cd frontend
npm install
npm start
```

### MinIO（可选）
```bash
docker run -p 9000:9000 -p 9001:9001 \
  -e MINIO_ROOT_USER=admin \
  -e MINIO_ROOT_PASSWORD=admin123 \
  minio/minio server /data --console-address ":9001"
```

## 8. MVP 功能清单

✅ **第一周**
- [x] 用户注册登录
- [x] 基础聊天界面
- [x] 发送/接收文本消息
- [x] 简单的 Agent 回复（mock）

✅ **第二周**
- [ ] 富卡片消息展示
- [ ] 详情抽屉弹出
- [ ] 文件上传（本地存储）
- [ ] 移动端适配优化

🔄 **第三周（可选）**
- [ ] 接入真实 LLM API
- [ ] 简单的异步处理
- [ ] 部署上线

## 9. 后续优化方向

等 MVP 跑通了再考虑：
- 异步任务处理（Celery）
- WebSocket 实时推送
- 知识库功能
- 更复杂的 Agent 逻辑
- 数据库迁移到 PostgreSQL
- Docker 部署

---

**MVP 原则：能用就行，别想太多！** 🚀
