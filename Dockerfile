# 多阶段构建
FROM node:18-alpine AS builder

# 构建客户端
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 生产镜像 - 使用Node.js运行服务器
FROM node:18-alpine

WORKDIR /app

# 只复制生产依赖
COPY package*.json ./
RUN npm install --only=production

# 复制构建好的静态文件和服务器
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY server.js ./

# 暴露端口
EXPOSE 3000

# 启动Node.js服务器
CMD ["node", "server.js"]

