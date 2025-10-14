# 客户端编译和部署

## 编译

```bash
# 安装依赖
npm install

# 构建生产版本
npm run build
```

构建产物在 `dist/` 目录

## 部署

### 静态文件部署（单人模式）

将 `dist/` 目录部署到任意静态文件服务器：
- Nginx
- Apache
- Caddy
- CDN

### 完整部署（多人模式）

使用 Docker 部署完整服务（包含客户端和服务器）

参考：[SERVER-DEPLOY.md](./SERVER-DEPLOY.md)

## 本地开发

```bash
# 仅客户端
npm run dev

# 客户端 + 服务器
npm run dev:all
```

