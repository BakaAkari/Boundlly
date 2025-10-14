# 太空FPS游戏

基于Three.js开发的第一人称太空射击游戏。

## 快速启动

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000

## 操作说明

- **移动**: W/A/S/D
- **上升**: Space
- **下降**: Shift
- **视角**: 鼠标移动
- **射击**: 鼠标左键
- **开始游戏**: 点击屏幕锁定鼠标

## 项目结构

```
src/
├── main.js                    # 游戏主入口
├── scene/
│   └── SceneManager.js       # 场景管理（相机、渲染器、光照、星空）
├── player/
│   ├── Player.js             # 玩家控制器（移动、物理）
│   └── InputManager.js       # 键盘输入管理
├── asteroid/
│   └── AsteroidGenerator.js  # 碎石生成器
├── physics/
│   └── PhysicsWorld.js       # 物理世界（Cannon-es）
└── weapon/
    └── Gun.js                # 武器系统（射击、后坐力、弹药）
```

## 已实现功能

✅ 第一人称视角控制（鼠标锁定）  
✅ 六自由度飞行（WASD + 空格/Shift）  
✅ 太空环境（星空背景、无重力）  
✅ 碎石程序化生成（50个不规则碎石）  
✅ 物理碰撞系统（玩家与碎石碰撞）  
✅ 射击系统（射线检测、后坐力、枪口火焰）  
✅ 弹药系统（30/120弹药、自动装填）  
✅ UI界面（准星、弹药计数、FPS）

## 技术栈

- **Three.js** - 3D渲染
- **Cannon-es** - 物理引擎
- **GSAP** - 动画
- **Vite** - 构建工具

