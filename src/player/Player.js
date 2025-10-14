import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import * as CANNON from 'cannon-es';

export class Player {
  constructor(camera, inputManager, physicsWorld) {
    this.camera = camera;
    this.inputManager = inputManager;
    this.physicsWorld = physicsWorld;
    
    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();
    
    this.speed = 20.0;
    this.damping = 0.9;
    
    this.createControls();
    this.createPhysicsBody();
  }

  createControls() {
    this.controls = new PointerLockControls(this.camera, document.body);
  }

  createPhysicsBody() {
    // 创建球形刚体
    const radius = 1;
    const shape = new CANNON.Sphere(radius);
    this.body = new CANNON.Body({
      mass: 5,
      shape: shape,
      material: new CANNON.Material({ friction: 0.1, restitution: 0.3 }),
      linearDamping: 0.9,
      angularDamping: 0.9
    });
    
    this.body.position.set(0, 0, 10);
    this.physicsWorld.world.addBody(this.body);
  }

  update(delta) {
    // 获取相机方向
    this.camera.getWorldDirection(this.direction);
    
    // 计算右向量
    const right = new THREE.Vector3();
    right.crossVectors(this.camera.up, this.direction).normalize();
    
    // 计算上向量（相对世界坐标）
    const up = new THREE.Vector3(0, 1, 0);
    
    // 重置速度
    const moveForce = new CANNON.Vec3();
    
    // 前后移动
    if (this.inputManager.keys.forward) {
      moveForce.x += this.direction.x * this.speed;
      moveForce.y += this.direction.y * this.speed;
      moveForce.z += this.direction.z * this.speed;
    }
    if (this.inputManager.keys.backward) {
      moveForce.x -= this.direction.x * this.speed;
      moveForce.y -= this.direction.y * this.speed;
      moveForce.z -= this.direction.z * this.speed;
    }
    
    // 左右移动
    if (this.inputManager.keys.left) {
      moveForce.x += right.x * this.speed;
      moveForce.y += right.y * this.speed;
      moveForce.z += right.z * this.speed;
    }
    if (this.inputManager.keys.right) {
      moveForce.x -= right.x * this.speed;
      moveForce.y -= right.y * this.speed;
      moveForce.z -= right.z * this.speed;
    }
    
    // 上下移动
    if (this.inputManager.keys.up) {
      moveForce.y += this.speed;
    }
    if (this.inputManager.keys.down) {
      moveForce.y -= this.speed;
    }
    
    // 应用力
    this.body.applyForce(moveForce);
    
    // 同步相机位置和物理刚体
    this.camera.position.copy(this.body.position);
  }
}

