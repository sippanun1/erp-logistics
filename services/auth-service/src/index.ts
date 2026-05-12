import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { authRoutes } from './routes/auth.routes';
import { userRoutes } from './routes/user.routes';
import { errorHandler } from './middleware/error.middleware';
import prisma from './services/prisma';

const app = express();
const PORT = process.env.PORT ?? 3001;

// Purge expired refresh tokens every 6 hours.
// Without this the table grows indefinitely — every login + refresh adds a row,
// and tokens are only deleted on explicit logout or rotation.
async function purgeExpiredTokens(): Promise<void> {
  try {
    const { count } = await prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    if (count > 0) console.log(`[auth-service] purged ${count} expired refresh token(s)`);
  } catch (err) {
    console.error('[auth-service] token purge failed:', err);
  }
}
// Run once on startup then every 6 hours
purgeExpiredTokens();
setInterval(purgeExpiredTokens, 6 * 60 * 60 * 1000);

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN ?? '*' }));
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, error: 'Too many requests, please try again later.' },
});
app.use(limiter);

app.get('/health', (_req, res) => {
  res.json({ success: true, service: 'auth-service', status: 'healthy' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[auth-service] running on port ${PORT}`);
});
