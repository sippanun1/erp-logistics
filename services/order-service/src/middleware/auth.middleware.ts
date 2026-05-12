import type { Request, Response, NextFunction } from 'express';
import type { JwtPayload, Role } from '../../../../shared/types/index';

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

/**
 * Reads the user identity from headers injected by the API Gateway.
 * The gateway validates the JWT and forwards x-user-id / x-user-email / x-user-role
 * so individual services never need JWT_SECRET.
 * Direct calls that bypass the gateway will lack these headers and get 401.
 */
export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const userId    = req.headers['x-user-id']    as string | undefined;
  const userEmail = req.headers['x-user-email'] as string | undefined;
  const userRole  = req.headers['x-user-role']  as string | undefined;

  if (!userId || !userEmail || !userRole) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  req.user = { sub: userId, email: userEmail, role: userRole as Role };
  next();
}

export function requireRole(...roles: Role[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ success: false, error: 'Insufficient permissions' });
      return;
    }
    next();
  };
}
