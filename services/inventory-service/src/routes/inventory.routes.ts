import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { addProduct, listProducts, stockTransaction, lowStockAlerts, transactionHistory } from '../controllers/inventory.controller';

export const inventoryRoutes = Router();

inventoryRoutes.post('/products', authenticate, requireRole('ADMIN', 'WAREHOUSE_STAFF'), addProduct);
inventoryRoutes.get('/products', authenticate, listProducts);
inventoryRoutes.post('/transactions', authenticate, requireRole('ADMIN', 'WAREHOUSE_STAFF'), stockTransaction);
inventoryRoutes.get('/products/:productId/transactions', authenticate, requireRole('ADMIN', 'WAREHOUSE_STAFF'), transactionHistory);
inventoryRoutes.get('/low-stock', authenticate, requireRole('ADMIN', 'WAREHOUSE_STAFF', 'BILLING'), lowStockAlerts);
