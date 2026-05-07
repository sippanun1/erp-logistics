import { Router } from 'express';
import proxy from 'express-http-proxy';
import type { Request } from 'express';
import { authenticate, requireRole, type AuthRequest } from '../middleware/auth.middleware';

const AUTH_URL = process.env.AUTH_SERVICE_URL!;
const ORDER_URL = process.env.ORDER_SERVICE_URL!;
const INVENTORY_URL = process.env.INVENTORY_SERVICE_URL!;
const BILLING_URL = process.env.BILLING_SERVICE_URL!;

export const proxyRoutes = Router();

/**
 * Inject the validated user identity into upstream request headers.
 * Backend services read these instead of re-verifying the JWT, keeping
 * JWT_SECRET out of every service's env and avoiding double-verification.
 */
function withUserHeaders(proxyReqOpts: Record<string, unknown>, srcReq: Request) {
  const user = (srcReq as AuthRequest).user;
  if (user) {
    const headers = (proxyReqOpts.headers ?? {}) as Record<string, string>;
    headers['x-user-id']    = user.sub;
    headers['x-user-email'] = user.email;
    headers['x-user-role']  = user.role;
    proxyReqOpts.headers = headers;
  }
  return proxyReqOpts;
}

// Auth routes — public (no JWT required for register/login)
proxyRoutes.use('/auth', proxy(AUTH_URL, { proxyReqPathResolver: (req) => `/api/auth${req.url}` }));

// User management — requires auth (gateway validates, service trusts x-user-* headers)
proxyRoutes.use(
  '/users',
  authenticate,
  proxy(AUTH_URL, {
    proxyReqPathResolver: (req) => `/api/users${req.url}`,
    proxyReqOptDecorator: withUserHeaders,
  }),
);

// Orders — requires auth; role enforcement is per-endpoint in the service
proxyRoutes.use(
  '/orders',
  authenticate,
  proxy(ORDER_URL, {
    proxyReqPathResolver: (req) => `/api/orders${req.url}`,
    proxyReqOptDecorator: withUserHeaders,
  }),
);

// Inventory — warehouse staff and admin only
proxyRoutes.use(
  '/inventory',
  authenticate,
  requireRole('ADMIN', 'WAREHOUSE_STAFF'),
  proxy(INVENTORY_URL, {
    proxyReqPathResolver: (req) => `/api/inventory${req.url}`,
    proxyReqOptDecorator: withUserHeaders,
  }),
);

// Billing — billing role and admin only
proxyRoutes.use(
  '/billing',
  authenticate,
  requireRole('ADMIN', 'BILLING'),
  proxy(BILLING_URL, {
    proxyReqPathResolver: (req) => `/api/billing${req.url}`,
    proxyReqOptDecorator: withUserHeaders,
  }),
);
