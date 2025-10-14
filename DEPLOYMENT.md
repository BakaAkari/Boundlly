# Cloudflare Pages 部署指南

## 为什么选择 Cloudflare Pages

- ✅ 完全免费且无限带宽
- ✅ 全球CDN网络，速度极快
- ✅ 自动HTTPS证书
- ✅ 支持自定义域名
- ✅ 国内访问速度较好
- ✅ GitHub自动部署

## 部署步骤

### 1. 准备GitHub仓库

```bash
# 初始化Git（如果还没有）
git init
git add .
git commit -m "初始提交"

# 推送到GitHub（替换为你的仓库地址）
git remote add origin https://github.com/你的用户名/仓库名.git
git branch -M main
git push -u origin main
```

**确保已提交的文件包括**：
- `package.json` - 依赖配置
- `vite.config.js` - 构建配置
- `src/` - 源代码
- `index.html` - 入口页面

### 2. 部署到Cloudflare Pages

1. **访问Cloudflare Pages**
   - 打开 [https://pages.cloudflare.com](https://pages.cloudflare.com)
   - 使用邮箱注册Cloudflare账号（或登录）

2. **创建项目**
   - 点击 "Create a project"
   - 点击 "Connect to Git"
   - 授权Cloudflare访问你的GitHub账号

3. **选择仓库**
   - 在列表中选择你的游戏仓库
   - 点击 "Begin setup"

4. **配置构建设置**
   ```
   项目名称: 自定义（将成为域名前缀）
   生产分支: main
   框架预设: Vite
   构建命令: npm run build
   构建输出目录: dist
   根目录: (留空)
   ```
   
   **如果有"Build system version"选项**：
   - 选择 "Version 1 (Legacy)" 或 "Version 2"（推荐）

5. **开始部署**
   - 点击 "Save and Deploy"
   - 等待2-3分钟构建完成

6. **获取链接**
   - 部署成功后会显示访问链接
   - 格式: `https://你的项目名.pages.dev`

### 3. 自动部署（已完成）

每次推送代码到GitHub main分支，Cloudflare会自动重新部署：

```bash
# 修改代码后
git add .
git commit -m "更新内容"
git push
# 自动触发部署
```

## 绑定自定义域名（可选）

如果你有自己的域名：

1. **进入项目设置**
   - Cloudflare Pages控制台 > 选择项目
   - 点击 "Custom domains"

2. **添加域名**
   - 点击 "Set up a custom domain"
   - 输入你的域名（如 `game.yourdomain.com`）

3. **配置DNS**
   - 按照提示添加CNAME记录
   - 或将域名托管到Cloudflare（推荐）

4. **等待生效**
   - DNS生效通常需要几分钟到几小时

## 常见问题

### Q: 部署失败怎么办？

**错误：Missing entry-point to Worker script**
- 原因：Cloudflare Pages配置问题
- 解决方案：
  1. 进入项目 Settings > Builds & deployments
  2. 点击 "Edit configuration"
  3. 配置如下：
     - Framework preset: `Vite`
     - Build command: `npm run build`
     - Build output directory: `dist`
     - Root directory: (留空)
  4. 如果有"Build system version"，选择 `Version 2`
  5. 点击 "Save"
  6. 返回 Deployments 页面，点击 "Retry deployment"

**检查构建日志**：
- 进入项目 > 点击失败的部署 > 查看构建日志
- 常见问题：依赖安装失败，检查 `package.json`

**本地测试**：
```bash
# 本地测试构建
npm run build

# 确认dist文件夹生成成功
ls dist
```

### Q: 游戏无法运行？

**检查PointerLock API**：
- 必须使用HTTPS（Cloudflare自动提供）
- 本地测试使用 `npm run dev`

### Q: 如何查看流量统计？

- Cloudflare Pages控制台 > Analytics
- 查看访问量、带宽使用等

### Q: 如何回滚到之前版本？

1. 进入项目 > Deployments
2. 找到想要恢复的版本
3. 点击 "..." > "Rollback to this deployment"

## 性能优化建议

### 1. 启用缓存
Cloudflare自动为静态资源启用CDN缓存，无需配置。

### 2. 压缩优化
Vite已自动处理代码压缩和优化。

### 3. 添加加载提示
在 `index.html` 的 `<body>` 开始处添加：
```html
<div id="loading" style="position: fixed; inset: 0; background: #000; 
     display: flex; align-items: center; justify-content: center; 
     color: #0f0; font-size: 24px; z-index: 9999;">
  游戏加载中...
</div>
<script>
  window.addEventListener('load', () => {
    setTimeout(() => {
      document.getElementById('loading')?.remove();
    }, 1000);
  });
</script>
```

## 更新游戏

每次修改后，只需：

```bash
git add .
git commit -m "描述你的更新"
git push
```

Cloudflare会自动部署，1-2分钟后生效。

## 项目管理

### 查看部署历史
```
Cloudflare Pages控制台 > 项目 > Deployments
```

### 环境变量（如需要）
```
项目设置 > Environment variables
```

### 删除项目
```
项目设置 > 最下方 > Delete project
```

## 快速命令参考

```bash
# 开发
npm run dev

# 本地构建测试
npm run build
npm run preview

# 部署（推送到GitHub即可）
git push
```

## 费用说明

Cloudflare Pages完全免费，包括：
- 无限请求数
- 无限带宽
- 500次构建/月
- 自动HTTPS
- 全球CDN

超过限制后仍免费，只是构建队列会延迟。

---

**部署完成！** 分享你的链接给朋友，开始游戏吧！ 🎮
