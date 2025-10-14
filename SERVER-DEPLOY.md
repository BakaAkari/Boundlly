# 服务器部署

## Windows → Unraid 部署流程

### 1. Windows 上构建并导出镜像

```powershell
# 构建镜像
docker build -f server/Dockerfile -t boundary-game:latest .

# 导出镜像
docker save boundary-game:latest -o boundary-game.tar
```

### 2. 上传 tar 文件到 Unraid

将 `boundary-game.tar` 复制到 Unraid 共享文件夹（如 `\\unraid服务器IP\appdata\`）

### 3. SSH 连接 Unraid 并部署

```bash
# 进入文件位置
cd /mnt/user/appdata

# 导入镜像
docker load < boundary-game.tar

# 运行容器
docker run -d \
  --name boundary-game \
  -p 8880:8080 \
  -p 3001:3001 \
  --restart unless-stopped \
  boundary-game:latest

# 查看运行状态
docker ps | grep boundary-game

# 查看日志
docker logs boundary-game
```

## NPM 反向代理配置

1. 主机设置：`http://服务器IP:8880`
2. 启用 **Websockets Support**
3. 添加 Custom Location: `/ws` → `http://服务器IP:3001`
4. 配置 SSL 证书

## 访问

**直接访问**：`http://UnraidIP:8880`

**域名访问**：`https://boundary.你的域名.com`

