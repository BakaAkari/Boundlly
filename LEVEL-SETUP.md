# 关卡模型设置指南

## 1. 在Blender中创建关卡

### 基本设置
- **单位**: 使用米（Blender单位 = 游戏米）
- **原点**: 将关卡放在世界原点 (0,0,0)
- **推荐尺寸**: 关卡应该在100米半径范围内（配合游戏区域）

### 建模建议
- 使用实体网格（不要用面片）
- 避免重叠面和内部面
- 合并不需要独立移动的对象
- 应用所有变换（Ctrl+A → All Transforms）

### 材质设置
- 使用Principled BSDF
- 纹理可以嵌入或使用相对路径
- 确保所有面法向正确（Shift+N 重算法向）

## 2. 导出GLB

### 导出步骤
1. **File** → **Export** → **glTF 2.0 (.glb/.gltf)**
2. 设置选项：

```
格式: glTF Binary (.glb)  ← 重要！

Include:
  ☑ Selected Objects (如果只导出选中对象)
  ☐ Custom Properties (不需要)
  ☐ Cameras (不需要)
  ☐ Punctual Lights (使用游戏的光源)

Transform:
  ☑ +Y Up  ← 重要！确保坐标系正确

Geometry:
  ☑ Apply Modifiers
  ☑ UVs
  ☑ Normals
  ☑ Tangents (如果有法线贴图)
  ☐ Vertex Colors (可选)

Materials:
  ☑ Materials
  ☑ Images (嵌入纹理)

Animation:
  ☐ Animation (静态场景不需要)
```

3. 保存为 `Env.glb`

## 3. 放置文件

将导出的 `Env.glb` 文件放到项目目录：

```
boundlly/
  public/
    models/
      Env.glb  ← 放在这里
```

## 4. 启动游戏

运行游戏，查看浏览器控制台（F12）：

### 成功加载
```
========================================
开始加载关卡环境...
========================================
加载进度: 100.00%
GLB文件加载成功，开始处理...
模型包含的对象: 5
处理Mesh: Floor
处理Mesh: Wall1
...
✓ 关卡加载成功
✓ 处理了 5 个Mesh
✓ 创建了 5 个碰撞体
✓ 模型尺寸: 80.00 x 50.00 x 80.00
✓ 模型中心: (0.00, 0.00, 0.00)
========================================
✓ 关卡环境加载完成
========================================
```

### 加载失败
```
✗ GLB模型加载失败，使用测试关卡
错误信息: Failed to load
提示：将你的 Env.glb 文件放到 public/models/ 目录
```
→ 会自动创建一个灰色立方体作为测试关卡

## 5. 碰撞类型选择

在 `src/main.js` 中修改：

```javascript
// 精确网格碰撞（推荐，中等复杂度模型）
useSimplifiedCollision: false

// 简化包围盒碰撞（性能模式，超复杂模型）
useSimplifiedCollision: true
```

## 6. 调试技巧

### 查看模型是否加载
- 按F12打开控制台
- 查看加载日志和错误信息

### 查看模型位置和大小
- 控制台会显示模型包围盒信息
- 确保模型中心在 (0,0,0) 附近
- 确保尺寸在100米范围内

### 如果看不到模型
1. 检查模型太小或太大
2. 检查模型是否在游戏区域外
3. 检查材质是否透明
4. 检查法向是否朝外

### 性能问题
- 如果碰撞创建太慢，改用 `useSimplifiedCollision: true`
- 在Blender中减少多边形数量
- 分离复杂和简单碰撞对象

## 7. 常见问题

**Q: 模型加载了但看不见？**
- 检查模型尺寸是否合适（控制台显示）
- 确保相机在游戏区域内
- 检查材质是否有效

**Q: 碰撞不准确？**
- 使用 `useSimplifiedCollision: false`
- 确保网格是实体的（不是面片）
- 检查法向和重叠面

**Q: 性能下降？**
- 改用 `useSimplifiedCollision: true`
- 减少模型多边形数量
- 使用LOD（细节层次）系统

**Q: 文件路径错误？**
- 确保文件在 `public/models/Env.glb`
- Vite会自动处理public目录
- 访问路径是 `/models/Env.glb`（不是 `/public/models/...`）

