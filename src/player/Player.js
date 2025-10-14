import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import * as CANNON from 'cannon-es';
import { HealthSystem } from './HealthSystem.js';

export class Player {
  constructor(camera, inputManager, physicsWorld) {
    this.camera = camera;
    this.inputManager = inputManager;
    this.physicsWorld = physicsWorld;
    
    // 健康系统（传递重生回调）
    this.healthSystem = new HealthSystem(() => this.respawn());
    
    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();
    
    this.speed = 20.0;
    this.boostMultiplier = 2.0; // 加速倍数
    this.damping = 0.9;
    
    // 桶滚状态
    this.barrelRoll = {
      active: false,
      direction: 0, // -1 为左，1 为右
      radius: 4.0, // 旋转半径（米）- 摄像机下方400cm
      rotationSpeed: Math.PI, // 旋转速度（弧度/秒）- 每秒180度
      currentAngle: 0, // 当前旋转角度
      centerPoint: new THREE.Vector3() // 旋转中心点
    };
    
    // 相机滚转角度（太空中没有上下概念）
    this.cameraRoll = 0;
    
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
    // 检查是否激活桶滚
    const pressingLeft = this.inputManager.keys.barrelRollLeft;
    const pressingRight = this.inputManager.keys.barrelRollRight;
    
    if ((pressingLeft || pressingRight) && !this.barrelRoll.active) {
      // 开始桶滚
      this.barrelRoll.active = true;
      this.barrelRoll.direction = pressingLeft ? -1 : 1;
      
      // 计算旋转中心点（当前位置下方4米）
      this.barrelRoll.centerPoint.copy(this.camera.position);
      this.barrelRoll.centerPoint.y -= this.barrelRoll.radius;
      
      // 计算初始角度（相对于中心点）
      const offset = new THREE.Vector3().subVectors(this.camera.position, this.barrelRoll.centerPoint);
      this.barrelRoll.currentAngle = Math.atan2(offset.x, offset.z);
      
    } else if (!pressingLeft && !pressingRight && this.barrelRoll.active) {
      // 停止桶滚
      this.barrelRoll.active = false;
    }
    
    // 更新桶滚运动
    if (this.barrelRoll.active) {
      // 累积相机滚转角度
      this.cameraRoll += this.barrelRoll.direction * this.barrelRoll.rotationSpeed * delta;
      
      // 更新角度
      this.barrelRoll.currentAngle += this.barrelRoll.direction * this.barrelRoll.rotationSpeed * delta;
      
      // 获取相机当前方向（用于计算旋转平面）
      this.camera.getWorldDirection(this.direction);
      
      // 计算右向量（用于确定旋转平面）
      const right = new THREE.Vector3();
      right.crossVectors(new THREE.Vector3(0, 1, 0), this.direction).normalize();
      
      // 在右-上平面上计算新位置
      const newPosition = new THREE.Vector3();
      newPosition.x = this.barrelRoll.centerPoint.x + Math.sin(this.barrelRoll.currentAngle) * this.barrelRoll.radius * right.x;
      newPosition.y = this.barrelRoll.centerPoint.y + Math.cos(this.barrelRoll.currentAngle) * this.barrelRoll.radius;
      newPosition.z = this.barrelRoll.centerPoint.z + Math.sin(this.barrelRoll.currentAngle) * this.barrelRoll.radius * right.z;
      
      // 更新物理刚体位置
      this.body.position.set(newPosition.x, newPosition.y, newPosition.z);
      this.body.velocity.set(0, 0, 0); // 清除速度，由桶滚控制位置
    }
    
    // 常规移动（非桶滚状态）
    if (!this.barrelRoll.active) {
      // 获取相机方向
      this.camera.getWorldDirection(this.direction);
      
      // 根据滚转角度计算当前的上向量
      const rotationMatrix = new THREE.Matrix4();
      rotationMatrix.makeRotationAxis(this.direction, this.cameraRoll);
      const currentUp = new THREE.Vector3(0, 1, 0);
      currentUp.applyMatrix4(rotationMatrix);
      
      // 计算右向量（相对于当前滚转状态）
      const right = new THREE.Vector3();
      right.crossVectors(currentUp, this.direction).normalize();
      
      // 重置速度
      const moveForce = new CANNON.Vec3();
      
      // 计算当前速度（考虑加速）
      const isBoostActive = this.inputManager.keys.boost;
      let currentSpeed = this.speed;
      
      // 前后移动
      if (this.inputManager.keys.forward) {
        // 向前可以加速
        if (isBoostActive) {
          currentSpeed = this.speed * this.boostMultiplier;
        }
        moveForce.x += this.direction.x * currentSpeed;
        moveForce.y += this.direction.y * currentSpeed;
        moveForce.z += this.direction.z * currentSpeed;
      }
      if (this.inputManager.keys.backward) {
        // 向后不能加速，始终使用基础速度
        moveForce.x -= this.direction.x * this.speed;
        moveForce.y -= this.direction.y * this.speed;
        moveForce.z -= this.direction.z * this.speed;
      }
      
      // 左右移动
      currentSpeed = this.speed; // 重置速度
      if (this.inputManager.keys.left) {
        // 向左可以加速
        if (isBoostActive) {
          currentSpeed = this.speed * this.boostMultiplier;
        }
        moveForce.x += right.x * currentSpeed;
        moveForce.y += right.y * currentSpeed;
        moveForce.z += right.z * currentSpeed;
      }
      if (this.inputManager.keys.right) {
        // 向右可以加速
        if (isBoostActive) {
          currentSpeed = this.speed * this.boostMultiplier;
        }
        moveForce.x -= right.x * currentSpeed;
        moveForce.y -= right.y * currentSpeed;
        moveForce.z -= right.z * currentSpeed;
      }
      
      // 上下移动（相对于玩家当前视角的上方向）
      if (this.inputManager.keys.up) {
        moveForce.x += currentUp.x * this.speed;
        moveForce.y += currentUp.y * this.speed;
        moveForce.z += currentUp.z * this.speed;
      }
      if (this.inputManager.keys.down) {
        moveForce.x -= currentUp.x * this.speed;
        moveForce.y -= currentUp.y * this.speed;
        moveForce.z -= currentUp.z * this.speed;
      }
      
      // 应用力
      this.body.applyForce(moveForce);
    }
    
    // 同步相机位置和物理刚体
    this.camera.position.copy(this.body.position);
    
    // 在同步位置后应用相机滚转（太空环境下持续保持）
    this.camera.getWorldDirection(this.direction);
    const rotationMatrix = new THREE.Matrix4();
    rotationMatrix.makeRotationAxis(this.direction, this.cameraRoll);
    this.camera.up.set(0, 1, 0);
    this.camera.up.applyMatrix4(rotationMatrix);
    
    // 更新健康系统
    this.healthSystem.update(delta);
    
    // 检查是否需要重生
    if (this.healthSystem.isDead) {
      // 禁用移动
      this.body.velocity.set(0, 0, 0);
    }
  }
  
  takeDamage(amount, attackerId) {
    this.healthSystem.takeDamage(amount);
    return {
      health: this.healthSystem.currentHealth,
      isDead: this.healthSystem.isDead
    };
  }
  
  respawn() {
    const success = this.healthSystem.respawn();
    if (success) {
      // 重置位置
      this.body.position.set(
        Math.random() * 20 - 10,
        Math.random() * 20 - 10,
        Math.random() * 20 - 10
      );
      this.body.velocity.set(0, 0, 0);
      this.cameraRoll = 0;
    }
    return success;
  }
}

