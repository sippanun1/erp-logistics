import express from 'express';
import http from 'http';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import { proxyRoutes } from './routes/proxy.routes';
import type { JwtPayload } from '../../../shared/types/index';

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT ?? 3000;
const JWT_SECRET = process.env.JWT_SECRET!;

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN ?? 'http://localhost:3005',
  credentials: true,
}));
app.use(express.json());

const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, error: 'Too many requests' },
});

const authedLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { success: false, error: 'Too many requests' },
});

app.use('/api/auth', publicLimiter);
app.use('/api', authedLimiter);

app.get('/health', (_req, res) => {
  res.json({ success: true, service: 'api-gateway', status: 'healthy' });
});

app.use('/api', proxyRoutes);

// WebSocket server — clients authenticate with token in query string
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws, req) => {
  const url = new URL(req.url ?? '', `http://localhost`);
  const token = url.searchParams.get('token');

  if (!token) {
    ws.close(1008, 'Token required');
    return;
  }

  let user: JwtPayload;
  try {
    user = jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    ws.close(1008, 'Invalid token');
    return;
  }

  ws.send(JSON.stringify({ type: 'CONNECTED', userId: user.sub, role: user.role }));

  ws.on('error', (err) => console.error('[ws error]', err.message));
});

// Expose wss so services can broadcast events
export { wss };

server.listen(PORT, () => {
  console.log(`[api-gateway] running on port ${PORT}`);
});
