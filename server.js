// server.js
import { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 8080 });

// Keep latest dot per player id
const dots = {}; // { [id]: {x,y} }

function broadcast(obj) {
  const msg = JSON.stringify(obj);
  for (const client of wss.clients) {
    if (client.readyState === 1) client.send(msg);
  }
}

wss.on("connection", (ws) => {
  const id = "p-" + Math.random().toString(16).slice(2, 10);
  ws._id = id;

  // Tell this client their id + current state
  ws.send(JSON.stringify({ type: "welcome", id }));
  ws.send(JSON.stringify({ type: "state", dots }));

  ws.on("message", (raw) => {
    let msg;
    try { msg = JSON.parse(raw.toString()); } catch { return; }

    if (msg.type === "dot" && typeof msg.x === "number" && typeof msg.y === "number") {
      dots[id] = { x: msg.x, y: msg.y };
      broadcast({ type: "dot", id, x: msg.x, y: msg.y });
    }
  });

  ws.on("close", () => {
    delete dots[id];
    broadcast({ type: "state", dots });
  });
});

console.log("WebSocket server running on ws://localhost:8080");