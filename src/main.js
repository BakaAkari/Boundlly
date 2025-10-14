import * as THREE from 'three';
import { SceneManager } from './scene/SceneManager.js';
import { Player } from './player/Player.js';
import { InputManager } from './player/InputManager.js';
import { AsteroidGenerator } from './asteroid/AsteroidGenerator.js';
import { PhysicsWorld } from './physics/PhysicsWorld.js';
import { Gun } from './weapon/Gun.js';
import { MultiplayerManager } from './multiplayer/MultiplayerManager.js';

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

  init() {
    // 创建场景管理器
    this.sceneManager = new SceneManager(this.container);
    
    // 创建物理世界
    this.physicsWorld = new PhysicsWorld();
    
    // 创建输入管理器
    this.inputManager = new InputManager();
    
    // 创建玩家
    this.player = new Player(
      this.sceneManager.camera,
      this.inputManager,
      this.physicsWorld
    );
    
    // 创建碎石
    this.asteroidGenerator = new AsteroidGenerator(
      this.sceneManager.scene,
      this.physicsWorld
    );
    this.asteroidGenerator.generate(50, 200);
    
    // 创建武器
    this.gun = new Gun(this.sceneManager.camera, this.sceneManager.scene);
    
    // 创建多人游戏管理器
    this.multiplayerManager = new MultiplayerManager(
      this.sceneManager.scene,
      this.player
    );
    
    // 设置指针锁定
    this.setupPointerLock();
    
    // 设置射击
    this.setupShooting();
    
    // 开始渲染循环
    this.animate();
    
    // FPS计数器
    this.lastTime = performance.now();
    this.frames = 0;
  }

  setupPointerLock() {
    this.instructions.addEventListener('click', () => {
      this.player.controls.lock();
    });

    this.player.controls.addEventListener('lock', () => {
      this.instructions.style.display = 'none';
      this.blocker.style.display = 'none';
      this.crosshair.style.display = 'block';
      this.ui.style.display = 'block';
      this.isPlaying = true;
    });

    this.player.controls.addEventListener('unlock', () => {
      this.blocker.style.display = 'flex';
      this.instructions.style.display = 'block';
      this.crosshair.style.display = 'none';
      this.ui.style.display = 'none';
      this.isPlaying = false;
    });
  }

  setupShooting() {
    document.addEventListener('click', () => {
      if (this.isPlaying && this.player.healthSystem.isAlive()) {
        // 获取其他玩家列表
        const otherPlayers = this.multiplayerManager.getOtherPlayersList();
        
        // 射击
        const hitResult = this.gun.shoot(this.asteroidGenerator.asteroids, otherPlayers);
        
        // 通知其他玩家射击
        const direction = new THREE.Vector3();
        this.sceneManager.camera.getWorldDirection(direction);
        this.multiplayerManager.sendPlayerShoot(
          this.sceneManager.camera.position,
          direction
        );
        
        // 如果击中了玩家，发送伤害事件
        if (hitResult && hitResult.type === 'player') {
          this.multiplayerManager.sendPlayerDamage(hitResult.playerId, hitResult.damage);
        }
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
      
      // 更新武器
      this.gun.update(delta, time);
      
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

