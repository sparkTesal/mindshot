# Mind Shot 前端 Dockerfile
# 阶段1: 构建
FROM node:18-alpine AS builder

WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装依赖
RUN npm ci --silent

# 复制源代码
COPY . .

# 设置 API 地址（构建时环境变量）
ARG REACT_APP_API_BASE=http://localhost:5000/api
ENV REACT_APP_API_BASE=$REACT_APP_API_BASE

# 构建
RUN npm run build

# 阶段2: 生产环境
FROM nginx:alpine

# 复制构建产物
COPY --from=builder /app/build /usr/share/nginx/html

# 复制 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
