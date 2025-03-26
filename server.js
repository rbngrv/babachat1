const http = require('http');
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

console.log('✅ BabaChat WebSocket server running on port 8080');

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
      console.log(`👤 ${ws.nickname} connected`);
      return;
    }

    // ✅ Typing indicator
    if (msg.type === 'typing') {
      broadcastToRecipient(msg.to, {
        type: 'typing',
        from: msg.nick,
        to: msg.to,
      });
      return;
    }

    // ✅ Message delivery
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

  ws.on('close', () => {
    console.log(`❌ ${ws.nickname || 'Unknown user'} disconnected`);
  });
});

function broadcastToRecipient(recipientName, data) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && client.nickname === recipientName) {
      client.send(JSON.stringify(data));
    }
  });
}
