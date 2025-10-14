# Unraid 服务器直接部署

## 方法一：使用 Docker Compose（推荐）

```bash
# 进入项目目录
cd /mnt/user/Cache/boundlly

# 构建并启动容器
docker-compose up -d --build

# 查看运行状态
docker-compose ps

# 查看日志
docker-compose logs -f boundary-game
```

## 方法二：直接使用 Docker 命令

```bash
# 进入项目目录
cd /mnt/user/Cache/boundlly

# 构建镜像
docker build -f server/Dockerfile -t boundary-game:latest .

# 运行容器
docker run -d \
  --name boundary-game \
  -p 8880:8080 \
  -p 3001:3001 \
  -e WS_PORT=3001 \
  -e NODE_ENV=production \
  --restart unless-stopped \
  boundary-game:latest

# 查看运行状态
docker ps | grep boundary-game

# 查看日志
docker logs -f boundary-game
```

## 常用管理命令

```bash
# 停止容器
docker-compose down
# 或
docker stop boundary-game

# 重新构建并启动
docker-compose up -d --build --force-recreate

# 删除旧镜像
docker image prune -a

# 查看容器日志
docker-compose logs -f
```

## 访问地址

- 游戏界面：`http://Unraid服务器IP:8880`
- WebSocket：`ws://Unraid服务器IP:3001`

## 端口说明

- `8880`: 静态文件服务（客户端）
- `3001`: WebSocket 服务器（多人游戏）

