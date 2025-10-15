import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class AsteroidGenerator {
  constructor(scene, physicsWorld) {
    this.scene = scene;
    this.physicsWorld = physicsWorld;
    this.asteroids = [];
  }

  createAsteroidGeometry(size) {
    // 创建不规则的碎石几何体
    const geometry = new THREE.IcosahedronGeometry(size, 0);
    
    // 随机扰动顶点以创建不规则形状
    const positionAttribute = geometry.getAttribute('position');
    const vertex = new THREE.Vector3();
    
    for (let i = 0; i < positionAttribute.count; i++) {
      vertex.fromBufferAttribute(positionAttribute, i);
      vertex.normalize().multiplyScalar(
        size * (0.8 + Math.random() * 0.4)
      );
      positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    
    geometry.computeVertexNormals();
    return geometry;
  }

  createAsteroidMaterial() {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(0, 0, 0.3 + Math.random() * 0.2),
      roughness: 0.9,
      metalness: 0.1,
      flatShading: true
    });
  }

  generate(count, radius) {
    for (let i = 0; i < count; i++) {
      // 随机大小
      const size = 1 + Math.random() * 4;
      
      // 创建网格
      const geometry = this.createAsteroidGeometry(size);
      const material = this.createAsteroidMaterial();
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      
      // 随机位置（在球形区域内，避开中心20米）
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const minDistance = 20; // 避开中心区域
      const distance = minDistance + Math.random() * (radius - minDistance);
      
      mesh.position.x = distance * Math.sin(phi) * Math.cos(theta);
      mesh.position.y = distance * Math.sin(phi) * Math.sin(theta);
      mesh.position.z = distance * Math.cos(phi);
      
      // 随机旋转
      mesh.rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      );
      
      this.scene.add(mesh);
      
      // 创建物理刚体
      const shape = new CANNON.Sphere(size);
      const body = new CANNON.Body({
        mass: size * size * size,
        shape: shape,
        material: this.physicsWorld.asteroidMaterial // 使用小行星专用材质
      });
      
      body.position.copy(mesh.position);
      body.quaternion.copy(mesh.quaternion);
      
      // 随机初始旋转速度
      body.angularVelocity.set(
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5
      );
      
      this.physicsWorld.addBody(body);
      
      // 保存
      this.asteroids.push({
        mesh: mesh,
        body: body,
        size: size
      });
    }
  }

  update(delta) {
    // 同步物理刚体和渲染网格
    for (let asteroid of this.asteroids) {
      asteroid.mesh.position.copy(asteroid.body.position);
      asteroid.mesh.quaternion.copy(asteroid.body.quaternion);
      
      // 边界检测 - 如果小行星超出100米范围，施加向心力
      const distanceFromCenter = asteroid.body.position.length();
      if (distanceFromCenter > 100) {
        // 计算指向中心的力
        const pullForce = new CANNON.Vec3(
          -asteroid.body.position.x * 0.5,
          -asteroid.body.position.y * 0.5,
          -asteroid.body.position.z * 0.5
        );
        asteroid.body.applyForce(pullForce);
        
        // 减少速度
        asteroid.body.velocity.scale(0.95, asteroid.body.velocity);
      }
    }
  }

  removeAsteroid(asteroid) {
    const index = this.asteroids.indexOf(asteroid);
    if (index > -1) {
      this.scene.remove(asteroid.mesh);
      this.physicsWorld.removeBody(asteroid.body);
      this.asteroids.splice(index, 1);
      
      // 释放资源
      asteroid.mesh.geometry.dispose();
      asteroid.mesh.material.dispose();
    }
  }
}

