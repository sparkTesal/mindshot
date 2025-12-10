#!/bin/bash

# ============================================
# Mind Shot 启动脚本
# ============================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

# 日志文件
BACKEND_LOG="$PROJECT_DIR/backend.log"
FRONTEND_LOG="$PROJECT_DIR/frontend.log"

# PID 文件
PID_FILE="$PROJECT_DIR/.pids"

echo -e "${BLUE}"
echo "============================================"
echo "       🧠 Mind Shot 启动脚本"
echo "============================================"
echo -e "${NC}"

# ============================================
# 函数定义
# ============================================

check_command() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}✓${NC} $1 已安装: $(command -v $1)"
        return 0
    else
        echo -e "${RED}✗${NC} $1 未安装"
        return 1
    fi
}

check_python() {
    if command -v python3 &> /dev/null; then
        echo -e "${GREEN}✓${NC} Python3 已安装: $(python3 --version)"
        PYTHON_CMD="python3"
        return 0
    elif command -v python &> /dev/null; then
        echo -e "${GREEN}✓${NC} Python 已安装: $(python --version)"
        PYTHON_CMD="python"
        return 0
    else
        echo -e "${RED}✗${NC} Python 未安装"
        return 1
    fi
}

stop_services() {
    echo -e "${YELLOW}停止现有服务...${NC}"
    
    # 读取 PID 文件并停止进程
    if [ -f "$PID_FILE" ]; then
        while read pid; do
            if kill -0 $pid 2>/dev/null; then
                kill $pid 2>/dev/null || true
                echo "  已停止进程: $pid"
            fi
        done < "$PID_FILE"
        rm -f "$PID_FILE"
    fi
    
    # 停止占用端口的进程
    for port in 5000 3000; do
        pid=$(lsof -t -i:$port 2>/dev/null || true)
        if [ -n "$pid" ]; then
            kill $pid 2>/dev/null || true
            echo "  已停止端口 $port 上的进程: $pid"
        fi
    done
    
    sleep 1
}

# ============================================
# 环境检查
# ============================================

echo -e "${BLUE}[1/5] 检查环境依赖...${NC}"
echo ""

ENV_OK=true

check_python || ENV_OK=false

if command -v node &> /dev/null; then
    echo -e "${GREEN}✓${NC} Node.js 已安装: $(node --version)"
else
    echo -e "${RED}✗${NC} Node.js 未安装"
    ENV_OK=false
fi

if command -v npm &> /dev/null; then
    echo -e "${GREEN}✓${NC} npm 已安装: $(npm --version)"
else
    echo -e "${RED}✗${NC} npm 未安装"
    ENV_OK=false
fi

echo ""

if [ "$ENV_OK" = false ]; then
    echo -e "${RED}环境检查失败，请先安装缺失的依赖${NC}"
    echo ""
    echo "安装指南:"
    echo "  - Python: https://www.python.org/downloads/"
    echo "  - Node.js: https://nodejs.org/"
    exit 1
fi

echo -e "${GREEN}环境检查通过！${NC}"
echo ""

# ============================================
# 停止现有服务
# ============================================

echo -e "${BLUE}[2/5] 停止现有服务...${NC}"
stop_services
echo ""

# ============================================
# 安装后端依赖
# ============================================

echo -e "${BLUE}[3/5] 安装后端依赖...${NC}"
cd "$BACKEND_DIR"

if [ ! -d "venv" ]; then
    echo "  创建虚拟环境..."
    $PYTHON_CMD -m venv venv 2>/dev/null || true
fi

# 安装依赖
echo "  安装 Python 依赖..."
$PYTHON_CMD -m pip install -r requirements.txt -q 2>/dev/null || \
    pip install -r requirements.txt -q

echo -e "${GREEN}  后端依赖安装完成${NC}"
echo ""

# ============================================
# 安装前端依赖
# ============================================

echo -e "${BLUE}[4/5] 检查前端依赖...${NC}"
cd "$FRONTEND_DIR"

if [ ! -d "node_modules" ]; then
    echo "  安装 npm 依赖（首次安装可能需要几分钟）..."
    npm install --silent 2>/dev/null || npm install
fi

echo -e "${GREEN}  前端依赖已就绪${NC}"
echo ""

# ============================================
# 启动服务
# ============================================

echo -e "${BLUE}[5/5] 启动服务...${NC}"
echo ""

# 清空日志文件
> "$BACKEND_LOG"
> "$FRONTEND_LOG"

# 启动后端
echo "  启动后端服务 (端口 5000)..."
cd "$BACKEND_DIR"
nohup $PYTHON_CMD app.py > "$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID >> "$PID_FILE"
echo "    PID: $BACKEND_PID"

# 等待后端启动
sleep 2

# 检查后端是否启动成功
if kill -0 $BACKEND_PID 2>/dev/null; then
    echo -e "    ${GREEN}✓ 后端启动成功${NC}"
else
    echo -e "    ${RED}✗ 后端启动失败，查看日志: $BACKEND_LOG${NC}"
    cat "$BACKEND_LOG"
    exit 1
fi

# 启动前端
echo "  启动前端服务 (端口 3000)..."
cd "$FRONTEND_DIR"
export PORT=3000
export BROWSER=none
nohup npm start > "$FRONTEND_LOG" 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID >> "$PID_FILE"
echo "    PID: $FRONTEND_PID"

# 等待前端启动
echo "    等待前端编译..."
sleep 5

# 检查前端是否启动成功
if kill -0 $FRONTEND_PID 2>/dev/null; then
    echo -e "    ${GREEN}✓ 前端启动成功${NC}"
else
    echo -e "    ${RED}✗ 前端启动失败，查看日志: $FRONTEND_LOG${NC}"
    tail -20 "$FRONTEND_LOG"
    exit 1
fi

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}       🎉 Mind Shot 启动成功！${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "  ${BLUE}前端地址:${NC} http://localhost:3000"
echo -e "  ${BLUE}后端地址:${NC} http://localhost:5000"
echo -e "  ${BLUE}API 文档:${NC} http://localhost:5000/api/health"
echo ""
echo -e "  ${YELLOW}日志文件:${NC}"
echo "    - 后端: $BACKEND_LOG"
echo "    - 前端: $FRONTEND_LOG"
echo ""
echo -e "  ${YELLOW}停止服务:${NC} ./stop.sh 或手动运行:"
echo "    kill \$(cat $PID_FILE)"
echo ""
