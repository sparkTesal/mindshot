#!/bin/bash

# ============================================
# Mind Shot 停止脚本
# ============================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$PROJECT_DIR/.pids"

echo -e "${YELLOW}停止 Mind Shot 服务...${NC}"

# 读取 PID 文件并停止进程
if [ -f "$PID_FILE" ]; then
    while read pid; do
        if kill -0 $pid 2>/dev/null; then
            kill $pid 2>/dev/null
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

echo -e "${GREEN}✓ 所有服务已停止${NC}"
