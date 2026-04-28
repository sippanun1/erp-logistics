import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { billingRoutes } from './routes/billing.routes';
import { errorHandler } from './middleware/error.middleware';

const app = express();
const PORT = process.env.PORT ?? 3004;

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN ?? '*' }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ success: true, service: 'billing-service', status: 'healthy' });
});

app.use('/api/billing', billingRoutes);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[billing-service] running on port ${PORT}`);
});
