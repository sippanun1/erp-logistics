import type { Request, Response } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { registerUser, loginUser } from '../services/auth.service';
import { rotateRefreshToken, revokeRefreshToken, verifyAccessToken } from '../services/token.service';
import type { JwtPayload } from '../../../../shared/types/index';

const registerSchema = z.object({
  // Normalise to lowercase so User@Co.com and user@co.com are the same account
  email: z.string().email().transform((e) => e.toLowerCase()),
  name: z.string().min(2).max(100),
  password: z.string().min(8),
  // Role is NOT accepted from the request body — all public registrations are CUSTOMER.
  // Only an ADMIN can elevate a user via PUT /users/:id/role.
});

const loginSchema = z.object({
  email: z.string().email().transform((e) => e.toLowerCase()),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export async function register(req: Request, res: Response): Promise<void> {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: parsed.error.errors.map((e) => ({ field: String(e.path[0]), message: e.message })),
    });
    return;
  }

  try {
    const result = await registerUser(parsed.data);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    if (err instanceof Error && err.message === 'EMAIL_TAKEN') {
      res.status(409).json({ success: false, error: 'Email already registered' });
      return;
    }
    throw err;
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'Invalid credentials' });
    return;
  }

  try {
    const result = await loginUser(parsed.data.email, parsed.data.password);
    res.json({ success: true, data: result });
  } catch {
    res.status(401).json({ success: false, error: 'Invalid email or password' });
  }
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const parsed = refreshSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'Refresh token required' });
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Access token required' });
    return;
  }

  try {
    // jwt.decode does NOT verify the signature or expiry — intentional here.
    // The refresh token is the proof of identity; we only need the payload
    // from the old access token to know which user/role to mint the new one for.
    const decoded = jwt.decode(authHeader.slice(7)) as JwtPayload | null;
    if (!decoded?.sub || !decoded.email || !decoded.role) {
      res.status(401).json({ success: false, error: 'Malformed access token' });
      return;
    }
    const tokens = await rotateRefreshToken(
      parsed.data.refreshToken,
      decoded.sub,
      decoded.email,
      decoded.role,
    );
    res.json({ success: true, data: tokens });
  } catch {
    res.status(401).json({ success: false, error: 'Invalid or expired refresh token' });
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  const parsed = refreshSchema.safeParse(req.body);
  if (parsed.success) {
    await revokeRefreshToken(parsed.data.refreshToken);
  }
  res.json({ success: true, message: 'Logged out successfully' });
}

export async function verifyToken(req: Request, res: Response): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Missing token' });
    return;
  }

  try {
    const payload = verifyAccessToken(header.slice(7));
    res.json({ success: true, data: payload });
  } catch {
    res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
}
