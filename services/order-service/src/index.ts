import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { orderRoutes } from './routes/order.routes';
import { errorHandler } from './middleware/error.middleware';

const app = express();
const PORT = process.env.PORT ?? 3002;

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN ?? '*' }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ success: true, service: 'order-service', status: 'healthy' });
});

app.use('/api/orders', orderRoutes);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[order-service] running on port ${PORT}`);
});
