import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { getMe, listUsers, updateUserRole, deactivateUser } from '../controllers/user.controller';

export const userRoutes = Router();

userRoutes.get('/me', authenticate, getMe);
userRoutes.get('/', authenticate, requireRole('ADMIN'), listUsers);
userRoutes.patch('/:id/role', authenticate, requireRole('ADMIN'), updateUserRole);
userRoutes.delete('/:id', authenticate, requireRole('ADMIN'), deactivateUser);
