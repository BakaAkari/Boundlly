# 3D模型放置目录

将你的3D模型文件放在这个目录中。

## 当前需要的模型

### 关卡环境模型
- 文件名: `Env.glb`
- 位置: `/models/Env.glb`
- 要求: 在Blender中创建的完整关卡模型
- 位置: 会自动放置在世界中心 (0,0,0)
- 碰撞: 使用模型网格自动生成碰撞体

### 武器模型（可选）
- 文件名: `assault_rifle.glb`
- 位置: `/models/assault_rifle.glb`
- 要求: 突击步枪模型
- 启用方式: 在 `src/weapon/weapons/AssaultRifle.js` 中设置 `useExternalModel: true`

## 推荐设置

### Blender导出GLB设置
1. File → Export → glTF 2.0 (.glb/.gltf)
2. 格式: GLB (推荐，单文件)
3. 勾选:
   - Include → Limit to → Selected Objects (如果只导出部分)
   - Transform → +Y Up
   - Geometry → Apply Modifiers
   - Geometry → UVs
   - Geometry → Normals
4. 取消勾选:
   - Animation (如果不需要动画)

### 关卡模型建议
- 原点: 放在关卡中心
- 单位: 米（1 Blender单位 = 1米）
- 多边形: 优化后尽量保持在合理范围（< 10万三角面）
- 材质: 使用Principled BSDF
- 纹理: 嵌入到GLB中

### 碰撞优化
如果模型太复杂导致性能问题，可以在 `main.js` 中修改：
```javascript
useSimplifiedCollision: true  // 使用包围盒碰撞（性能更好）
```

## 文件结构
```
public/
  models/
    Env.glb              # 关卡环境（必需）
    assault_rifle.glb    # 突击步枪（可选）
    shotgun.glb          # 霰弹枪（可选）
    sniper.glb           # 狙击枪（可选）
```

## 测试
放置模型后，刷新游戏页面，查看浏览器控制台：
- 看到 "关卡加载成功" - 成功
- 看到 "关卡加载失败" - 检查文件路径和格式

