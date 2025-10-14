#!/bin/bash

# Unraid 服务器构建和部署脚本

echo "========================================="
echo "  Boundary Game - Unraid 部署脚本"
echo "========================================="

# 项目路径
PROJECT_DIR="/mnt/user/Cache/boundlly"
cd "$PROJECT_DIR" || exit 1

echo ""
echo "当前目录: $(pwd)"
echo ""

# 停止并删除旧容器
echo "1. 清理旧容器..."
docker-compose down 2>/dev/null
docker rm -f boundary-game 2>/dev/null

echo ""
echo "2. 构建 Docker 镜像..."
docker-compose build

if [ $? -ne 0 ]; then
    echo "❌ 构建失败！"
    exit 1
fi

echo ""
echo "3. 启动容器..."
docker-compose up -d

if [ $? -ne 0 ]; then
    echo "❌ 启动失败！"
    exit 1
fi

echo ""
echo "✅ 部署完成！"
echo ""
echo "========================================="
echo "  访问地址"
echo "========================================="
echo "游戏: http://$(hostname -I | awk '{print $1}'):8880"
echo "WebSocket: ws://$(hostname -I | awk '{print $1}'):3001"
echo ""
echo "========================================="
echo "  管理命令"
echo "========================================="
echo "查看日志: docker-compose logs -f"
echo "停止服务: docker-compose down"
echo "重启服务: docker-compose restart"
echo "========================================="

