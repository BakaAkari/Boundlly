import * as THREE from 'three';

export class MultiplayerManager {
  constructor(scene, localPlayer) {
    this.scene = scene;
    this.localPlayer = localPlayer;
    this.otherPlayers = new Map(); // 存储其他玩家 { id: { mesh, lastUpdate } }
    this.socket = null;
    this.playerId = null;
    this.updateInterval = 50; // 50ms 发送一次位置更新
    this.lastUpdateTime = 0;
    
    this.connect();
  }

  getWebSocketUrl() {
    // 开发环境
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'ws://localhost:3001';
    }
    
    // 生产环境 - 使用相同的主机名
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    
    // 如果通过 NPM 反向代理，使用 /ws 路径
    // 否则使用端口 3001
    return `${protocol}//${host}/ws`;
  }

  connect() {
    // 自动检测 WebSocket 服务器地址
    const wsUrl = this.getWebSocketUrl();
    
    console.log('尝试连接到多人服务器:', wsUrl);
    
    try {
      this.socket = new WebSocket(wsUrl);
      
      this.socket.onopen = () => {
        console.log('已连接到多人服务器');
      };
      
      this.socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      };
      
      this.socket.onerror = (error) => {
        console.log('多人服务器连接失败，将以单人模式运行');
      };
      
      this.socket.onclose = () => {
        console.log('与多人服务器断开连接');
      };
    } catch (error) {
      console.log('无法连接到多人服务器，将以单人模式运行');
    }
  }

  handleMessage(data) {
    switch (data.type) {
      case 'init':
        // 服务器分配的玩家 ID
        this.playerId = data.id;
        console.log('玩家 ID:', this.playerId);
        break;
        
      case 'playerJoined':
        // 新玩家加入
        console.log('玩家加入:', data.id);
        this.createOtherPlayer(data.id);
        break;
        
      case 'playerLeft':
        // 玩家离开
        console.log('玩家离开:', data.id);
        this.removeOtherPlayer(data.id);
        break;
        
      case 'playerUpdate':
        // 更新其他玩家位置
        this.updateOtherPlayer(data.id, data.position, data.rotation);
        break;
        
      case 'players':
        // 当前所有玩家列表
        data.players.forEach(player => {
          if (player.id !== this.playerId && !this.otherPlayers.has(player.id)) {
            this.createOtherPlayer(player.id);
            this.updateOtherPlayer(player.id, player.position, player.rotation);
          }
        });
        break;
    }
  }

  createOtherPlayer(id) {
    // 创建简单的几何体代表其他玩家
    const geometry = new THREE.BoxGeometry(2, 2, 3);
    const material = new THREE.MeshStandardMaterial({
      color: 0x00ff00,
      emissive: 0x004400
    });
    const mesh = new THREE.Mesh(geometry, material);
    
    // 添加一个方向指示器
    const arrowGeometry = new THREE.ConeGeometry(0.5, 2, 8);
    const arrowMaterial = new THREE.MeshStandardMaterial({
      color: 0xffff00,
      emissive: 0x444400
    });
    const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
    arrow.rotation.x = Math.PI / 2;
    arrow.position.z = -2;
    mesh.add(arrow);
    
    this.scene.add(mesh);
    this.otherPlayers.set(id, {
      mesh: mesh,
      targetPosition: new THREE.Vector3(),
      targetRotation: new THREE.Euler()
    });
  }

  removeOtherPlayer(id) {
    const player = this.otherPlayers.get(id);
    if (player) {
      this.scene.remove(player.mesh);
      this.otherPlayers.delete(id);
    }
  }

  updateOtherPlayer(id, position, rotation) {
    if (id === this.playerId) return;
    
    let player = this.otherPlayers.get(id);
    if (!player) {
      this.createOtherPlayer(id);
      player = this.otherPlayers.get(id);
    }
    
    if (player && position && rotation) {
      // 设置目标位置和旋转，用于平滑插值
      player.targetPosition.set(position.x, position.y, position.z);
      player.targetRotation.set(rotation.x, rotation.y, rotation.z);
    }
  }

  sendUpdate() {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return;
    }
    
    // 发送本地玩家位置和旋转
    const position = this.localPlayer.camera.position;
    const rotation = this.localPlayer.camera.rotation;
    
    const data = {
      type: 'update',
      position: {
        x: position.x,
        y: position.y,
        z: position.z
      },
      rotation: {
        x: rotation.x,
        y: rotation.y,
        z: rotation.z
      }
    };
    
    this.socket.send(JSON.stringify(data));
  }

  update(delta) {
    // 定期发送位置更新
    const currentTime = performance.now();
    if (currentTime - this.lastUpdateTime > this.updateInterval) {
      this.sendUpdate();
      this.lastUpdateTime = currentTime;
    }
    
    // 平滑移动其他玩家
    this.otherPlayers.forEach(player => {
      // 使用插值使移动更平滑
      player.mesh.position.lerp(player.targetPosition, 0.2);
      player.mesh.rotation.x = THREE.MathUtils.lerp(player.mesh.rotation.x, player.targetRotation.x, 0.2);
      player.mesh.rotation.y = THREE.MathUtils.lerp(player.mesh.rotation.y, player.targetRotation.y, 0.2);
      player.mesh.rotation.z = THREE.MathUtils.lerp(player.mesh.rotation.z, player.targetRotation.z, 0.2);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
    }
  }
}

