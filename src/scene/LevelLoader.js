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

  async loadLevel(modelPath) {
    return new Promise((resolve, reject) => {
      const loader = new GLTFLoader();
      
      console.log(`加载关卡: ${modelPath}`);
      
      loader.load(
        modelPath,
        (gltf) => {
          this.levelModel = gltf.scene;
          
          // 设置模型位置在世界中心
          this.levelModel.position.set(0, 0, 0);
          this.levelModel.scale.set(1, 1, 1);
          
          // 遍历模型所有mesh，创建碰撞
          this.levelModel.traverse((child) => {
            if (child.isMesh) {
              // 确保材质可见
              if (child.material) {
                child.material.side = THREE.DoubleSide;
              }
              
              // 为每个mesh创建碰撞体
              if (this.options.useSimplifiedCollision) {
                this.createSimplifiedCollision(child);
              } else {
                this.createMeshCollision(child);
              }
            }
          });
          
          // 添加到场景
          this.scene.add(this.levelModel);
          
          console.log('关卡加载成功');
          console.log(`创建了 ${this.collisionBodies.length} 个碰撞体`);
          
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
    // 获取世界坐标下的几何体
    const geometry = mesh.geometry;
    
    if (!geometry || !geometry.attributes.position) {
      console.warn('Mesh没有有效的几何体，跳过碰撞生成');
      return;
    }
    
    // 获取顶点和索引
    const vertices = geometry.attributes.position.array;
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
    
    // 创建Trimesh
    const shape = new CANNON.Trimesh(cannonVertices, cannonFaces);
    
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

