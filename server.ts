import express from 'express';
import { createServer as createHttpServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const MAX_LOBBY_PLAYERS = 80;

interface ConnectedPlayer {
  id: string;
  name: string;
  gender: 'male' | 'female';
  x: number;
  y: number;
  facing: number;
  walkCycle: number;
  podId: string | null;
  color: string;
  lastSeen: number;
}

const players = new Map<string, ConnectedPlayer>();
const sockets = new Map<string, WebSocket>();

const PLAYER_COLORS = [
  '#38bdf8',
  '#f59e0b',
  '#10b981',
  '#ec4899',
  '#8b5cf6',
  '#f43f5e',
  '#14b8a6',
  '#eab308',
];

function pruneStalePlayers() {
  const now = Date.now();
  for (const [id, p] of players.entries()) {
    // Remove players who haven't sent a heartbeat/update in 25 seconds and have no open socket
    const ws = sockets.get(id);
    const wsOpen = ws && ws.readyState === WebSocket.OPEN;
    if (!wsOpen && now - p.lastSeen > 15000) {
      players.delete(id);
      sockets.delete(id);
    }
  }
}

function broadcastLobbyState(excludeId?: string) {
  pruneStalePlayers();
  const payload = JSON.stringify({
    type: 'lobby:state',
    maxPlayers: MAX_LOBBY_PLAYERS,
    players: Array.from(players.values()),
  });

  for (const [id, client] of sockets.entries()) {
    if (id !== excludeId && client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());

  const httpServer = createHttpServer(app);

  // WebSocket Server attached to the same HTTP Server on Port 3000
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws) => {
    let currentPlayerId: string | null = null;

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());

        if (msg.type === 'player:join' || msg.type === 'player:update') {
          const id = String(msg.id || '').trim();
          if (!id) return;

          pruneStalePlayers();

          if (!players.has(id) && players.size >= MAX_LOBBY_PLAYERS) {
            ws.send(
              JSON.stringify({
                type: 'lobby:full',
                maxPlayers: MAX_LOBBY_PLAYERS,
                message: `Lobby has reached its maximum capacity of ${MAX_LOBBY_PLAYERS} players.`,
              })
            );
            return;
          }

          currentPlayerId = id;
          sockets.set(id, ws);

          const existing = players.get(id);
          const color =
            existing?.color ||
            PLAYER_COLORS[players.size % PLAYER_COLORS.length];

          const updated: ConnectedPlayer = {
            id,
            name: String(msg.name || existing?.name || `Guardian-${id.slice(0, 4)}`).slice(0, 20),
            gender: msg.gender === 'female' ? 'female' : 'male',
            x: typeof msg.x === 'number' ? msg.x : existing?.x ?? 440,
            y: typeof msg.y === 'number' ? msg.y : existing?.y ?? 460,
            facing: typeof msg.facing === 'number' ? msg.facing : existing?.facing ?? -Math.PI / 2,
            walkCycle: typeof msg.walkCycle === 'number' ? msg.walkCycle : existing?.walkCycle ?? 0,
            podId: msg.podId !== undefined ? msg.podId : existing?.podId ?? null,
            color,
            lastSeen: Date.now(),
          };

          players.set(id, updated);

          // Send full state to the joining player, and broadcast to others
          ws.send(
            JSON.stringify({
              type: 'lobby:state',
              maxPlayers: MAX_LOBBY_PLAYERS,
              players: Array.from(players.values()),
            })
          );
          broadcastLobbyState(id);
        } else if (msg.type === 'player:leave') {
          if (currentPlayerId) {
            players.delete(currentPlayerId);
            sockets.delete(currentPlayerId);
            broadcastLobbyState();
          }
        }
      } catch {
        // Ignore malformed packets
      }
    });

    ws.on('close', () => {
      if (currentPlayerId) {
        players.delete(currentPlayerId);
        sockets.delete(currentPlayerId);
        broadcastLobbyState();
      }
    });
  });

  // HTTP REST API endpoints for real-time sync & fallback
  app.get('/api/lobby/state', (_req, res) => {
    pruneStalePlayers();
    res.json({
      maxPlayers: MAX_LOBBY_PLAYERS,
      count: players.size,
      players: Array.from(players.values()),
    });
  });

  app.post('/api/lobby/sync', (req, res) => {
    pruneStalePlayers();
    const { id, name, gender, x, y, facing, walkCycle, podId } = req.body || {};
    if (!id) {
      res.status(400).json({ error: 'Missing player id' });
      return;
    }

    if (!players.has(id) && players.size >= MAX_LOBBY_PLAYERS) {
      res.status(429).json({
        error: 'LOBBY_FULL',
        maxPlayers: MAX_LOBBY_PLAYERS,
        players: Array.from(players.values()),
      });
      return;
    }

    const existing = players.get(id);
    const color =
      existing?.color || PLAYER_COLORS[players.size % PLAYER_COLORS.length];

    const updated: ConnectedPlayer = {
      id: String(id),
      name: String(name || existing?.name || `Guardian-${String(id).slice(0, 4)}`).slice(0, 20),
      gender: gender === 'female' ? 'female' : 'male',
      x: typeof x === 'number' ? x : existing?.x ?? 440,
      y: typeof y === 'number' ? y : existing?.y ?? 460,
      facing: typeof facing === 'number' ? facing : existing?.facing ?? -Math.PI / 2,
      walkCycle: typeof walkCycle === 'number' ? walkCycle : existing?.walkCycle ?? 0,
      podId: podId !== undefined ? podId : existing?.podId ?? null,
      color,
      lastSeen: Date.now(),
    };

    players.set(String(id), updated);
    broadcastLobbyState(String(id));

    res.json({
      maxPlayers: MAX_LOBBY_PLAYERS,
      count: players.size,
      players: Array.from(players.values()),
    });
  });

  app.post('/api/lobby/leave', (req, res) => {
    const { id } = req.body || {};
    if (id) {
      players.delete(String(id));
      sockets.delete(String(id));
      broadcastLobbyState();
    }
    res.json({ ok: true });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Chrono Guardians Multiplayer Server running on http://0.0.0.0:${PORT} (Max ${MAX_LOBBY_PLAYERS} players)`);
  });
}

startServer();
