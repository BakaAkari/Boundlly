import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// 提供静态文件
app.use(express.static(join(__dirname, 'dist')));

// 所有路由返回index.html
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

// 存储所有在线玩家
const players = new Map();

// Socket.io连接处理
io.on('connection', (socket) => {
  console.log(`玩家连接: ${socket.id}`);
  
  // 生成随机重生位置（半径50米球体内）
  const spawnRadius = 50;
  const radius = Math.random() * spawnRadius;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  
  const spawnX = radius * Math.sin(phi) * Math.cos(theta);
  const spawnY = radius * Math.sin(phi) * Math.sin(theta);
  const spawnZ = radius * Math.cos(phi);
  
  // 新玩家加入
  const newPlayer = {
    id: socket.id,
    position: { x: spawnX, y: spawnY, z: spawnZ },
    rotation: { x: 0, y: 0, z: 0 },
    cameraRoll: 0,
    playerId: '玩家'
  };
  
  players.set(socket.id, newPlayer);
  
  // 发送当前所有玩家给新玩家
  socket.emit('currentPlayers', Array.from(players.values()));
  
  // 通知其他玩家有新玩家加入
  socket.broadcast.emit('newPlayer', newPlayer);
  
  // 接收玩家移动
  socket.on('playerMove', (data) => {
    const player = players.get(socket.id);
    if (player) {
      player.position = data.position;
      player.rotation = data.rotation;
      player.cameraRoll = data.cameraRoll || 0;
      
      // 广播给其他玩家
      socket.broadcast.emit('playerMoved', {
        id: socket.id,
        position: data.position,
        rotation: data.rotation,
        cameraRoll: data.cameraRoll || 0
      });
    }
  });
  
  // 接收玩家射击
  socket.on('playerShoot', (data) => {
    socket.broadcast.emit('playerShot', {
      id: socket.id,
      position: data.position,
      direction: data.direction
    });
  });

  // 接收玩家伤害
  socket.on('playerDamage', (data) => {
    // 广播伤害事件给所有玩家（包括受害者）
    io.emit('playerDamaged', {
      attackerId: socket.id,
      victimId: data.victimId,
      damage: data.damage
    });
  });

  // 接收玩家ID更新
  socket.on('updatePlayerId', (data) => {
    const player = players.get(socket.id);
    if (player) {
      player.playerId = data.playerId;
      
      // 广播给其他玩家
      socket.broadcast.emit('playerIdUpdated', {
        playerId: socket.id,
        newId: data.playerId
      });
    }
  });
  
  // 玩家断开连接
  socket.on('disconnect', () => {
    console.log(`玩家断开: ${socket.id}`);
    players.delete(socket.id);
    io.emit('playerDisconnected', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`服务器运行在端口 ${PORT}`);
  console.log(`在线玩家数: ${players.size}`);
});

// 定期清理日志
setInterval(() => {
  console.log(`在线玩家数: ${players.size}`);
}, 30000);

