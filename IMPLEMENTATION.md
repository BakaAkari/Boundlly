# Three.js Boundlly - 技术实现文档

## 项目概述
开发一个基于Three.js的第一人称射击游戏，玩家在太空环境中飞行，手持武器，与太空碎石进行物理交互。

## 技术栈

### 核心库
- **Three.js** (r160+) - 3D渲染引擎
- **Cannon.js / Cannon-es** - 物理引擎（碰撞检测）
- **PointerLockControls** - 鼠标锁定控制
- **GLTFLoader** - 3D模型加载器

### 辅助库（可选）
- **stats.js** - 性能监控
- **dat.gui** - 调试面板
- **Howler.js** - 音效系统

## 核心功能模块

### 1. 场景系统
```
场景管理器
├── 太空背景（星空天空盒/粒子系统）
├── 环境光照（点光源/环境光）
├── 碎石生成系统（程序化生成）
└── 雾效（可选，增强深度感）
```

**实现方案：**
- 使用 `CubeTextureLoader` 加载太空天空盒（6张星空贴图）
- 使用 `PointLight` 模拟远处的星体光源
- 使用 `InstancedMesh` 批量渲染碎石（性能优化）

### 2. 玩家控制系统

#### 2.1 第一人称视角
```javascript
核心组件：
- PointerLockControls（鼠标控制视角）
- 虚拟相机容器（玩家实体）
- 物理刚体（碰撞检测）
```

**实现方案：**
- 创建一个 `Object3D` 作为玩家容器
- 相机作为容器的子对象
- 鼠标Y轴旋转相机，X轴旋转容器

#### 2.2 移动控制
```javascript
WASD键位映射：
W - 前进（相对相机朝向）
S - 后退
A - 左移
D - 右移
Space - 向上飞行
Shift - 向下飞行
```

**实现方案：**
- 使用键盘事件监听器记录按键状态
- 在 `requestAnimationFrame` 循环中根据按键状态更新位置
- 使用 `Vector3` 计算相对于相机方向的移动向量

### 3. 武器系统

#### 3.1 双手持枪模型
```
武器渲染层级：
玩家容器
└── 相机
    └── 武器容器（固定在相机前方）
        ├── 左手
        ├── 右手
        └── 枪械模型
```

**实现方案：**
- 使用GLTF格式的低多边形枪械模型
- 将武器模型设置为相机子对象，固定在视野底部
- 使用独立的渲染层（`layers`）避免视角穿模

#### 3.2 射击功能
```javascript
射击系统：
- 鼠标左键触发射击
- Raycaster射线检测
- 粒子效果（枪口火焰）
- 后坐力动画
```

**实现方案：**
- 使用 `Raycaster` 从相机中心发射射线
- 检测射线与碎石的交互
- 使用 `TweenMax/GSAP` 实现后坐力动画
- 添加枪口粒子效果

### 4. 碎石系统

#### 4.1 碎石生成
```javascript
生成策略：
- 程序化生成（随机位置、大小、旋转）
- 分区域生成（LOD优化）
- 不同形状的石头模型（3-5种变体）
```

**实现方案：**
```javascript
// 伪代码
for (let i = 0; i < asteroidCount; i++) {
  const geometry = randomAsteroidGeometry();
  const material = new MeshStandardMaterial({
    map: textureCol,
    normalMap: textureNor,
    roughnessMap/metallicMap/aoMap: textureORME
  });
  const mesh = new Mesh(geometry, material);
  mesh.position.set(
    random(-range, range),
    random(-range, range),
    random(-range, range)
  );
  mesh.rotation.set(randomRotation());
  scene.add(mesh);
}
```

#### 4.2 碰撞检测
```javascript
物理引擎选型：
- Cannon.js（轻量级，适合简单碰撞）
- Ammo.js（功能强大，但体积大）
推荐：Cannon-es（Cannon.js的ES6版本）
```

**实现方案：**
- 为玩家创建球形或胶囊形刚体
- 为每个碎石创建凸包刚体
- 同步Three.js网格与物理刚体位置
- 处理碰撞事件（减速、反弹）

### 5. 性能优化

#### 5.1 渲染优化
- **Instanced Rendering**: 使用 `InstancedMesh` 批量渲染相同碎石
- **Frustum Culling**: Three.js自动视锥剔除
- **LOD系统**: 远处碎石使用低模
- **纹理优化**: 使用压缩纹理格式（KTX2）

#### 5.2 物理优化
- **空间分区**: 只对视野范围内碎石启用物理
- **休眠机制**: 静止碎石进入休眠状态
- **简化碰撞体**: 使用简化的碰撞盒

## 项目文件结构

```
Boundary/
├── index.html              # 入口HTML
├── src/
│   ├── main.js            # 主入口
│   ├── scene/
│   │   ├── SceneManager.js    # 场景管理
│   │   ├── Lighting.js        # 光照系统
│   │   └── Skybox.js          # 天空盒
│   ├── player/
│   │   ├── Player.js          # 玩家控制器
│   │   ├── InputManager.js    # 输入管理
│   │   └── Camera.js          # 相机控制
│   ├── weapon/
│   │   ├── Gun.js             # 枪械类
│   │   ├── Shooting.js        # 射击逻辑
│   │   └── WeaponAnimation.js # 武器动画
│   ├── asteroid/
│   │   ├── AsteroidGenerator.js  # 碎石生成器
│   │   └── AsteroidPool.js       # 对象池
│   ├── physics/
│   │   ├── PhysicsWorld.js    # 物理世界
│   │   └── CollisionHandler.js # 碰撞处理
│   └── utils/
│       ├── AssetLoader.js     # 资源加载器
│       └── MathUtils.js       # 数学工具
├── assets/
│   ├── models/
│   │   ├── gun.gltf          # 枪械模型
│   │   └── asteroid.gltf     # 碎石模型
│   ├── textures/
│   │   ├── skybox/           # 天空盒贴图
│   │   ├── asteroid_Col.jpg  # 碎石颜色贴图
│   │   ├── asteroid_Nor.jpg  # 碎石法线贴图
│   │   └── asteroid_ORME.jpg # 碎石ORM贴图
│   └── sounds/
│       └── gunshot.mp3       # 射击音效
├── package.json
└── vite.config.js           # 构建配置（使用Vite）
```

## 开发步骤

### 阶段1：基础搭建（1-2天）
1. ✅ 创建项目结构
2. ✅ 配置开发环境（Vite + Three.js）
3. ✅ 实现基础场景（相机、渲染器、灯光）
4. ✅ 添加太空天空盒

### 阶段2：玩家控制（2-3天）
1. ✅ 实现PointerLockControls
2. ✅ WASD移动系统
3. ✅ 鼠标视角控制
4. ✅ 飞行物理（惯性、加速度）

### 阶段3：碎石系统（2-3天）
1. ✅ 创建碎石几何体（多种形状）
2. ✅ 程序化生成碎石场景
3. ✅ 添加碎石纹理和材质
4. ✅ 实现缓慢旋转动画

### 阶段4：物理碰撞（2-3天）
1. ✅ 集成Cannon-es
2. ✅ 创建玩家刚体
3. ✅ 为碎石添加碰撞体
4. ✅ 同步物理与渲染
5. ✅ 碰撞反馈（减速/反弹）

### 阶段5：武器系统（2-3天）
1. ✅ 加载枪械模型
2. ✅ 绑定到相机（第一人称视角）
3. ✅ 射击射线检测
4. ✅ 后坐力动画
5. ✅ 枪口火焰特效

### 阶段6：优化与完善（2-3天）
1. ✅ 性能优化（Instancing、LOD）
2. ✅ 添加音效
3. ✅ UI界面（准星、弹药计数）
4. ✅ 调试和测试

## 技术难点与解决方案

### 难点1：流畅的第一人称控制
**问题**: 鼠标控制可能出现抖动或延迟
**解决方案**:
- 使用 `PointerLockControls` 的官方实现
- 在物理更新循环中使用固定时间步长
- 分离渲染帧率与物理更新频率

### 难点2：大量碎石的性能
**问题**: 数百个碎石导致帧率下降
**解决方案**:
- 使用 `InstancedMesh` 批量渲染相同模型
- 实现视锥剔除和距离剔除
- 使用对象池管理碎石实例

### 难点3：物理碰撞精度
**问题**: 高速移动时穿模
**解决方案**:
- 启用CCD（连续碰撞检测）
- 限制最大移动速度
- 使用较小的物理时间步长

### 难点4：武器视觉穿模
**问题**: 武器靠近墙壁时穿透显示
**解决方案**:
- 使用独立渲染层（Layer 1）渲染武器
- 调整武器相机的near平面
- 或使用双相机系统（主场景+武器overlay）

## 进阶功能（可选）

### 1. 射击效果增强
- 碎石受击爆炸效果
- 碎石破碎（动态几何体）
- 弹孔贴花

### 2. 游戏性拓展
- 弹药系统和装填动画
- 多种武器切换
- 敌人AI（自动飞行的碎石）
- 计分系统

### 3. 视觉效果
- 后处理效果（Bloom、色差）
- 太空粒子（星尘）
- 引擎尾焰特效
- 动态速度线

### 4. 声音设计
- 3D音效定位
- 环境音（太空氛围）
- 射击回声
- 碰撞音效

## 技术选型建议

### 物理引擎对比
| 引擎 | 优点 | 缺点 | 推荐度 |
|------|------|------|--------|
| Cannon-es | 轻量、易用、ES6 | 功能相对简单 | ⭐⭐⭐⭐⭐ |
| Ammo.js | 功能强大、精确 | 体积大、学习曲线陡 | ⭐⭐⭐ |
| Rapier | 现代、高性能、WASM | 文档较少 | ⭐⭐⭐⭐ |

### 构建工具
- **Vite** (推荐): 快速热更新，现代化
- **Webpack**: 成熟稳定，但配置复杂
- **Parcel**: 零配置，但定制性差

## 预估工作量
- **核心功能开发**: 10-15天
- **优化与调试**: 3-5天
- **美术资源制作**: 5-7天（如外包可并行）
- **总计**: 约3-4周（单人开发）

## 参考资源

### 官方文档
- [Three.js文档](https://threejs.org/docs/)
- [Cannon-es文档](https://pmndrs.github.io/cannon-es/)

### 示例项目
- Three.js官方FPS示例: `examples/misc_controls_pointerlock.html`
- Yuka引擎FPS示例

### 学习资料
- Bruno Simon的Three.js Journey课程
- Discover Three.js书籍

---

**文档版本**: 1.0  
**创建日期**: 2025-10-14  
**状态**: 初版-待审核

