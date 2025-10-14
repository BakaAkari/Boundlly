import * as THREE from 'three';
import { io } from 'socket.io-client';

export class MultiplayerManager {
  constructor(scene, localPlayer) {
    this.scene = scene;
    this.localPlayer = localPlayer;
    this.otherPlayers = new Map();
    this.socket = null;
    this.connected = false;
    
    // 获取服务器地址（使用当前域名）
    const serverUrl = window.location.origin;
    
    this.connect(serverUrl);
  }

  connect(serverUrl) {
    console.log('连接服务器:', serverUrl);
    
    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10
    });

    this.socket.on('connect', () => {
      console.log('已连接到服务器');
      this.connected = true;
      this.updatePlayerCount();
      
      // 发送本地玩家ID
      if (this.localPlayer && this.localPlayer.playerId) {
        this.updatePlayerId(this.localPlayer.playerId);
      }
    });

    this.socket.on('disconnect', () => {
      console.log('与服务器断开连接');
      this.connected = false;
      this.updatePlayerCount();
    });

    // 接收当前所有玩家
    this.socket.on('currentPlayers', (players) => {
      console.log('当前玩家:', players.length);
      players.forEach(player => {
        if (player.id !== this.socket.id) {
          this.addOtherPlayer(player);
        }
      });
      this.updatePlayerCount();
    });

    // 新玩家加入
    this.socket.on('newPlayer', (player) => {
      console.log('新玩家加入:', player.id);
      this.addOtherPlayer(player);
      this.updatePlayerCount();
    });

    // 玩家移动
    this.socket.on('playerMoved', (data) => {
      this.updateOtherPlayer(data);
    });

    // 玩家射击
    this.socket.on('playerShot', (data) => {
      this.showOtherPlayerShot(data);
    });

    // 玩家受到伤害
    this.socket.on('playerDamaged', (data) => {
      if (data.victimId === this.socket.id) {
        // 本地玩家受伤
        this.localPlayer.takeDamage(data.damage, data.attackerId);
      }
    });

    // 玩家断开
    this.socket.on('playerDisconnected', (playerId) => {
      console.log('玩家离开:', playerId);
      this.removeOtherPlayer(playerId);
      this.updatePlayerCount();
    });

    // 玩家ID更新
    this.socket.on('playerIdUpdated', (data) => {
      const player = this.otherPlayers.get(data.playerId);
      if (player) {
        // 找到ID标签精灵并更新
        const labelSprite = player.group.children.find(child => child.isSprite);
        if (labelSprite && labelSprite.userData.labelTexture) {
          const canvas = labelSprite.userData.labelTexture.image;
          const ctx = canvas.getContext('2d');
          this.drawPlayerLabel(ctx, canvas, data.newId);
          labelSprite.userData.labelTexture.needsUpdate = true;
          labelSprite.userData.playerId = data.newId;
        }
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('连接错误:', error);
    });
  }

  addOtherPlayer(playerData) {
    if (this.otherPlayers.has(playerData.id)) {
      return;
    }

    // 创建其他玩家的视觉模型（一个简单的立方体 + 方向指示器）
    const group = new THREE.Group();
    
    // 添加玩家ID标签
    this.createOtherPlayerLabel(group, playerData.playerId || '玩家');
    
    // 玩家身体（立方体）
    const bodyGeometry = new THREE.BoxGeometry(1, 1.5, 1);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: this.getRandomPlayerColor(),
      metalness: 0.3,
      roughness: 0.7
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    group.add(body);
    
    // 前方指示器（小锥体）
    const coneGeometry = new THREE.ConeGeometry(0.3, 0.8, 8);
    const coneMaterial = new THREE.MeshStandardMaterial({
      color: 0xffff00,
      emissive: 0xffff00,
      emissiveIntensity: 0.5
    });
    const cone = new THREE.Mesh(coneGeometry, coneMaterial);
    cone.rotation.x = Math.PI / 2;
    cone.position.z = -1;
    group.add(cone);
    
    // 添加玩家标签（发光点）
    const labelGeometry = new THREE.SphereGeometry(0.2, 16, 16);
    const labelMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00
    });
    const label = new THREE.Mesh(labelGeometry, labelMaterial);
    label.position.y = 1.5;
    group.add(label);
    
    // 设置位置
    if (playerData.position) {
      group.position.copy(playerData.position);
    }
    
    // 只使用Y轴旋转来显示玩家朝向
    if (playerData.rotation) {
      group.rotation.set(0, playerData.rotation.y, 0);
    }
    
    this.scene.add(group);
    
    this.otherPlayers.set(playerData.id, {
      group: group,
      targetPosition: new THREE.Vector3(),
      targetRotation: new THREE.Euler(),
      targetRoll: 0
    });
  }

  updateOtherPlayer(data) {
    const player = this.otherPlayers.get(data.id);
    if (player) {
      // 平滑插值到目标位置
      player.targetPosition.copy(data.position);
      // 只使用Y轴旋转（左右转向）来显示玩家朝向
      player.targetRotation.set(0, data.rotation.y, 0);
      // 保存滚转角度
      if (data.cameraRoll !== undefined) {
        player.targetRoll = data.cameraRoll;
      }
    }
  }

  removeOtherPlayer(playerId) {
    const player = this.otherPlayers.get(playerId);
    if (player) {
      this.scene.remove(player.group);
      this.otherPlayers.delete(playerId);
    }
  }

  sendPlayerUpdate(position, rotation, cameraRoll = 0) {
    if (this.socket && this.connected) {
      this.socket.emit('playerMove', {
        position: {
          x: position.x,
          y: position.y,
          z: position.z
        },
        rotation: {
          x: rotation.x,
          y: rotation.y,
          z: rotation.z
        },
        cameraRoll: cameraRoll
      });
    }
  }

  sendPlayerShoot(position, direction) {
    if (this.socket && this.connected) {
      this.socket.emit('playerShoot', {
        position: {
          x: position.x,
          y: position.y,
          z: position.z
        },
        direction: {
          x: direction.x,
          y: direction.y,
          z: direction.z
        }
      });
    }
  }

  sendPlayerDamage(victimId, damage) {
    if (this.socket && this.connected) {
      this.socket.emit('playerDamage', {
        victimId: victimId,
        damage: damage
      });
    }
  }

  getOtherPlayersList() {
    return Array.from(this.otherPlayers.entries()).map(([id, data]) => ({
      id: id,
      group: data.group
    }));
  }

  showOtherPlayerShot(data) {
    // 创建简单的射击特效
    const flashGeometry = new THREE.SphereGeometry(0.3, 8, 8);
    const flashMaterial = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 1
    });
    const flash = new THREE.Mesh(flashGeometry, flashMaterial);
    flash.position.copy(data.position);
    this.scene.add(flash);
    
    // 淡出并移除
    const fadeOut = () => {
      flashMaterial.opacity -= 0.05;
      if (flashMaterial.opacity <= 0) {
        this.scene.remove(flash);
        flashGeometry.dispose();
        flashMaterial.dispose();
      } else {
        requestAnimationFrame(fadeOut);
      }
    };
    fadeOut();
  }

  update(delta) {
    // 平滑更新其他玩家位置
    this.otherPlayers.forEach((player) => {
      // 位置插值
      player.group.position.lerp(player.targetPosition, 0.2);
      
      // Y轴旋转（左右转向）
      player.group.rotation.y += (player.targetRotation.y - player.group.rotation.y) * 0.2;
      player.group.rotation.x = 0;
      
      // Z轴滚转（太空中的桶滚效果）
      if (player.targetRoll !== undefined) {
        player.group.rotation.z = player.targetRoll;
      } else {
        player.group.rotation.z = 0;
      }
    });
    
    // 每秒发送20次位置更新
    if (!this.lastUpdate || Date.now() - this.lastUpdate > 50) {
      if (this.localPlayer && this.localPlayer.camera) {
        this.sendPlayerUpdate(
          this.localPlayer.camera.position,
          this.localPlayer.camera.rotation,
          this.localPlayer.getRollAngle ? this.localPlayer.getRollAngle() : 0
        );
      }
      this.lastUpdate = Date.now();
    }
  }

  createOtherPlayerLabel(group, playerId) {
    // 创建canvas用于文本渲染
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    // 绘制ID标签
    this.drawPlayerLabel(ctx, canvas, playerId);
    
    // 创建纹理和材质
    const labelTexture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({
      map: labelTexture,
      transparent: true,
      depthTest: false,
      depthWrite: false
    });
    
    // 创建精灵
    const labelSprite = new THREE.Sprite(spriteMaterial);
    labelSprite.scale.set(2, 0.5, 1);
    labelSprite.position.set(0, 2, 0); // 头顶上方
    labelSprite.userData.labelTexture = labelTexture;
    labelSprite.userData.playerId = playerId;
    
    // 添加到组
    group.add(labelSprite);
  }

  drawPlayerLabel(ctx, canvas, playerId) {
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
    ctx.fillText(playerId, canvas.width / 2, 64);
  }

  updatePlayerId(newId) {
    if (this.socket && this.connected) {
      this.socket.emit('updatePlayerId', { playerId: newId });
    }
  }

  getRandomPlayerColor() {
    const colors = [
      0xff6b6b, // 红
      0x4ecdc4, // 青
      0xffe66d, // 黄
      0x95e1d3, // 绿
      0xf38181, // 粉
      0xaa96da, // 紫
      0xfcbad3, // 粉红
      0xa8e6cf  // 薄荷绿
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  updatePlayerCount() {
    const playerCount = this.otherPlayers.size + (this.connected ? 1 : 0);
    const element = document.getElementById('player-count');
    if (element) {
      element.textContent = `在线玩家: ${playerCount}`;
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}

