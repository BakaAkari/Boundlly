# 模型规范文档

## 命名规则

### 碰撞代理网格
- **前缀**: `UCX_` (与UE4/UE5保持一致)
- **格式**: `UCX_[主网格名]`
- **示例**: `UCX_Wall_01`, `UCX_Floor_01`, `UCX_Stairs_01`

### 主模型网格
- **命名**: 描述性名称，无特殊前缀
- **示例**: `Wall_01`, `Floor_01`, `Pillar_01`

## 模型组织

```
场景模型 (Env_01)
├── 主模型网格 (用于渲染)
│   ├── Wall_01
│   ├── Floor_01
│   └── Pillar_01
├── 碰撞代理网格 (用于碰撞)
│   ├── UCX_Wall_01
│   ├── UCX_Floor_01
│   └── UCX_Pillar_01
└── 装饰网格 (可选)
    └── Decoration_01
```

## 碰撞代理创建原则

### 几何体要求
- **简单形状**: 优先使用Box、Cylinder等基本几何体
- **低面数**: 避免复杂几何体，保持性能
- **完整覆盖**: 确保碰撞代理完全覆盖主模型

### 内凹结构处理
- **必须创建**: 所有内凹区域都需要对应的UCX_代理
- **分解处理**: 复杂内凹结构分解为多个简单碰撞体
- **精确匹配**: 碰撞代理应准确反映可碰撞区域

## 导出设置

### GLB导出配置
```
文件 → 导出 → glTF 2.0 (.glb)

Transform:
☑ Apply Modifiers
☑ Include Children

Geometry:
☑ Apply Modifiers
☑ UVs
☑ Normals

Materials:
☑ Export Materials

Advanced:
☑ Use Draco Compression (推荐)
```

## 检测逻辑

代码会自动检测：
1. **UCX_前缀**: 自动标记为碰撞代理
2. **普通网格**: 需要手动设置`needsCollision`标记
3. **优先级**: UCX_代理优先于普通网格

## 注意事项

- 碰撞代理在Blender中设为不可见（不导出材质）
- 保持碰撞代理的变换与主模型同步
- 测试时确保所有内凹区域都有对应碰撞
