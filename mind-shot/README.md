# Mind Shot 🧠💭

> 一款伪装成聊天软件的异步思维推进器

Mind Shot 看起来像是一个简单的聊天窗口（类似微信"文件传输助手"）。你只需要像给朋友发微信一样，把脑子里的杂念、灵感、任务丢进去。

## ✨ 核心特性

- **零认知负担** - 聊天界面，会用微信就会用
- **异步回响** - 发完就走，Agent 后台处理
- **另有乾坤** - 轻量气泡，点击展开完整详情

## 🏗️ 技术栈

### 前端
- React 18
- Ant Design Mobile
- React Router
- Axios

### 后端
- Flask
- SQLite
- Flask-JWT-Extended
- Flask-CORS

## 📁 项目结构

```
mind-shot/
├── frontend/              # 前端 React 应用
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
├── backend/              # 后端 Flask 应用
│   ├── app.py           # 主应用
│   ├── models.py        # 数据模型
│   ├── config.py        # 配置
│   ├── requirements.txt
│   └── uploads/         # 上传文件目录
│
└── docker-compose.yml   # MinIO 容器配置
```

## 🚀 快速开始

### 1. 启动后端

```bash
cd backend

# 创建虚拟环境（推荐）
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 启动服务
python app.py
```

后端将在 http://localhost:5000 启动

### 2. 启动前端

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm start
```

前端将在 http://localhost:3000 启动

### 3. MinIO（可选）

如果需要对象存储功能：

```bash
docker-compose up -d minio
```

MinIO Console 将在 http://localhost:9001 可用
- 用户名: admin
- 密码: admin123456

## 📱 API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/register` | 用户注册 |
| POST | `/api/login` | 用户登录 |
| GET | `/api/messages` | 获取消息列表 |
| POST | `/api/messages` | 发送消息 |
| GET | `/api/messages/:id` | 获取消息详情 |
| POST | `/api/upload` | 上传文件 |

## 🎯 功能清单

### MVP 阶段（已完成）
- ✅ 用户注册/登录
- ✅ 基础聊天界面
- ✅ 发送/接收文本消息
- ✅ 简单的 Agent 回复（Mock）
- ✅ 富卡片消息展示
- ✅ 详情抽屉弹出
- ✅ 移动端适配

### 后续优化
- [ ] 接入真实 LLM API
- [ ] 文件上传功能
- [ ] 异步任务处理
- [ ] WebSocket 实时推送
- [ ] 知识库功能
- [ ] 推送通知

## 🔧 环境变量

### 后端 (.env)
```
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret
DATABASE_PATH=mindshot.db
UPLOAD_FOLDER=uploads
OPENAI_API_KEY=your-openai-key
```

### 前端 (.env)
```
REACT_APP_API_BASE=http://localhost:5000/api
```

## 📝 License

MIT
