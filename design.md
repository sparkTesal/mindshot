# Mind Shot 技术设计文档

## 1. 技术栈概览

### 1.1. 前端技术栈
- **框架**: React 18+
- **UI 组件库**: Ant Design Mobile / React Mobile
- **状态管理**: Zustand / Redux Toolkit
- **路由**: React Router v6
- **HTTP 客户端**: Axios
- **WebSocket**: Socket.IO Client
- **样式方案**: Styled Components / Tailwind CSS
- **构建工具**: Vite
- **PWA 支持**: Workbox

### 1.2. 后端技术栈
- **框架**: Flask 3.0+
- **异步任务**: Celery + Redis
- **WebSocket**: Flask-SocketIO
- **API 文档**: Flask-RESTX / Swagger
- **认证**: Flask-JWT-Extended
- **ORM**: SQLAlchemy
- **数据库**: PostgreSQL
- **缓存**: Redis
- **对象存储**: MinIO / AWS S3 / 阿里云 OSS

### 1.3. AI/Agent 技术栈
- **LLM 接入**: OpenAI API / Claude API
- **向量数据库**: Pinecone / Weaviate
- **任务编排**: LangChain / LlamaIndex
- **搜索引擎**: Google Search API / Bing API

### 1.4. 基础设施
- **容器化**: Docker + Docker Compose
- **Web 服务器**: Nginx
- **消息队列**: RabbitMQ / Redis
- **监控**: Prometheus + Grafana
- **日志**: ELK Stack (Elasticsearch + Logstash + Kibana)

## 2. 系统架构设计

### 2.1. 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                    移动端 Web 应用 (React)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Chat View   │  │ Detail View  │  │ Library View │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────┬────────────────────────────────────────────────┘
             │ REST API / WebSocket
             │
┌────────────▼────────────────────────────────────────────────┐
│                      API Gateway (Nginx)                     │
└────────────┬────────────────────────────────────────────────┘
             │
     ┌───────┴───────┐
     │               │
┌────▼─────┐   ┌────▼─────────────────────────────────┐
│  Flask   │   │     Flask-SocketIO                    │
│  REST API│   │     (实时消息推送)                     │
└────┬─────┘   └────┬─────────────────────────────────┘
     │              │
     │    ┌─────────┴──────────┐
     │    │                    │
┌────▼────▼─────┐      ┌──────▼──────┐
│   PostgreSQL   │      │    Redis    │
│   (主数据库)    │      │  (缓存/队列) │
└────────────────┘      └──────┬──────┘
                               │
                        ┌──────▼──────────┐
                        │  Celery Workers  │
                        │  (异步任务处理)   │
                        └──────┬──────────┘
                               │
                    ┌──────────┼──────────┐
                    │          │          │
              ┌─────▼────┐ ┌──▼────┐ ┌──▼────────┐
              │ LLM API  │ │Search │ │   MinIO   │
              │(GPT/etc) │ │Engine │ │(对象存储)  │
              └──────────┘ └───────┘ └───────────┘
```

### 2.2. 核心模块划分

#### 前端模块
1. **Chat Module** - 聊天界面核心
2. **Message Module** - 消息组件（气泡、富媒体）
3. **Detail Module** - 详情页渲染引擎
4. **Library Module** - 知识库管理
5. **Auth Module** - 用户认证
6. **Notification Module** - 推送通知
7. **Upload Module** - 文件上传

#### 后端模块
1. **API Layer** - REST API 接口
2. **WebSocket Layer** - 实时通信
3. **Auth Service** - 认证授权服务
4. **Message Service** - 消息处理服务
5. **Agent Orchestration** - Agent 任务编排
6. **Storage Service** - 对象存储服务
7. **Notification Service** - 推送服务
8. **Search Service** - 搜索服务

## 3. 数据库设计

### 3.1. 核心表结构

#### 用户表 (users)
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);
```

#### 对话会话表 (conversations)
```sql
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_archived BOOLEAN DEFAULT FALSE
);
```

#### 消息表 (messages)
```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender_type VARCHAR(20) NOT NULL, -- 'user' or 'agent'
    content_type VARCHAR(50) NOT NULL, -- 'text', 'voice', 'image', 'file', 'rich_card'
    content TEXT NOT NULL,
    metadata JSONB, -- 存储额外信息
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE
);
```

#### 任务表 (tasks)
```sql
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    task_type VARCHAR(50) NOT NULL, -- 'research', 'summarize', 'schedule', etc.
    status VARCHAR(20) NOT NULL, -- 'pending', 'processing', 'completed', 'failed'
    priority INTEGER DEFAULT 5,
    input_data JSONB NOT NULL,
    output_data JSONB,
    error_message TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 知识库表 (library_items)
```sql
CREATE TABLE library_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    item_type VARCHAR(50) NOT NULL, -- 'idea', 'task', 'article', 'document'
    content TEXT NOT NULL,
    metadata JSONB,
    tags TEXT[],
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 文件附件表 (attachments)
```sql
CREATE TABLE attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    storage_key VARCHAR(500) NOT NULL, -- 对象存储中的 key
    storage_url VARCHAR(1000) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 4. API 设计

### 4.1. 认证相关 API

```
POST   /api/v1/auth/register          # 用户注册
POST   /api/v1/auth/login             # 用户登录
POST   /api/v1/auth/logout            # 用户登出
POST   /api/v1/auth/refresh           # 刷新 Token
GET    /api/v1/auth/profile           # 获取用户信息
PUT    /api/v1/auth/profile           # 更新用户信息
```

### 4.2. 对话相关 API

```
GET    /api/v1/conversations                    # 获取对话列表
POST   /api/v1/conversations                    # 创建新对话
GET    /api/v1/conversations/{id}               # 获取对话详情
PUT    /api/v1/conversations/{id}               # 更新对话
DELETE /api/v1/conversations/{id}               # 删除对话
GET    /api/v1/conversations/{id}/messages      # 获取消息列表
POST   /api/v1/conversations/{id}/messages      # 发送消息
```

### 4.3. 消息相关 API

```
GET    /api/v1/messages/{id}                    # 获取消息详情
DELETE /api/v1/messages/{id}                    # 删除消息
POST   /api/v1/messages/{id}/detail             # 获取详情视图数据
POST   /api/v1/messages/{id}/actions/{action}   # 执行消息上的操作
```

### 4.4. 知识库相关 API

```
GET    /api/v1/library                          # 获取知识库列表
GET    /api/v1/library/{id}                     # 获取知识库项详情
PUT    /api/v1/library/{id}                     # 更新知识库项
DELETE /api/v1/library/{id}                     # 删除知识库项
GET    /api/v1/library/search                   # 搜索知识库
POST   /api/v1/library/{id}/archive             # 归档项目
```

### 4.5. 文件上传 API

```
POST   /api/v1/upload/image                     # 上传图片
POST   /api/v1/upload/file                      # 上传文件
POST   /api/v1/upload/voice                     # 上传语音
GET    /api/v1/upload/presigned-url             # 获取预签名 URL
```

### 4.6. 任务相关 API

```
GET    /api/v1/tasks                            # 获取任务列表
GET    /api/v1/tasks/{id}                       # 获取任务状态
POST   /api/v1/tasks/{id}/cancel                # 取消任务
```

### 4.7. WebSocket 事件

```
// 客户端 -> 服务器
connect                    # 建立连接
disconnect                 # 断开连接
send_message               # 发送消息
typing                     # 正在输入

// 服务器 -> 客户端
message_received           # 消息已接收
agent_typing               # Agent 正在思考
agent_message              # Agent 新消息
task_status_update         # 任务状态更新
notification               # 系统通知
```

## 5. 前端架构设计

### 5.1. 目录结构

```
src/
├── assets/                 # 静态资源
│   ├── images/
│   ├── icons/
│   └── fonts/
├── components/            # 通用组件
│   ├── Chat/
│   │   ├── ChatContainer.jsx
│   │   ├── MessageBubble.jsx
│   │   ├── InputBar.jsx
│   │   └── VoiceRecorder.jsx
│   ├── Detail/
│   │   ├── DetailView.jsx
│   │   ├── DetailRenderer.jsx
│   │   └── ActionButtons.jsx
│   ├── Library/
│   │   ├── LibraryGrid.jsx
│   │   ├── LibraryItem.jsx
│   │   └── SearchBar.jsx
│   └── Common/
│       ├── Avatar.jsx
│       ├── LoadingSpinner.jsx
│       └── ErrorBoundary.jsx
├── pages/                 # 页面组件
│   ├── ChatPage.jsx
│   ├── LibraryPage.jsx
│   ├── LoginPage.jsx
│   └── ProfilePage.jsx
├── hooks/                 # 自定义 Hooks
│   ├── useChat.js
│   ├── useWebSocket.js
│   ├── useVoice.js
│   └── useUpload.js
├── store/                 # 状态管理
│   ├── slices/
│   │   ├── authSlice.js
│   │   ├── chatSlice.js
│   │   └── librarySlice.js
│   └── store.js
├── services/              # API 服务
│   ├── api.js
│   ├── websocket.js
│   ├── auth.js
│   └── storage.js
├── utils/                 # 工具函数
│   ├── formatters.js
│   ├── validators.js
│   └── constants.js
├── styles/                # 样式文件
│   ├── global.css
│   ├── variables.css
│   └── theme.js
├── App.jsx
└── main.jsx
```

### 5.2. 移动端适配策略

#### 响应式布局
- 使用 Flexbox / Grid 实现流式布局
- 视口单位 (vw, vh) 和相对单位 (rem, em)
- 媒体查询针对不同屏幕尺寸

#### 触摸交互优化
- 按钮最小触摸区域：44x44px
- 支持手势操作（滑动、长按）
- 防抖和节流处理

#### 性能优化
- 虚拟滚动（react-window / react-virtualized）
- 图片懒加载
- 路由懒加载
- Service Worker 缓存策略

#### 移动端特性
- 支持 PWA 安装
- 离线访问能力
- 推送通知
- 触觉反馈

### 5.3. 核心页面设计

#### Chat 页面布局（移动端）
```
┌─────────────────────────────┐
│   [≡]  Mind Shot     [···]  │ ← Header (60px)
├─────────────────────────────┤
│                             │
│  ┌────────────────┐         │
│  │ 用户消息气泡    │         │
│  └────────────────┘         │
│                             │
│         ┌────────────────┐  │
│         │ Agent 消息气泡  │  │
│         └────────────────┘  │ ← Chat Area (动态高度)
│                             │
│  ┌────────────────┐         │
│  │ 用户消息气泡    │         │
│  └────────────────┘         │
│                             │
├─────────────────────────────┤
│ [🎤] [输入框...    ] [+]   │ ← Input Bar (70px)
└─────────────────────────────┘
```

## 6. 后端架构设计

### 6.1. 目录结构

```
backend/
├── app/
│   ├── __init__.py
│   ├── api/                      # API 路由
│   │   ├── __init__.py
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── conversations.py
│   │   │   ├── messages.py
│   │   │   ├── library.py
│   │   │   ├── upload.py
│   │   │   └── tasks.py
│   │   └── deps.py              # 依赖注入
│   ├── core/                    # 核心配置
│   │   ├── __init__.py
│   │   ├── config.py
│   │   ├── security.py
│   │   └── database.py
│   ├── models/                  # 数据模型
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── conversation.py
│   │   ├── message.py
│   │   ├── task.py
│   │   └── library.py
│   ├── schemas/                 # Pydantic 模型
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── message.py
│   │   └── library.py
│   ├── services/                # 业务逻辑
│   │   ├── __init__.py
│   │   ├── auth_service.py
│   │   ├── message_service.py
│   │   ├── agent_service.py
│   │   ├── storage_service.py
│   │   └── notification_service.py
│   ├── tasks/                   # Celery 任务
│   │   ├── __init__.py
│   │   ├── agent_tasks.py
│   │   ├── search_tasks.py
│   │   └── notification_tasks.py
│   ├── websocket/               # WebSocket 处理
│   │   ├── __init__.py
│   │   ├── handlers.py
│   │   └── events.py
│   └── utils/                   # 工具函数
│       ├── __init__.py
│       ├── llm_client.py
│       ├── search_client.py
│       └── validators.py
├── migrations/                  # 数据库迁移
├── tests/                       # 测试
├── requirements.txt
├── celery_worker.py
└── run.py
```

### 6.2. Flask 应用初始化

```python
# app/__init__.py
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_socketio import SocketIO

db = SQLAlchemy()
jwt = JWTManager()
socketio = SocketIO()

def create_app(config_name='default'):
    app = Flask(__name__)
    app.config.from_object(f'app.core.config.{config_name}')
    
    # 初始化扩展
    db.init_app(app)
    jwt.init_app(app)
    CORS(app)
    socketio.init_app(app, cors_allowed_origins="*", async_mode='threading')
    
    # 注册蓝图
    from app.api.v1 import api_v1
    app.register_blueprint(api_v1, url_prefix='/api/v1')
    
    # 注册 WebSocket 事件
    from app.websocket import register_handlers
    register_handlers(socketio)
    
    return app
```

### 6.3. Agent 异步任务处理

```python
# app/tasks/agent_tasks.py
from celery import Celery
from app.services.agent_service import AgentService
from app.services.notification_service import NotificationService

celery = Celery('tasks', broker='redis://localhost:6379/0')

@celery.task
def process_user_message(message_id: str, user_id: str, content: str):
    """异步处理用户消息"""
    agent_service = AgentService()
    notification_service = NotificationService()
    
    try:
        # 1. 分析用户意图
        intent = agent_service.analyze_intent(content)
        
        # 2. 根据意图执行相应操作
        if intent == 'research':
            result = agent_service.do_research(content)
        elif intent == 'schedule':
            result = agent_service.create_schedule(content)
        elif intent == 'summarize':
            result = agent_service.summarize_content(content)
        else:
            result = agent_service.general_response(content)
        
        # 3. 保存 Agent 响应
        response_message = agent_service.save_response(
            message_id=message_id,
            result=result
        )
        
        # 4. 通过 WebSocket 推送给用户
        notification_service.send_message_notification(
            user_id=user_id,
            message=response_message
        )
        
        return {'status': 'success', 'message_id': response_message.id}
        
    except Exception as e:
        # 记录错误并通知用户
        agent_service.log_error(message_id, str(e))
        notification_service.send_error_notification(user_id, str(e))
        return {'status': 'failed', 'error': str(e)}
```

## 7. 对象存储设计

### 7.1. 存储策略

#### 文件分类存储
```
mind-shot-bucket/
├── avatars/              # 用户头像
│   └── {user_id}/
│       └── avatar.jpg
├── messages/             # 消息附件
│   └── {conversation_id}/
│       ├── images/
│       ├── files/
│       └── voices/
└── library/              # 知识库文件
    └── {user_id}/
        └── {item_id}/
```

#### 文件命名规则
- 格式：`{timestamp}_{uuid}_{original_filename}`
- 示例：`1702345678_a1b2c3d4_document.pdf`

### 7.2. MinIO 配置示例

```python
# app/services/storage_service.py
from minio import Minio
from minio.error import S3Error
from app.core.config import settings

class StorageService:
    def __init__(self):
        self.client = Minio(
            settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE
        )
        self.bucket_name = settings.MINIO_BUCKET_NAME
        
    def upload_file(self, file, object_name: str, content_type: str):
        """上传文件到对象存储"""
        try:
            self.client.put_object(
                bucket_name=self.bucket_name,
                object_name=object_name,
                data=file,
                length=-1,  # 未知长度，流式上传
                content_type=content_type,
                part_size=10*1024*1024  # 10MB
            )
            
            # 返回文件 URL
            return self.get_file_url(object_name)
            
        except S3Error as e:
            raise Exception(f"文件上传失败: {str(e)}")
    
    def get_file_url(self, object_name: str, expires=7*24*60*60):
        """获取文件访问 URL（带签名，7天有效）"""
        try:
            url = self.client.presigned_get_object(
                bucket_name=self.bucket_name,
                object_name=object_name,
                expires=expires
            )
            return url
        except S3Error as e:
            raise Exception(f"获取文件 URL 失败: {str(e)}")
    
    def delete_file(self, object_name: str):
        """删除文件"""
        try:
            self.client.remove_object(
                bucket_name=self.bucket_name,
                object_name=object_name
            )
        except S3Error as e:
            raise Exception(f"删除文件失败: {str(e)}")
```

## 8. 安全设计

### 8.1. 认证授权
- JWT Token 认证
- Access Token（短期有效，15分钟）
- Refresh Token（长期有效，7天）
- Token 黑名单机制（登出时加入黑名单）

### 8.2. 数据安全
- 密码使用 bcrypt 加密存储
- 敏感信息加密传输（HTTPS）
- 文件上传类型和大小限制
- SQL 注入防护（ORM 参数化查询）
- XSS 防护（前端输入转义）

### 8.3. API 安全
- 请求频率限制（Flask-Limiter）
- CORS 配置
- CSRF 保护
- API 版本管理

## 9. 性能优化

### 9.1. 数据库优化
- 合理的索引设计
- 查询优化（避免 N+1 查询）
- 数据库连接池
- 读写分离（主从复制）

### 9.2. 缓存策略
- Redis 缓存热点数据
- 消息列表缓存（5分钟）
- 用户信息缓存（30分钟）
- 对象存储 URL 缓存

### 9.3. 异步处理
- Celery 异步任务队列
- 长时间任务后台执行
- WebSocket 实时通知

### 9.4. CDN 加速
- 静态资源 CDN 分发
- 对象存储 CDN 加速
- 图片压缩和优化

## 10. 部署架构

### 10.1. Docker Compose 部署

```yaml
version: '3.8'

services:
  # Nginx 反向代理
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - backend
      - frontend

  # 前端应用
  frontend:
    build: ./frontend
    environment:
      - REACT_APP_API_URL=http://backend:5000
      - REACT_APP_WS_URL=ws://backend:5000

  # 后端 API
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/mindshot
      - REDIS_URL=redis://redis:6379/0
      - MINIO_ENDPOINT=minio:9000
    depends_on:
      - postgres
      - redis
      - minio

  # Celery Worker
  celery_worker:
    build: ./backend
    command: celery -A celery_worker worker -l info
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/mindshot
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - postgres
      - redis

  # PostgreSQL
  postgres:
    image: postgres:15
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=mindshot

  # Redis
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

  # MinIO 对象存储
  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data
    environment:
      - MINIO_ROOT_USER=minioadmin
      - MINIO_ROOT_PASSWORD=minioadmin

volumes:
  postgres_data:
  redis_data:
  minio_data:
```

### 10.2. 环境配置

#### 开发环境
- 本地开发服务器
- 热重载
- 详细日志
- Mock 数据

#### 测试环境
- Docker Compose 部署
- 模拟真实环境
- 自动化测试

#### 生产环境
- Kubernetes / 云服务器
- 负载均衡
- 自动扩缩容
- 监控告警

## 11. 开发计划

### Phase 1: 基础架构（2周）
- [ ] 前后端项目初始化
- [ ] 数据库设计和迁移
- [ ] 认证授权系统
- [ ] 对象存储集成
- [ ] 基础 API 开发

### Phase 2: 核心功能（3周）
- [ ] 聊天界面开发
- [ ] 消息发送和接收
- [ ] WebSocket 实时通信
- [ ] 语音输入功能
- [ ] 文件上传功能

### Phase 3: Agent 集成（3周）
- [ ] LLM API 集成
- [ ] 任务编排系统
- [ ] 异步任务处理
- [ ] 搜索引擎集成
- [ ] 意图识别

### Phase 4: 详情和知识库（2周）
- [ ] 详情视图渲染
- [ ] 富内容展示
- [ ] 知识库管理
- [ ] 搜索功能

### Phase 5: 优化和上线（2周）
- [ ] 性能优化
- [ ] 移动端适配优化
- [ ] 推送通知
- [ ] 测试和修复
- [ ] 部署上线

## 12. 技术风险和应对

### 12.1. LLM API 稳定性
- **风险**: API 限流、超时、费用超支
- **应对**: 多 LLM 提供商备份、请求队列管理、费用监控

### 12.2. 实时性能
- **风险**: WebSocket 连接数过多、消息延迟
- **应对**: 连接池管理、消息队列缓冲、水平扩展

### 12.3. 存储成本
- **风险**: 文件存储费用增长
- **应对**: 文件大小限制、过期清理策略、CDN 优化

### 12.4. 移动端兼容性
- **风险**: 不同设备和浏览器兼容问题
- **应对**: 渐进式增强、Polyfill、充分测试

## 13. 监控和运维

### 13.1. 监控指标
- API 响应时间
- 错误率
- 任务队列长度
- 数据库连接数
- 存储使用量
- 用户活跃度

### 13.2. 日志管理
- 应用日志
- 访问日志
- 错误日志
- 任务执行日志

### 13.3. 告警机制
- 错误率超阈值
- 响应时间过长
- 服务宕机
- 磁盘空间不足

---

## 附录

### A. 技术选型理由

#### 为什么选择 Flask？
- 轻量灵活，易于扩展
- 丰富的生态系统
- 适合中小型项目快速开发
- 良好的异步任务支持（Celery）

#### 为什么选择 React？
- 组件化开发，可维护性高
- 强大的生态系统（UI 库、工具链）
- 优秀的移动端支持
- 虚拟 DOM 性能优化

#### 为什么使用对象存储？
- 高可用性和扩展性
- 成本优势（按需付费）
- CDN 集成方便
- 支持大文件存储

### B. 参考资料
- Flask 官方文档：https://flask.palletsprojects.com/
- React 官方文档：https://react.dev/
- MinIO 文档：https://min.io/docs/
- Celery 文档：https://docs.celeryq.dev/
- PostgreSQL 文档：https://www.postgresql.org/docs/
