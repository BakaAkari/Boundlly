#!/bin/bash

# Unraid Docker 自动部署脚本
# 用于卸载旧容器、重新构建镜像并启动容器

set -e  # 遇到错误立即退出

echo "================================"
echo "Boundary Game Docker 部署脚本"
echo "================================"
echo ""

# 配置
CONTAINER_NAME="boundary-game"
IMAGE_NAME="boundary-game:latest"

# 1. 停止并删除现有容器
echo "[1/4] 检查并停止现有容器..."
if docker ps -a | grep -q $CONTAINER_NAME; then
    echo "发现容器 $CONTAINER_NAME，正在停止并删除..."
    docker stop $CONTAINER_NAME 2>/dev/null || true
    docker rm $CONTAINER_NAME 2>/dev/null || true
    echo "✓ 容器已删除"
else
    echo "未发现运行中的容器"
fi
echo ""

# 2. 删除旧镜像
echo "[2/4] 检查并删除旧镜像..."
if docker images | grep -q "boundary-game"; then
    echo "发现镜像 $IMAGE_NAME，正在删除..."
    docker rmi $IMAGE_NAME 2>/dev/null || true
    echo "✓ 镜像已删除"
else
    echo "未发现旧镜像"
fi
echo ""

# 3. 构建新镜像
echo "[3/4] 开始构建新镜像..."
echo "提示: 如遇网络问题，请配置Docker镜像加速器"
echo ""

# 尝试构建，失败后重试
MAX_RETRIES=3
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    echo "尝试构建镜像 (第 $((RETRY_COUNT + 1)) 次)..."
    docker-compose build --no-cache
    
    if [ $? -eq 0 ]; then
        echo "✓ 镜像构建成功"
        break
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
            echo "构建失败，10秒后重试..."
            sleep 10
        else
            echo "✗ 镜像构建失败，已重试 $MAX_RETRIES 次"
            echo ""
            echo "解决方案："
            echo "1. 检查网络连接"
            echo "2. 配置Docker镜像加速器（阿里云/腾讯云/网易云等）"
            echo "3. 在 /etc/docker/daemon.json 中添加："
            echo '   {"registry-mirrors": ["https://docker.mirrors.ustc.edu.cn"]}'
            echo "4. 重启Docker: systemctl restart docker"
            exit 1
        fi
    fi
done
echo ""

# 4. 启动容器
echo "[4/4] 启动容器..."
docker-compose up -d
if [ $? -eq 0 ]; then
    echo "✓ 容器启动成功"
else
    echo "✗ 容器启动失败"
    exit 1
fi
echo ""

# 显示容器状态
echo "================================"
echo "部署完成！容器状态："
echo "================================"
docker ps | grep $CONTAINER_NAME
echo ""
echo "访问地址: http://your-unraid-ip:3213"
echo "================================"

