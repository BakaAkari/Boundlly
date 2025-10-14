import { WebSocketServer } from 'ws';

const PORT = process.env.WS_PORT || 3001;
const wss = new WebSocketServer({ port: PORT });

// 存储所有连接的玩家
const players = new Map(); // { ws: { id, position, rotation } }
let nextPlayerId = 1;

console.log(`多人游戏服务器运行在端口 ${PORT}`);

wss.on('connection', (ws) => {
  const playerId = `player_${nextPlayerId++}`;
  
  // 初始化玩家
  players.set(ws, {
    id: playerId,
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 }
  });
  
  console.log(`玩家 ${playerId} 已连接，当前在线: ${players.size}`);
  
  // 发送玩家 ID
  ws.send(JSON.stringify({
    type: 'init',
    id: playerId
  }));
  
  // 发送当前所有玩家列表
  const currentPlayers = Array.from(players.values());
  ws.send(JSON.stringify({
    type: 'players',
    players: currentPlayers
  }));
  
  // 通知其他玩家有新玩家加入
  broadcast({
    type: 'playerJoined',
    id: playerId
  }, ws);
  
  // 处理消息
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'update') {
        const player = players.get(ws);
        if (player) {
          player.position = data.position;
          player.rotation = data.rotation;
          
          // 广播位置更新给其他玩家
          broadcast({
            type: 'playerUpdate',
            id: player.id,
            position: data.position,
            rotation: data.rotation
          }, ws);
        }
      }
    } catch (error) {
      console.error('处理消息出错:', error);
    }
  });
  
  // 处理断开连接
  ws.on('close', () => {
    const player = players.get(ws);
    if (player) {
      console.log(`玩家 ${player.id} 已断开，当前在线: ${players.size - 1}`);
      
      // 通知其他玩家
      broadcast({
        type: 'playerLeft',
        id: player.id
      }, ws);
      
      players.delete(ws);
    }
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket 错误:', error);
  });
});

// 广播消息给所有玩家（除了发送者）
function broadcast(data, excludeWs = null) {
  const message = JSON.stringify(data);
  players.forEach((player, ws) => {
    if (ws !== excludeWs && ws.readyState === ws.OPEN) {
      ws.send(message);
    }
  });
}

