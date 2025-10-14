#!/bin/sh

# 启动静态文件服务器（后台运行）
echo "启动静态文件服务器在端口 8080..."
serve -s /app/dist -l 8080 &

# 启动 WebSocket 服务器（前台运行）
echo "启动 WebSocket 服务器在端口 3001..."
cd /app/server
node server.js

