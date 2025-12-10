#!/bin/bash

# ============================================
# Mind Shot 环境检查脚本
# ============================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "============================================"
echo "       🔍 Mind Shot 环境检查"
echo "============================================"
echo -e "${NC}"

ALL_OK=true

# Python 检查
echo -e "${YELLOW}[Python]${NC}"
if command -v python3 &> /dev/null; then
    echo -e "  ${GREEN}✓${NC} python3: $(python3 --version 2>&1)"
    echo -e "  ${GREEN}✓${NC} 路径: $(which python3)"
elif command -v python &> /dev/null; then
    VERSION=$(python --version 2>&1)
    if [[ $VERSION == *"3."* ]]; then
        echo -e "  ${GREEN}✓${NC} python: $VERSION"
        echo -e "  ${GREEN}✓${NC} 路径: $(which python)"
    else
        echo -e "  ${RED}✗${NC} Python 版本过低: $VERSION (需要 3.8+)"
        ALL_OK=false
    fi
else
    echo -e "  ${RED}✗${NC} Python 未安装"
    echo -e "  ${YELLOW}→${NC} 安装: https://www.python.org/downloads/"
    ALL_OK=false
fi
echo ""

# pip 检查
echo -e "${YELLOW}[pip]${NC}"
if command -v pip3 &> /dev/null; then
    echo -e "  ${GREEN}✓${NC} pip3: $(pip3 --version 2>&1 | head -1)"
elif command -v pip &> /dev/null; then
    echo -e "  ${GREEN}✓${NC} pip: $(pip --version 2>&1 | head -1)"
else
    echo -e "  ${YELLOW}!${NC} pip 未找到 (可通过 python -m pip 使用)"
fi
echo ""

# Node.js 检查
echo -e "${YELLOW}[Node.js]${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | tr -d 'v')
    if [ "$NODE_MAJOR" -ge 16 ]; then
        echo -e "  ${GREEN}✓${NC} node: $NODE_VERSION"
        echo -e "  ${GREEN}✓${NC} 路径: $(which node)"
    else
        echo -e "  ${YELLOW}!${NC} node: $NODE_VERSION (推荐 16+)"
    fi
else
    echo -e "  ${RED}✗${NC} Node.js 未安装"
    echo -e "  ${YELLOW}→${NC} 安装: https://nodejs.org/"
    ALL_OK=false
fi
echo ""

# npm 检查
echo -e "${YELLOW}[npm]${NC}"
if command -v npm &> /dev/null; then
    echo -e "  ${GREEN}✓${NC} npm: $(npm --version)"
    echo -e "  ${GREEN}✓${NC} 路径: $(which npm)"
else
    echo -e "  ${RED}✗${NC} npm 未安装"
    ALL_OK=false
fi
echo ""

# Docker 检查 (可选)
echo -e "${YELLOW}[Docker] (可选)${NC}"
if command -v docker &> /dev/null; then
    echo -e "  ${GREEN}✓${NC} docker: $(docker --version 2>&1 | head -1)"
else
    echo -e "  ${YELLOW}!${NC} Docker 未安装 (MinIO 需要，可选)"
fi
echo ""

# 端口检查
echo -e "${YELLOW}[端口可用性]${NC}"
for port in 3000 5000; do
    if lsof -i:$port &> /dev/null; then
        PID=$(lsof -t -i:$port)
        echo -e "  ${YELLOW}!${NC} 端口 $port 已被占用 (PID: $PID)"
    else
        echo -e "  ${GREEN}✓${NC} 端口 $port 可用"
    fi
done
echo ""

# 总结
echo "============================================"
if [ "$ALL_OK" = true ]; then
    echo -e "${GREEN}✓ 环境检查通过，可以运行 ./start.sh 启动项目${NC}"
else
    echo -e "${RED}✗ 请先安装缺失的依赖${NC}"
fi
echo "============================================"
