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
│   ├── src/
│   │   ├── pages/        # 页面组件
│   │   ├── components/   # UI 组件
│   │   ├── api/          # API 封装
│   │   └── utils/        # 工具函数
│   ├── Dockerfile
│   └── nginx.conf
│
├── backend/              # 后端 Flask 应用
│   ├── app.py           # 主应用
│   ├── models.py        # 数据模型
│   ├── config.py        # 配置
│   ├── Dockerfile
│   └── requirements.txt
│
├── docker-compose.yml   # Docker 编排
├── start.sh            # 启动脚本
├── stop.sh             # 停止脚本
└── check-env.sh        # 环境检查脚本
```

## 🚀 快速开始

### 方式一：Docker 部署（推荐）

```bash
# 克隆项目
git clone https://github.com/your-username/mind-shot.git
cd mind-shot

# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

访问地址：
- 前端：http://localhost:3000
- 后端 API：http://localhost:5000

### 方式二：本地开发

#### 环境要求
- Python 3.8+
- Node.js 16+
- npm 8+

#### 使用启动脚本

```bash
# 检查环境
./check-env.sh

# 一键启动
./start.sh

# 停止服务
./stop.sh
```

#### 手动启动

**启动后端：**
```bash
cd backend
pip install -r requirements.txt
python app.py
```

**启动前端：**
```bash
cd frontend
npm install
npm start
```

## 🐳 Docker 命令

```bash
# 构建并启动
docker-compose up -d --build

# 仅启动后端和前端
docker-compose up -d backend frontend

# 启动包括 MinIO 存储
docker-compose --profile storage up -d

# 查看运行状态
docker-compose ps

# 查看日志
docker-compose logs -f backend
docker-compose logs -f frontend

# 停止并删除容器
docker-compose down

# 停止并删除数据卷
docker-compose down -v
```

## 📱 API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查 |
| POST | `/api/register` | 用户注册 |
| POST | `/api/login` | 用户登录 |
| GET | `/api/messages` | 获取消息列表 |
| POST | `/api/messages` | 发送消息 |
| GET | `/api/messages/:id` | 获取消息详情 |
| POST | `/api/upload` | 上传文件 |

## 🎯 功能清单

### MVP 阶段（已完成）
- ✅ 用户注册/登录
- ✅ JWT Token 认证
- ✅ 基础聊天界面
- ✅ 发送/接收消息
- ✅ Agent 智能回复（Mock）
- ✅ 富卡片消息展示
- ✅ 详情抽屉弹出
- ✅ 移动端适配
- ✅ Docker 部署支持

### 后续优化
- [ ] 接入真实 LLM API
- [ ] 文件上传功能
- [ ] 异步任务处理
- [ ] WebSocket 实时推送
- [ ] 知识库功能
- [ ] 推送通知

## 🔧 环境变量

### 后端
| 变量 | 默认值 | 说明 |
|------|--------|------|
| SECRET_KEY | mind-shot-secret-key | Flask 密钥 |
| JWT_SECRET_KEY | jwt-secret-key | JWT 密钥 |
| DATABASE_PATH | mindshot.db | 数据库路径 |
| UPLOAD_FOLDER | uploads | 上传目录 |
| CORS_ORIGINS | http://localhost:3000 | 允许的跨域源 |

### 前端
| 变量 | 默认值 | 说明 |
|------|--------|------|
| REACT_APP_API_BASE | http://localhost:5000/api | API 地址 |

## 📝 License

MIT
