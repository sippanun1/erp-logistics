import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { inventoryRoutes } from './routes/inventory.routes';
import { errorHandler } from './middleware/error.middleware';

const app = express();
const PORT = process.env.PORT ?? 3003;

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN ?? '*' }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ success: true, service: 'inventory-service', status: 'healthy' });
});

app.use('/api/inventory', inventoryRoutes);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[inventory-service] running on port ${PORT}`);
});
