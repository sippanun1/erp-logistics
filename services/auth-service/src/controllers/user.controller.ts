import type { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../services/prisma';
import type { AuthRequest } from '../middleware/auth.middleware';

const updateRoleSchema = z.object({
  role: z.enum(['ADMIN', 'WAREHOUSE_STAFF', 'BILLING', 'CUSTOMER']),
});

export async function getMe(req: AuthRequest, res: Response): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.sub },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });
  if (!user) {
    res.status(404).json({ success: false, error: 'User not found' });
    return;
  }
  res.json({ success: true, data: user });
}

export async function listUsers(_req: Request, res: Response): Promise<void> {
  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, data: users });
}

export async function updateUserRole(req: Request, res: Response): Promise<void> {
  const parsed = updateRoleSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'Invalid role' });
    return;
  }

  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { role: parsed.data.role },
    select: { id: true, email: true, name: true, role: true },
  });
  res.json({ success: true, data: user });
}

export async function deactivateUser(req: Request, res: Response): Promise<void> {
  await prisma.user.update({
    where: { id: req.params.id },
    data: { isActive: false, deletedAt: new Date() },
  });
  res.json({ success: true, message: 'User deactivated' });
}
