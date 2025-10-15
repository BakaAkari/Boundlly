import * as THREE from 'three';
import { SceneManager } from './scene/SceneManager.js';
import { Player } from './player/Player.js';
import { InputManager } from './player/InputManager.js';
import { AsteroidGenerator } from './asteroid/AsteroidGenerator.js';
import { PhysicsWorld } from './physics/PhysicsWorld.js';
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
    
    this.init();
  }

  async init() {
    // 创建场景管理器
    this.sceneManager = new SceneManager(this.container);
    
    // 创建物理世界
    this.physicsWorld = new PhysicsWorld();
    
    // 创建关卡加载器并加载关卡
    this.levelLoader = new LevelLoader(
      this.sceneManager.scene, 
      this.physicsWorld,
      {
        useSimplifiedCollision: false // false=精确网格碰撞, true=简化包围盒碰撞
      }
    );
    
    try {
      await this.levelLoader.loadLevel('/models/Env.glb');
      console.log('关卡环境加载完成');
    } catch (error) {
      console.warn('关卡加载失败，继续使用默认场景', error);
    }
    
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
    
    if (this.isPlaying) {
      // 更新物理
      this.physicsWorld.update(delta);
      
      // 更新玩家
      this.player.update(delta);
      
      // 更新碎石
      this.asteroidGenerator.update(delta);
      
      // 更新武器系统
      this.weaponSystem.update(delta, time);
      
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
      this.weaponSystem.updateWeaponUI();
      
      // 更新多人游戏
      this.multiplayerManager.update(delta);
      
      // 更新FPS
      this.updateFPS();
    }
    
    // 渲染场景
    this.sceneManager.render();
  }
}

// 启动游戏
new Game();

