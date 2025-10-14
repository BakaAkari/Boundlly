# 多阶段构建
FROM node:18-alpine AS builder

# 构建客户端
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 生产镜像
FROM node:18-alpine

WORKDIR /app

# 安装服务器依赖
COPY server/package*.json ./server/
RUN cd server && npm install --production

# 复制服务器代码
COPY server/server.js ./server/

# 复制构建好的客户端
COPY --from=builder /app/dist ./dist

# 安装静态文件服务器
RUN npm install -g serve

# 暴露端口
EXPOSE 8080 3001

# 启动脚本
COPY server/start.sh ./
RUN chmod +x start.sh

CMD ["./start.sh"]

