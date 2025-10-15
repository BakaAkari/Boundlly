import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class LevelLoader {
  constructor(scene, physicsWorld, options = {}) {
    this.scene = scene;
    this.physicsWorld = physicsWorld;
    this.levelModel = null;
    this.collisionBodies = [];
    
    // 碰撞选项
    this.options = {
      useSimplifiedCollision: options.useSimplifiedCollision ?? false, // 使用简化碰撞（包围盒）
      collisionMargin: options.collisionMargin ?? 0.1 // 碰撞边距
    };
  }

  createTestLevel() {
    // 创建一个测试立方体作为简单关卡
    console.log('创建测试关卡（立方体）');
    
    const geometry = new THREE.BoxGeometry(20, 20, 20);
    const material = new THREE.MeshStandardMaterial({
      color: 0x888888,
      metalness: 0.3,
      roughness: 0.7
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 0, 0);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    this.scene.add(mesh);
    
    // 创建碰撞
    const shape = new CANNON.Box(new CANNON.Vec3(10, 10, 10));
    const body = new CANNON.Body({
      mass: 0,
      shape: shape,
      material: new CANNON.Material({ friction: 0.5, restitution: 0.3 })
    });
    body.position.set(0, 0, 0);
    
    this.physicsWorld.world.addBody(body);
    this.collisionBodies.push(body);
    
    console.log('✓ 测试关卡创建完成');
    
    return mesh;
  }

  async loadLevel(modelPath) {
    return new Promise((resolve, reject) => {
      const loader = new GLTFLoader();
      
      console.log(`尝试加载关卡: ${modelPath}`);
      
      loader.load(
        modelPath,
        (gltf) => {
          this.levelModel = gltf.scene;
          
          console.log('GLB文件加载成功，开始处理...');
          console.log('模型包含的对象:', this.levelModel.children.length);
          
          // 设置模型位置在世界中心
          this.levelModel.position.set(0, 0, 0);
          this.levelModel.scale.set(1, 1, 1);
          
          let meshCount = 0;
          
          // 遍历模型所有mesh，创建碰撞
          this.levelModel.traverse((child) => {
            if (child.isMesh) {
              meshCount++;
              console.log(`处理Mesh: ${child.name || 'unnamed'}`);
              
              // 确保材质可见和接受光照
              if (child.material) {
                child.material.side = THREE.DoubleSide;
                
                // 如果是MeshStandardMaterial，确保正确接受光照
                if (child.material.isMeshStandardMaterial) {
                  child.material.needsUpdate = true;
                }
                
                // 如果材质是数组
                if (Array.isArray(child.material)) {
                  child.material.forEach(mat => {
                    mat.side = THREE.DoubleSide;
                    mat.needsUpdate = true;
                  });
                }
              }
              
              // 启用阴影
              child.castShadow = true;
              child.receiveShadow = true;
              
              // 为每个mesh创建碰撞体（已经有错误处理）
              if (this.options.useSimplifiedCollision) {
                this.createSimplifiedCollision(child);
              } else {
                this.createMeshCollision(child);
              }
            }
          });
          
          // 添加到场景
          this.scene.add(this.levelModel);
          
          console.log('✓ 关卡加载成功');
          console.log(`✓ 处理了 ${meshCount} 个Mesh`);
          console.log(`✓ 创建了 ${this.collisionBodies.length} 个碰撞体`);
          
          // 计算模型包围盒，帮助调试
          const bbox = new THREE.Box3().setFromObject(this.levelModel);
          const size = new THREE.Vector3();
          bbox.getSize(size);
          const center = new THREE.Vector3();
          bbox.getCenter(center);
          console.log(`✓ 模型尺寸: ${size.x.toFixed(2)} x ${size.y.toFixed(2)} x ${size.z.toFixed(2)}`);
          console.log(`✓ 模型中心: (${center.x.toFixed(2)}, ${center.y.toFixed(2)}, ${center.z.toFixed(2)})`);
          
          // 检查模型是否为空或无效
          if (meshCount === 0) {
            console.warn('警告: GLB模型中没有找到任何Mesh，可能是空模型');
          }
          
          if (this.collisionBodies.length === 0) {
            console.warn('警告: 没有创建任何碰撞体，可能需要检查模型');
          }
          
          resolve(this.levelModel);
        },
        (progress) => {
          const percentComplete = (progress.loaded / progress.total * 100).toFixed(2);
          console.log(`加载进度: ${percentComplete}%`);
        },
        (error) => {
          console.error('关卡加载失败:', error);
          reject(error);
        }
      );
    });
  }

  createMeshCollision(mesh) {
    try {
      // 获取世界坐标下的几何体
      const geometry = mesh.geometry;
      
      if (!geometry || !geometry.attributes.position) {
        console.warn('Mesh没有有效的几何体，跳过碰撞生成');
        return;
      }
      
      // 检查几何体是否有效
      const vertices = geometry.attributes.position.array;
      if (!vertices || vertices.length < 9) { // 至少需要3个顶点（9个数值）
        console.warn('Mesh几何体顶点数量不足，跳过碰撞生成');
        return;
      }
      
      const indices = geometry.index ? geometry.index.array : null;
      
      // 将顶点转换为CANNON格式
      const cannonVertices = [];
      for (let i = 0; i < vertices.length; i += 3) {
        cannonVertices.push(new CANNON.Vec3(
          vertices[i],
          vertices[i + 1],
          vertices[i + 2]
        ));
      }
      
      // 将索引转换为面
      const cannonFaces = [];
      if (indices) {
        for (let i = 0; i < indices.length; i += 3) {
          cannonFaces.push([indices[i], indices[i + 1], indices[i + 2]]);
        }
      } else {
        // 没有索引时，按顺序创建面
        for (let i = 0; i < vertices.length / 3; i += 3) {
          cannonFaces.push([i, i + 1, i + 2]);
        }
      }
      
      // 检查是否有有效的面
      if (cannonFaces.length === 0) {
        console.warn('Mesh没有有效的面，跳过碰撞生成');
        return;
      }
      
      // 尝试创建Trimesh
      let shape;
      try {
        shape = new CANNON.Trimesh(cannonVertices, cannonFaces);
      } catch (trimeshError) {
        console.warn(`Trimesh创建失败，使用简化碰撞: ${trimeshError.message}`);
        this.createSimplifiedCollision(mesh);
        return;
      }
      
      // 创建静态刚体
      const body = new CANNON.Body({
        mass: 0, // 静态物体
        shape: shape,
        material: new CANNON.Material({ friction: 0.5, restitution: 0.3 })
      });
      
      // 应用mesh的世界变换
      const worldPosition = new THREE.Vector3();
      const worldQuaternion = new THREE.Quaternion();
      const worldScale = new THREE.Vector3();
      
      mesh.getWorldPosition(worldPosition);
      mesh.getWorldQuaternion(worldQuaternion);
      mesh.getWorldScale(worldScale);
      
      body.position.set(worldPosition.x, worldPosition.y, worldPosition.z);
      body.quaternion.set(
        worldQuaternion.x,
        worldQuaternion.y,
        worldQuaternion.z,
        worldQuaternion.w
      );
      
      // 添加到物理世界
      this.physicsWorld.world.addBody(body);
      this.collisionBodies.push(body);
      
    } catch (error) {
      console.error(`创建Mesh碰撞失败: ${mesh.name || 'unnamed'}`, error);
      // 如果精确碰撞失败，尝试简化碰撞
      try {
        this.createSimplifiedCollision(mesh);
      } catch (fallbackError) {
        console.error(`简化碰撞也失败: ${mesh.name || 'unnamed'}`, fallbackError);
      }
    }
  }

  createSimplifiedCollision(mesh) {
    // 备选方案：使用包围盒创建简化碰撞
    const bbox = new THREE.Box3().setFromObject(mesh);
    const size = new THREE.Vector3();
    bbox.getSize(size);
    
    const center = new THREE.Vector3();
    bbox.getCenter(center);
    
    // 创建Box碰撞
    const shape = new CANNON.Box(new CANNON.Vec3(
      size.x / 2,
      size.y / 2,
      size.z / 2
    ));
    
    const body = new CANNON.Body({
      mass: 0,
      shape: shape,
      material: new CANNON.Material({ friction: 0.5, restitution: 0.3 })
    });
    
    body.position.set(center.x, center.y, center.z);
    
    this.physicsWorld.world.addBody(body);
    this.collisionBodies.push(body);
  }

  removeLevel() {
    // 移除场景中的关卡模型
    if (this.levelModel) {
      this.scene.remove(this.levelModel);
      this.levelModel = null;
    }
    
    // 移除所有碰撞体
    this.collisionBodies.forEach(body => {
      this.physicsWorld.world.removeBody(body);
    });
    this.collisionBodies = [];
  }
}

