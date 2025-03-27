const http = require('http');
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

console.log('✅ BabaChat WebSocket server running on port 8080');

const onlineUsers = new Map(); // 🟢 Track connected users by nickname

wss.on('connection', (ws) => {
  console.log('✅ Client connected');

  ws.on('message', (message) => {
    let msg;
    try {
      msg = JSON.parse(message);
    } catch (e) {
      console.error('❌ Invalid JSON received:', message);
      return;
    }

    // ✅ Handle nickname setup
    if (msg.type === 'init') {
      ws.nickname = msg.nick;
      onlineUsers.set(msg.nick, ws);
      console.log(`👤 ${ws.nickname} connected`);

      // ✅ Notify others that this user is online
      broadcastExceptSender(ws, {
        type: 'status',
        nick: msg.nick,
        status: 'online'
      });

      return;
    }

    // ✏️ Typing indicator
    if (msg.type === 'typing') {
      broadcastToRecipient(msg.to, {
        type: 'typing',
        from: msg.nick,
        to: msg.to
      });
      return;
    }

    // 💬 Message delivery
    if (msg.type === 'message') {
      broadcastToRecipient(msg.to, {
        type: 'message',
        from: msg.from,
        to: msg.to,
        text: msg.text
      });
      return;
    }

    console.log('📦 Unhandled message type:', msg.type);
  });

  // ❌ Handle disconnect
  ws.on('close', () => {
    const nick = ws.nickname;
    if (nick) {
      onlineUsers.delete(nick);
      console.log(`❌ ${nick} disconnected`);

      // 🕒 Broadcast offline status + last seen
      broadcastExceptSender(ws, {
        type: 'status',
        nick,
        status: 'offline',
        lastSeen: Date.now()
      });
    }
  });
});

// ✅ Send to a specific recipient only
function broadcastToRecipient(recipientName, data) {
  wss.clients.forEach((client) => {
    if (
      client.readyState === WebSocket.OPEN &&
      client.nickname === recipientName
    ) {
      client.send(JSON.stringify(data));
    }
  });
}

// ✅ Broadcast to all EXCEPT sender
function broadcastExceptSender(sender, data) {
  const message = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client !== sender && client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}
