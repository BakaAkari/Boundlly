import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import * as CANNON from 'cannon-es';
import { HealthSystem } from './HealthSystem.js';

export class Player {
  constructor(camera, inputManager, physicsWorld, scene) {
    this.camera = camera;
    this.inputManager = inputManager;
    this.physicsWorld = physicsWorld;
    this.scene = scene;
    
    // 健康系统（传递重生回调）
    this.healthSystem = new HealthSystem(() => this.respawn());
    
    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();
    
    this.speed = 20.0;
    this.boostMultiplier = 2.0; // 加速倍数
    this.damping = 0.9;
    
    // 角色重心参数
    this.centerOffset = 0.45; // 重心在摄像机下方0.45米（45cm）
    
    // 桶滚状态
    this.barrelRoll = {
      active: false,
      direction: 0, // -1 为左，1 为右
      rotationSpeed: Math.PI, // 旋转速度（弧度/秒）- 每秒180度
    };
    
    // 创建角色根节点（重心）
    this.createCharacterRoot();
    
    this.createControls();
    this.createPhysicsBody();
  }

  createCharacterRoot() {
    // 创建角色根节点（重心/胶囊体中心）
    this.characterRoot = new THREE.Group();
    this.characterRoot.position.set(0, 0, 10);
    this.scene.add(this.characterRoot);
    
    // 摄像机作为子对象，相对于重心向上偏移
    this.characterRoot.add(this.camera);
    this.camera.position.set(0, this.centerOffset, 0);
    
    // 创建玩家ID标签
    this.createPlayerLabel();
  }

  createPlayerLabel() {
    // 从localStorage读取玩家ID
    this.playerId = localStorage.getItem('playerID') || '玩家';
    
    // 创建canvas用于文本渲染
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    // 绘制ID标签
    this.updateLabelCanvas(ctx, canvas);
    
    // 创建纹理和材质
    this.labelTexture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({
      map: this.labelTexture,
      transparent: true,
      depthTest: false,
      depthWrite: false
    });
    
    // 创建精灵
    this.labelSprite = new THREE.Sprite(spriteMaterial);
    this.labelSprite.scale.set(2, 0.5, 1);
    this.labelSprite.position.set(0, this.centerOffset + 1.2, 0); // 头顶上方1.2米
    
    // 添加到角色根节点
    this.characterRoot.add(this.labelSprite);
  }

  updateLabelCanvas(ctx, canvas) {
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 绘制背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.roundRect(10, 20, canvas.width - 20, 88, 20);
    ctx.fill();
    
    // 绘制边框
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 4;
    ctx.roundRect(10, 20, canvas.width - 20, 88, 20);
    ctx.stroke();
    
    // 绘制文字
    ctx.fillStyle = '#00ff00';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.playerId, canvas.width / 2, 64);
  }

  updatePlayerLabel(newId) {
    this.playerId = newId;
    localStorage.setItem('playerID', newId);
    
    // 更新canvas
    if (this.labelTexture) {
      const canvas = this.labelTexture.image;
      const ctx = canvas.getContext('2d');
      this.updateLabelCanvas(ctx, canvas);
      this.labelTexture.needsUpdate = true;
    }
  }

  createControls() {
    this.controls = new PointerLockControls(this.camera, document.body);
  }

  createPhysicsBody() {
    // 创建胶囊体物理刚体（使用球体代替）
    const radius = 1;
    const shape = new CANNON.Sphere(radius);
    this.body = new CANNON.Body({
      mass: 5,
      shape: shape,
      material: new CANNON.Material({ friction: 0.1, restitution: 0.3 }),
      linearDamping: 0.9,
      angularDamping: 0.9
    });
    
    // 物理刚体位置对应角色重心
    this.body.position.set(0, 0, 10);
    this.physicsWorld.world.addBody(this.body);
  }

  update(delta) {
    // 检查桶滚输入
    const pressingLeft = this.inputManager.keys.barrelRollLeft;
    const pressingRight = this.inputManager.keys.barrelRollRight;
    
    if ((pressingLeft || pressingRight) && !this.barrelRoll.active) {
      // 开始桶滚
      this.barrelRoll.active = true;
      this.barrelRoll.direction = pressingLeft ? -1 : 1;
    } else if (!pressingLeft && !pressingRight && this.barrelRoll.active) {
      // 停止桶滚
      this.barrelRoll.active = false;
    }
    
    // 桶滚旋转（直接旋转characterRoot）
    if (this.barrelRoll.active) {
      // 获取角色前进方向（世界坐标）
      const forward = new THREE.Vector3();
      this.characterRoot.getWorldDirection(forward);
      
      // 沿着前进方向旋转
      const rotationDelta = this.barrelRoll.direction * this.barrelRoll.rotationSpeed * delta;
      this.characterRoot.rotateOnAxis(forward, rotationDelta);
    }
    
    // 常规移动
    if (!this.barrelRoll.active) {
      // 获取角色朝向（基于相机水平旋转）
      this.camera.getWorldDirection(this.direction);
      
      // 计算角色的上向量（基于characterRoot的旋转状态）
      const currentUp = new THREE.Vector3(0, 1, 0);
      currentUp.applyQuaternion(this.characterRoot.quaternion);
      
      // 计算右向量
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
    
    // 同步角色根节点（重心）位置和物理刚体
    this.characterRoot.position.copy(this.body.position);
    
    // 更新健康系统
    this.healthSystem.update(delta);
    
    // 检查是否需要重生
    if (this.healthSystem.isDead) {
      // 禁用移动
      this.body.velocity.set(0, 0, 0);
    }
  }
  
  // 获取角色重心的滚转角度（用于多人同步）
  getRollAngle() {
    // 计算characterRoot沿视线方向的旋转角度
    const forward = new THREE.Vector3();
    this.characterRoot.getWorldDirection(forward);
    
    const up = new THREE.Vector3(0, 1, 0);
    up.applyQuaternion(this.characterRoot.quaternion);
    
    const right = new THREE.Vector3();
    right.crossVectors(up, forward);
    
    // 计算滚转角度
    const worldUp = new THREE.Vector3(0, 1, 0);
    const angle = Math.atan2(right.dot(worldUp), up.dot(worldUp));
    
    return angle;
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
      
      // 重置角色根节点旋转
      this.characterRoot.rotation.set(0, 0, 0);
      this.characterRoot.quaternion.set(0, 0, 0, 1);
    }
    return success;
  }
}

