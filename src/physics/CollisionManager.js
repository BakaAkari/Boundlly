import * as THREE from 'three';
import * as CANNON from 'cannon-es';

/**
 * 碰撞管理器 - 统一管理所有碰撞体的创建、更新和销毁
 */
export class CollisionManager {
  constructor(physicsWorld) {
    this.physicsWorld = physicsWorld;
    this.collisionBodies = new Map(); // 存储所有碰撞体
    this.categories = {
      PLAYER: 'player',
      LEVEL: 'level', 
      ASTEROID: 'asteroid',
      WEAPON: 'weapon'
    };
  }

  /**
   * 为GLB模型创建碰撞体（优先使用UCX_前缀的碰撞代理）
   * @param {THREE.Object3D} model - 模型对象
   * @param {string} category - 碰撞体类别
   * @param {string} id - 唯一标识符
   * @returns {Array} 创建的碰撞体数组
   */
  createModelCollisions(model, category, id) {
    const bodies = [];
    const meshes = [];
    let ucxCount = 0;
    
    // 收集需要碰撞的mesh
    model.traverse((child) => {
      if (child.isMesh) {
        // 检测UCX_前缀的碰撞代理
        if (child.name.startsWith('UCX_')) {
          child.userData.needsCollision = true;
          child.userData.isCollisionProxy = true;
          meshes.push(child);
          ucxCount++;
        }
        // 如果没有UCX_代理，则检查是否有needsCollision标记
        else if (child.userData.needsCollision) {
          meshes.push(child);
        }
      }
    });

    console.log(`[CollisionManager] 为 ${id} 找到 ${meshes.length} 个需要碰撞的网格 (${ucxCount} 个UCX代理)`);

    // 为每个mesh创建碰撞体
    meshes.forEach((mesh, index) => {
      const body = this.createSimpleCollisionBody(mesh, category);
      if (body) {
        bodies.push(body);
        this.physicsWorld.addBody(body);
        
        const proxyType = mesh.userData.isCollisionProxy ? 'UCX代理' : '普通网格';
        console.log(`[CollisionManager] 为 ${id} 的 ${mesh.name || `mesh_${index}`} 创建了碰撞体 (${proxyType})`);
      }
    });

    // 存储碰撞体引用
    this.collisionBodies.set(id, {
      category,
      bodies,
      meshes,
      model,
      ucxCount
    });

    return bodies;
  }

  /**
   * 创建简化的碰撞体
   * @param {THREE.Mesh} mesh - 网格对象
   * @param {string} category - 碰撞体类别
   * @returns {CANNON.Body|null} 创建的碰撞体
   */
  createSimpleCollisionBody(mesh, category) {
    try {
      // 计算包围盒
      const bbox = new THREE.Box3().setFromObject(mesh);
      const size = bbox.getSize(new THREE.Vector3());
      const center = bbox.getCenter(new THREE.Vector3());

      // 检查包围盒是否有效
      if (size.x === 0 && size.y === 0 && size.z === 0) {
        console.warn(`[CollisionManager] 网格 ${mesh.name} 的包围盒无效，跳过碰撞体创建`);
        return null;
      }

      // 创建碰撞形状
      const shape = new CANNON.Box(new CANNON.Vec3(
        Math.max(size.x / 2, 0.1), // 最小尺寸0.1
        Math.max(size.y / 2, 0.1),
        Math.max(size.z / 2, 0.1)
      ));

      // 获取对应的材质
      const material = this.getMaterialByCategory(category);

      // 创建物理体
      const body = new CANNON.Body({
        mass: category === this.categories.LEVEL ? 0 : 1, // 关卡为静态，其他为动态
        shape: shape,
        material: material
      });

      // 设置位置和旋转
      body.position.set(center.x, center.y, center.z);
      if (mesh.rotation) {
        body.quaternion.setFromEuler(mesh.rotation.x, mesh.rotation.y, mesh.rotation.z);
      }

      // 添加用户数据
      body.userData = {
        category,
        originalMesh: mesh,
        size: size
      };

      return body;
    } catch (error) {
      console.error(`[CollisionManager] 创建碰撞体失败:`, error);
      return null;
    }
  }

  /**
   * 根据类别获取材质
   * @param {string} category - 碰撞体类别
   * @returns {CANNON.Material} 对应的材质
   */
  getMaterialByCategory(category) {
    switch (category) {
      case this.categories.PLAYER:
        return this.physicsWorld.playerMaterial;
      case this.categories.LEVEL:
        return this.physicsWorld.levelMaterial;
      case this.categories.ASTEROID:
        return this.physicsWorld.asteroidMaterial;
      default:
        return this.physicsWorld.levelMaterial; // 默认使用关卡材质
    }
  }

  /**
   * 同步指定碰撞体的位置
   * @param {string} id - 碰撞体ID
   */
  syncCollisions(id) {
    const collisionData = this.collisionBodies.get(id);
    if (!collisionData) return;

    collisionData.bodies.forEach((body, index) => {
      const mesh = collisionData.meshes[index];
      if (!mesh) return;

      // 获取mesh的世界变换
      const worldPosition = new THREE.Vector3();
      const worldQuaternion = new THREE.Quaternion();
      
      mesh.getWorldPosition(worldPosition);
      mesh.getWorldQuaternion(worldQuaternion);

      // 更新物理体
      body.position.set(worldPosition.x, worldPosition.y, worldPosition.z);
      body.quaternion.set(worldQuaternion.x, worldQuaternion.y, worldQuaternion.z, worldQuaternion.w);
    });
  }

  /**
   * 同步所有碰撞体位置
   */
  syncAllCollisions() {
    this.collisionBodies.forEach((collisionData, id) => {
      this.syncCollisions(id);
    });
  }

  /**
   * 移除指定碰撞体
   * @param {string} id - 碰撞体ID
   */
  removeCollisions(id) {
    const collisionData = this.collisionBodies.get(id);
    if (!collisionData) return;

    // 从物理世界中移除所有碰撞体
    collisionData.bodies.forEach(body => {
      this.physicsWorld.removeBody(body);
    });

    // 从管理中移除
    this.collisionBodies.delete(id);
    console.log(`[CollisionManager] 移除了 ${id} 的所有碰撞体`);
  }

  /**
   * 获取碰撞体统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    const stats = {
      total: 0,
      byCategory: {}
    };

    this.collisionBodies.forEach((collisionData, id) => {
      stats.total += collisionData.bodies.length;
      const category = collisionData.category;
      stats.byCategory[category] = (stats.byCategory[category] || 0) + collisionData.bodies.length;
    });

    return stats;
  }

  /**
   * 清理所有碰撞体
   */
  clear() {
    this.collisionBodies.forEach((collisionData, id) => {
      this.removeCollisions(id);
    });
    console.log('[CollisionManager] 已清理所有碰撞体');
  }
}
