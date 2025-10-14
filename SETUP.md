# 开发环境配置指南

## 必需环境

### 1. Node.js 和 npm
**版本要求**: Node.js 16.x 或更高

**安装方式**:
- 访问 [https://nodejs.org/](https://nodejs.org/)
- 下载并安装 LTS 版本（推荐 18.x 或 20.x）
- 验证安装:
  ```bash
  node --version  # 应显示 v18.x.x 或更高
  npm --version   # 应显示 9.x.x 或更高
  ```

### 2. 代码编辑器
**推荐**: Visual Studio Code

**必装插件**:
- ES6 String HTML
- glTF Tools (预览3D模型)
- Prettier - Code formatter
- ESLint

**可选插件**:
- Live Server (快速预览)
- JavaScript (ES6) code snippets

## 项目初始化

### 1. 创建项目结构
```bash
# 初始化npm项目
npm init -y

# 创建目录结构
mkdir -p src/{scene,player,weapon,asteroid,physics,utils}
mkdir -p assets/{models,textures/skybox,sounds}
mkdir public
```

### 2. 安装核心依赖
```bash
# Three.js核心库
npm install three

# 物理引擎
npm install cannon-es

# 开发工具
npm install --save-dev vite

# 可选：动画库
npm install gsap
```

### 3. 配置 package.json
```json
{
  "name": "boundary-fps",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "three": "^0.160.0",
    "cannon-es": "^0.20.0",
    "gsap": "^3.12.0"
  },
  "devDependencies": {
    "vite": "^5.0.0"
  }
}
```

### 4. 创建 vite.config.js
```javascript
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true
  }
});
```

### 5. 创建基础 HTML 文件
**index.html** (放在项目根目录):
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>太空FPS游戏</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      overflow: hidden;
      font-family: Arial, sans-serif;
    }
    
    #canvas-container {
      width: 100vw;
      height: 100vh;
    }
    
    #blocker {
      position: absolute;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    #instructions {
      width: 100%;
      max-width: 500px;
      padding: 30px;
      background-color: rgba(0, 0, 0, 0.9);
      border: 2px solid #00ff00;
      color: #fff;
      text-align: center;
    }
    
    #instructions h1 {
      color: #00ff00;
      margin-bottom: 20px;
    }
    
    #instructions p {
      margin: 10px 0;
      line-height: 1.6;
    }
    
    #crosshair {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 20px;
      height: 20px;
      pointer-events: none;
      display: none;
    }
    
    #crosshair::before,
    #crosshair::after {
      content: '';
      position: absolute;
      background-color: #00ff00;
    }
    
    #crosshair::before {
      top: 50%;
      left: 0;
      width: 100%;
      height: 2px;
      transform: translateY(-50%);
    }
    
    #crosshair::after {
      left: 50%;
      top: 0;
      width: 2px;
      height: 100%;
      transform: translateX(-50%);
    }
  </style>
</head>
<body>
  <div id="blocker">
    <div id="instructions">
      <h1>太空FPS游戏</h1>
      <p><strong>移动:</strong> W/A/S/D</p>
      <p><strong>上升:</strong> Space</p>
      <p><strong>下降:</strong> Shift</p>
      <p><strong>视角:</strong> 鼠标移动</p>
      <p><strong>射击:</strong> 鼠标左键</p>
      <p style="margin-top: 20px; color: #00ff00;">
        <strong>点击屏幕开始游戏</strong>
      </p>
    </div>
  </div>
  
  <div id="canvas-container"></div>
  <div id="crosshair"></div>
  
  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

## 开发工具配置

### VS Code 推荐设置
创建 `.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.tabSize": 2,
  "files.autoSave": "afterDelay",
  "files.autoSaveDelay": 1000,
  "emmet.includeLanguages": {
    "javascript": "javascriptreact"
  }
}
```

### Prettier 配置
创建 `.prettierrc`:
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 80
}
```

### Git 配置
创建 `.gitignore`:
```
node_modules/
dist/
.DS_Store
*.log
.env
.vscode/
```

## 资源准备

### 1. 3D模型资源
**获取途径**:
- [Sketchfab](https://sketchfab.com/) - 免费3D模型下载
- [Poly Haven](https://polyhaven.com/) - 高质量免费资源
- [TurboSquid](https://www.turbosquid.com/) - 付费/免费模型
- [Kenney](https://kenney.nl/assets) - 免费游戏资源包

**所需模型**:
- 枪械模型 (GLTF/GLB格式，推荐低多边形风格)
- 碎石模型 (3-5个不同形状的变体)

**模型要求**:
- 格式: `.gltf` 或 `.glb`
- 多边形数: 枪械<5000面，碎石<500面
- 包含UV贴图坐标
- 尺寸单位统一（推荐米）

### 2. 贴图资源
**天空盒贴图** (6张，命名规范):
- `px.jpg` / `nx.jpg` (正/负X轴)
- `py.jpg` / `ny.jpg` (正/负Y轴)
- `pz.jpg` / `nz.jpg` (正/负Z轴)
- 推荐尺寸: 1024x1024 或 2048x2048

**PBR材质贴图** (碎石):
- `asteroid_Col.jpg` - 基础颜色
- `asteroid_Nor.jpg` - 法线贴图
- `asteroid_ORME.jpg` - ORM复合贴图
  - R通道: AO (环境光遮蔽)
  - G通道: Roughness (粗糙度)
  - B通道: Metallic (金属度)

**获取途径**:
- [Poly Haven Textures](https://polyhaven.com/textures) - 免费PBR材质
- [CC0 Textures](https://cc0textures.com/) - 免费商用贴图
- [TextureCan](https://www.texturecan.com/) - 免费贴图库

### 3. 音效资源
**所需音效**:
- 射击音效 (`gunshot.mp3`)
- 碰撞音效 (`impact.mp3`)
- 环境音效 (`ambient.mp3`)

**获取途径**:
- [Freesound](https://freesound.org/) - 免费音效库
- [Zapsplat](https://www.zapsplat.com/) - 免费音效（需注册）

## 浏览器要求

### 支持的浏览器
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

### 必需的浏览器特性
- WebGL 2.0
- Pointer Lock API
- ES6 Module 支持

### 性能建议
- 推荐使用独立显卡
- 至少4GB内存
- 开启硬件加速

## 启动项目

### 开发模式
```bash
npm run dev
```
访问: `http://localhost:3000`

### 构建生产版本
```bash
npm run build
```
输出目录: `dist/`

### 预览生产版本
```bash
npm run preview
```

## 调试工具

### Chrome DevTools
- **F12** 打开开发者工具
- **Performance** 标签：性能分析
- **Memory** 标签：内存泄漏检测

### Three.js Inspector
Chrome扩展：[Three.js Developer Tools](https://chrome.google.com/webstore/detail/threejs-developer-tools/ebpnegggocnnhleeicgljbedjkganaek)

### Stats.js 性能监控
```bash
npm install stats.js
```

```javascript
import Stats from 'stats.js';

const stats = new Stats();
stats.showPanel(0); // 0: fps, 1: ms, 2: mb
document.body.appendChild(stats.dom);

function animate() {
  stats.begin();
  // 渲染代码
  stats.end();
}
```

## 常见问题

### Q: Vite启动报错 "Cannot find module"
**解决**: 确保 `package.json` 中设置 `"type": "module"`

### Q: Three.js导入报错
**解决**: 使用正确的导入路径
```javascript
// 正确
import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';

// 错误
import * as THREE from 'three/build/three.module.js';
```

### Q: GLTF模型加载失败
**解决**: 
- 检查文件路径是否正确
- 确保模型文件在 `public/` 或 `assets/` 目录
- 使用相对于public的路径加载

### Q: PointerLock在Firefox不工作
**解决**: 需要HTTPS或localhost环境

## 下一步

环境配置完成后，可以开始：
1. 创建基础Three.js场景 (`src/main.js`)
2. 添加天空盒和光照
3. 实现玩家控制器
4. 按照IMPLEMENTATION.md中的阶段逐步开发

---

**配置完成检查清单**:
- [ ] Node.js已安装（v16+）
- [ ] npm依赖已安装
- [ ] Vite开发服务器可正常启动
- [ ] 浏览器支持WebGL 2.0
- [ ] VS Code及插件已配置
- [ ] 项目目录结构已创建
- [ ] index.html基础文件已创建
- [ ] 资源文件夹已准备好

