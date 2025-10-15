import * as THREE from 'three';
import { SceneManager } from './scene/SceneManager.js';
import { Player } from './player/Player.js';
import { InputManager } from './player/InputManager.js';
import { AsteroidGenerator } from './asteroid/AsteroidGenerator.js';
import { PhysicsWorld } from './physics/PhysicsWorld.js';
import { CollisionManager } from './physics/CollisionManager.js';
import { WeaponSystem } from './weapon/WeaponSystem.js';
import { MultiplayerManager } from './multiplayer/MultiplayerManager.js';
import { LevelLoader } from './scene/LevelLoader.js';

class Game {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.blocker = document.getElementById('blocker');
    this.instructions = document.getElementById('instructions');
    this.crosshair = document.getElementById('crosshair');
    this.ui = document.getElementById('ui');
    
    this.clock = new THREE.Clock();
    this.isPlaying = false;
    
    // 碰撞体管理
    this.levelCollisionBodies = []; // 存储关卡碰撞体引用（兼容性保留）
    this.collisionManager = null; // 碰撞管理器
    
    // 异步初始化
    this.init().catch(error => {
      console.error('游戏初始化失败:', error);
    });
  }

  /**
   * 根据路径自动识别模型类型并加载
   * @param {string} path - 模型路径
   * @param {string} type - 模型类型 (LEVEL, WEAPON, PLAYER, ASTEROID)
   * @returns {Promise<THREE.Object3D>} 加载的模型
   */
  async loadModel(path, type = null) {
    const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
    const loader = new GLTFLoader();
    
    const gltf = await new Promise((resolve, reject) => {
      loader.load(path, resolve, undefined, reject);
    });
    
    const model = gltf.scene;
    
    // 根据类型或路径自动识别模型类型
    const modelType = type || this.getModelTypeFromPath(path);
    
    // 根据类型进行不同的处理
    this.processModelByType(model, modelType);
    
    return model;
  }

  /**
   * 根据路径自动识别模型类型
   * @param {string} path - 模型路径
   * @returns {string} 模型类型
   */
  getModelTypeFromPath(path) {
    if (path.includes('/levels/')) return 'LEVEL';
    if (path.includes('/weapons/')) return 'WEAPON';
    if (path.includes('/players/')) return 'PLAYER';
    if (path.includes('/asteroids/')) return 'ASTEROID';
    return 'GENERIC';
  }

  /**
   * 根据模型类型进行不同的处理
   * @param {THREE.Object3D} model - 模型对象
   * @param {string} type - 模型类型
   */
  processModelByType(model, type) {
    model.traverse((child) => {
      if (child.isMesh) {
        switch (type) {
          case 'LEVEL':
            // 关卡模型：启用阴影，需要精确碰撞
            child.castShadow = true;
            child.receiveShadow = true;
            child.userData.needsCollision = true;
            break;
            
          case 'WEAPON':
            // 武器模型：通常不需要阴影，不需要碰撞
            child.castShadow = false;
            child.receiveShadow = false;
            child.userData.isWeapon = true;
            break;
            
          case 'PLAYER':
            // 角色模型：启用阴影，需要碰撞
            child.castShadow = true;
            child.receiveShadow = true;
            child.userData.isPlayer = true;
            child.userData.needsCollision = true;
            break;
            
          case 'ASTEROID':
            // 小行星模型：启用阴影，需要碰撞
            child.castShadow = true;
            child.receiveShadow = true;
            child.userData.isAsteroid = true;
            child.userData.needsCollision = true;
            break;
            
          default:
            // 通用模型：默认设置
            child.castShadow = true;
            child.receiveShadow = true;
        }
      }
    });
    
    // 设置模型类型标识
    model.userData.modelType = type;
  }

  /**
   * 为关卡模型生成简化碰撞体（使用包围盒方式，类似小行星）
   * @param {THREE.Object3D} model - 关卡模型
   */
  async generateLevelCollision(model) {
    const { CANNON } = await import('cannon-es');
    
    // 先收集所有需要处理的mesh
    const meshes = [];
    model.traverse((child) => {
      if (child.isMesh && child.userData.needsCollision) {
        meshes.push(child);
      }
    });
    
    console.log(`找到 ${meshes.length} 个需要碰撞的网格`);
    
    // 批量处理所有mesh
    for (const mesh of meshes) {
      this.createSimpleCollisionBody(mesh, CANNON);
      console.log(`为 ${mesh.name || 'unnamed mesh'} 生成了包围盒碰撞体`);
    }
    
    // 输出统计
    console.log('=== 关卡碰撞体统计 ===');
    console.log(`处理了 ${meshes.length} 个网格`);
    console.log(`生成了 ${meshes.length} 个碰撞体`);
    console.log(`物理世界中的刚体数量: ${this.physicsWorld.world.bodies.length}`);
  }

  /**
   * 创建简化的碰撞体（完全按照小行星的方式实现）
   * @param {THREE.Mesh} mesh - 网格对象
   * @param {Object} CANNON - CANNON物理引擎
   */
  createSimpleCollisionBody(mesh, CANNON) {
    // 计算mesh的包围盒
    const bbox = new THREE.Box3().setFromObject(mesh);
    const size = bbox.getSize(new THREE.Vector3());
    const center = bbox.getCenter(new THREE.Vector3());
    
    // 使用包围盒创建碰撞体（类似小行星的球形，但用立方体）
    const shape = new CANNON.Box(new CANNON.Vec3(
      size.x / 2,
      size.y / 2,
      size.z / 2
    ));
    
    // 创建静态刚体（完全按照小行星的创建方式）
    const body = new CANNON.Body({
      mass: 0, // 静态物体，质量为0
      shape: shape,
      material: this.physicsWorld.levelMaterial // 使用关卡材质
    });
    
    // 设置位置（类似小行星的位置设置方式）
    body.position.set(center.x, center.y, center.z);
    
    // 设置旋转（如果有的话）
    if (mesh.rotation) {
      body.quaternion.setFromEuler(mesh.rotation.x, mesh.rotation.y, mesh.rotation.z);
    }
    
    // 添加到物理世界（统一使用addBody方法）
    this.physicsWorld.addBody(body);
    
    // 存储碰撞体引用，用于后续管理
    this.levelCollisionBodies.push({
      body: body,
      mesh: mesh,
      originalPosition: new THREE.Vector3().copy(center),
      originalRotation: new THREE.Euler().copy(mesh.rotation)
    });
    
    console.log(`为 ${mesh.name || 'unnamed mesh'} 生成了简化碰撞体 (大小: ${size.x.toFixed(2)} x ${size.y.toFixed(2)} x ${size.z.toFixed(2)})`);
  }

  /**
   * 同步关卡碰撞体位置（如果需要动态移动关卡模型）
   */
  syncLevelCollisions() {
    this.levelCollisionBodies.forEach(collisionData => {
      const { body, mesh } = collisionData;
      
      // 获取mesh的世界位置和旋转
      const worldPosition = new THREE.Vector3();
      const worldQuaternion = new THREE.Quaternion();
      
      mesh.getWorldPosition(worldPosition);
      mesh.getWorldQuaternion(worldQuaternion);
      
      // 更新物理体位置
      body.position.set(worldPosition.x, worldPosition.y, worldPosition.z);
      body.quaternion.set(worldQuaternion.x, worldQuaternion.y, worldQuaternion.z, worldQuaternion.w);
    });
  }

  async init() {
    // 创建场景管理器
    this.sceneManager = new SceneManager(this.container);
    
    // 创建物理世界
    this.physicsWorld = new PhysicsWorld();
    
    // 创建碰撞管理器
    this.collisionManager = new CollisionManager(this.physicsWorld);
    
    // 创建关卡加载器
    this.levelLoader = new LevelLoader(
      this.sceneManager.scene, 
      this.physicsWorld,
      {
        useSimplifiedCollision: false // false=精确网格碰撞, true=简化包围盒碰撞
      }
    );
    
    // 关卡加载（使用测试关卡，避免加载失败）
    console.log('========================================');
    console.log('创建游戏环境...');
    console.log('========================================');
    
    // 加载关卡模型
    try {
      const levelModel = await this.loadModel('/models/levels/Env_01.glb', 'LEVEL');
      this.sceneManager.scene.add(levelModel);
      this.levelModel = levelModel;
      
      // 使用新的碰撞管理器为关卡模型创建碰撞体
      const levelCollisions = this.collisionManager.createModelCollisions(
        levelModel, 
        this.collisionManager.categories.LEVEL, 
        'level_main'
      );
      
      console.log(`✓ 关卡模型加载完成，生成了 ${levelCollisions.length} 个碰撞体`);
      
      // 输出碰撞管理器统计信息
      const stats = this.collisionManager.getStats();
      console.log('=== 碰撞管理器统计 ===');
      console.log(`总碰撞体数量: ${stats.total}`);
      console.log('按类别分布:', stats.byCategory);
      
    } catch (error) {
      console.warn('GLB模型加载失败，使用测试关卡', error);
      this.levelLoader.createTestLevel();
    }
    
    console.log('✓ 游戏环境创建完成');
    
    // 创建输入管理器
    this.inputManager = new InputManager();
    
    // 创建玩家
    this.player = new Player(
      this.sceneManager.camera,
      this.inputManager,
      this.physicsWorld,
      this.sceneManager.scene
    );
    
    // 创建碎石（在游戏区域100米内生成）
    this.asteroidGenerator = new AsteroidGenerator(
      this.sceneManager.scene,
      this.physicsWorld
    );
    this.asteroidGenerator.generate(50, 100);
    
    // 创建武器系统
    this.weaponSystem = new WeaponSystem(this.sceneManager.camera, this.sceneManager.scene);
    
    // 创建多人游戏管理器
    this.multiplayerManager = new MultiplayerManager(
      this.sceneManager.scene,
      this.player
    );
    
    // 设置指针锁定
    this.setupPointerLock();
    
    // 设置射击
    this.setupShooting();
    
    // 设置ESC和设置菜单
    this.setupSettings();
    
    // 开始渲染循环
    this.animate();
    
    // FPS计数器
    this.lastTime = performance.now();
    this.frames = 0;
  }

  setupPointerLock() {
    // 开始游戏按钮
    const startButton = document.getElementById('start-game-btn');
    const menuPlayerIdInput = document.getElementById('menu-player-id-input');
    
    // 加载已保存的ID
    menuPlayerIdInput.value = localStorage.getItem('playerID') || '';
    
    startButton.addEventListener('click', () => {
      // 保存玩家ID
      const playerId = menuPlayerIdInput.value.trim() || '玩家';
      this.player.updatePlayerLabel(playerId);
      
      // 通知服务器
      if (this.multiplayerManager) {
        this.multiplayerManager.updatePlayerId(playerId);
      }
      
      // 锁定鼠标
      this.player.controls.lock();
    });

    // 菜单收起/展开
    const menuToggle = document.getElementById('menu-toggle');
    menuToggle.addEventListener('click', () => {
      this.instructions.classList.toggle('collapsed');
      menuToggle.textContent = this.instructions.classList.contains('collapsed') ? '▶' : '◀';
    });

    this.player.controls.addEventListener('lock', () => {
      this.instructions.classList.add('collapsed');
      menuToggle.textContent = '▶';
      this.crosshair.style.display = 'block';
      this.ui.style.display = 'block';
      document.getElementById('settings-hint').style.display = 'block';
      this.isPlaying = true;
    });

    this.player.controls.addEventListener('unlock', () => {
      // 检查是否是因为打开设置菜单而解锁
      const settingsMenu = document.getElementById('settings-menu');
      if (settingsMenu.style.display === 'block') {
        return; // 如果是设置菜单，不显示菜单
      }
      
      this.instructions.classList.remove('collapsed');
      menuToggle.textContent = '◀';
      this.crosshair.style.display = 'none';
      this.ui.style.display = 'none';
      document.getElementById('settings-hint').style.display = 'none';
      this.isPlaying = false;
    });
  }

  setupSettings() {
    const settingsMenu = document.getElementById('settings-menu');
    const playerIdInput = document.getElementById('player-id-input');
    const saveButton = document.getElementById('save-settings');
    
    // 加载已保存的ID
    playerIdInput.value = localStorage.getItem('playerID') || '';
    
    // ESC键处理
    document.addEventListener('keydown', (event) => {
      if (event.code === 'Escape') {
        if (settingsMenu.style.display === 'block') {
          // 关闭设置菜单
          settingsMenu.style.display = 'none';
          this.player.controls.lock();
        } else if (this.isPlaying) {
          // 打开设置菜单
          settingsMenu.style.display = 'block';
          this.player.controls.unlock();
        }
      }
    });
    
    // 保存按钮
    saveButton.addEventListener('click', () => {
      const newId = playerIdInput.value.trim() || '玩家';
      this.player.updatePlayerLabel(newId);
      
      // 通知服务器ID变更
      if (this.multiplayerManager) {
        this.multiplayerManager.updatePlayerId(newId);
      }
      
      // 关闭菜单并恢复游戏
      settingsMenu.style.display = 'none';
      this.player.controls.lock();
    });
    
    // 输入框回车保存
    playerIdInput.addEventListener('keydown', (event) => {
      if (event.code === 'Enter') {
        saveButton.click();
      }
    });
  }

  setupShooting() {
    // 鼠标按下 - 开始射击
    document.addEventListener('mousedown', (event) => {
      if (event.button === 0 && this.isPlaying && this.player.healthSystem.isAlive()) {
        this.weaponSystem.startShooting();
      }
    });

    // 鼠标抬起 - 停止射击
    document.addEventListener('mouseup', (event) => {
      if (event.button === 0) {
        this.weaponSystem.stopShooting();
      }
    });

    // 按键处理
    document.addEventListener('keydown', (event) => {
      if (!this.isPlaying || !this.player.healthSystem.isAlive()) return;
      
      // R键换弹
      if (event.code === 'KeyR') {
        this.weaponSystem.reload();
      }
      
      // 1/2/3键切换武器
      if (event.code === 'Digit1') {
        this.weaponSystem.switchWeapon(0);
      } else if (event.code === 'Digit2') {
        this.weaponSystem.switchWeapon(1);
      } else if (event.code === 'Digit3') {
        this.weaponSystem.switchWeapon(2);
      }
      
      // 鼠标滚轮切换（备选）
    });

    // 鼠标滚轮切换武器
    document.addEventListener('wheel', (event) => {
      if (!this.isPlaying) return;
      
      event.preventDefault();
      if (event.deltaY > 0) {
        this.weaponSystem.nextWeapon();
      } else {
        this.weaponSystem.previousWeapon();
      }
    });
  }

  updateFPS() {
    this.frames++;
    const time = performance.now();
    if (time >= this.lastTime + 1000) {
      const fps = Math.round((this.frames * 1000) / (time - this.lastTime));
      document.getElementById('fps').textContent = `FPS: ${fps}`;
      this.frames = 0;
      this.lastTime = time;
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    
    const delta = this.clock.getDelta();
    const time = this.clock.getElapsedTime();
    
    // 确保所有系统已初始化
    if (!this.sceneManager || !this.player || !this.weaponSystem) {
      return;
    }
    
    if (this.isPlaying) {
      // 更新物理
      if (this.physicsWorld) {
        this.physicsWorld.update(delta);
      }
      
      // 更新玩家
      if (this.player) {
        this.player.update(delta);
      }
      
      // 更新碎石
      if (this.asteroidGenerator) {
        this.asteroidGenerator.update(delta);
      }
      
      // 更新武器系统
      if (this.weaponSystem) {
        this.weaponSystem.update(delta, time);
      }
      
      // 处理连发射击
      if (this.weaponSystem.mouseDown && this.player.healthSystem.isAlive()) {
        const currentWeapon = this.weaponSystem.getCurrentWeapon();
        const lastFireTimeBefore = currentWeapon.lastFireTime;
        
        const otherPlayers = this.multiplayerManager.getOtherPlayersList();
        const hitResult = this.weaponSystem.shoot(this.asteroidGenerator.asteroids, otherPlayers);
        
        // 检查是否真的射击了（lastFireTime有更新）
        if (currentWeapon.lastFireTime > lastFireTimeBefore) {
          const direction = new THREE.Vector3();
          this.sceneManager.camera.getWorldDirection(direction);
          
          const worldPosition = new THREE.Vector3();
          this.sceneManager.camera.getWorldPosition(worldPosition);
          
          this.multiplayerManager.sendPlayerShoot(worldPosition, direction);
          
          // 如果击中玩家
          if (hitResult && hitResult.type === 'player') {
            this.multiplayerManager.sendPlayerDamage(hitResult.playerId, hitResult.damage);
          }
        }
      }
      
      // 更新武器UI
      if (this.weaponSystem) {
        this.weaponSystem.updateWeaponUI();
      }
      
      // 更新多人游戏
      if (this.multiplayerManager) {
        this.multiplayerManager.update(delta);
      }
      
      // 同步所有碰撞体位置
      if (this.collisionManager) {
        this.collisionManager.syncAllCollisions();
      }
      
      // 更新FPS
      this.updateFPS();
    }
    
    // 渲染场景
    if (this.sceneManager) {
      this.sceneManager.render();
    }
  }
}

// 启动游戏
const game = new Game();
window.gameInstance = game; // 设置全局访问

