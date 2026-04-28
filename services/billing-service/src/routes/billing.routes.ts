import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { create, list, getOne, updateStatus, revenueReport } from '../controllers/billing.controller';

export const billingRoutes = Router();

billingRoutes.post('/', authenticate, requireRole('ADMIN', 'BILLING'), create);
billingRoutes.get('/', authenticate, requireRole('ADMIN', 'BILLING'), list);
billingRoutes.get('/report/revenue', authenticate, requireRole('ADMIN', 'BILLING'), revenueReport);
billingRoutes.get('/:id', authenticate, requireRole('ADMIN', 'BILLING'), getOne);
billingRoutes.patch('/:id/status', authenticate, requireRole('ADMIN', 'BILLING'), updateStatus);
