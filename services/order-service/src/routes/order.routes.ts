import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { create, list, getOne, updateStatus } from '../controllers/order.controller';

export const orderRoutes = Router();

orderRoutes.post('/', authenticate, create);
orderRoutes.get('/', authenticate, list);
orderRoutes.get('/:id', authenticate, getOne);
orderRoutes.patch('/:id/status', authenticate, requireRole('ADMIN', 'WAREHOUSE_STAFF'), updateStatus);
