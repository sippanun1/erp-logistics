import { Router } from 'express';
import proxy from 'express-http-proxy';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const AUTH_URL = process.env.AUTH_SERVICE_URL!;
const ORDER_URL = process.env.ORDER_SERVICE_URL!;
const INVENTORY_URL = process.env.INVENTORY_SERVICE_URL!;
const BILLING_URL = process.env.BILLING_SERVICE_URL!;

export const proxyRoutes = Router();

// Auth routes — public (no JWT required for register/login)
proxyRoutes.use('/auth', proxy(AUTH_URL, { proxyReqPathResolver: (req) => `/api/auth${req.url}` }));

// User management — requires auth (gateway validates, service trusts)
proxyRoutes.use(
  '/users',
  authenticate,
  proxy(AUTH_URL, { proxyReqPathResolver: (req) => `/api/users${req.url}` }),
);

// Orders — requires auth; role enforcement is per-endpoint in the service
proxyRoutes.use(
  '/orders',
  authenticate,
  proxy(ORDER_URL, { proxyReqPathResolver: (req) => `/api/orders${req.url}` }),
);

// Inventory — warehouse staff and admin only
proxyRoutes.use(
  '/inventory',
  authenticate,
  requireRole('ADMIN', 'WAREHOUSE_STAFF'),
  proxy(INVENTORY_URL, { proxyReqPathResolver: (req) => `/api/inventory${req.url}` }),
);

// Billing — billing role and admin only
proxyRoutes.use(
  '/billing',
  authenticate,
  requireRole('ADMIN', 'BILLING'),
  proxy(BILLING_URL, { proxyReqPathResolver: (req) => `/api/billing${req.url}` }),
);
