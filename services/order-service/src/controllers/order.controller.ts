import type { Response } from 'express';
import { z } from 'zod';
import { createOrder, getOrders, getOrderById, updateOrderStatus } from '../services/order.service';
import type { AuthRequest } from '../middleware/auth.middleware';
import type { OrderStatus } from '../../../../shared/types/index';

const orderItemSchema = z.object({
  productId: z.string().uuid(),
  productName: z.string().min(1),
  sku: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
});

const createOrderSchema = z.object({
  shippingAddress: z.string().min(5),
  notes: z.string().optional(),
  items: z.array(orderItemSchema).min(1),
});

const updateStatusSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
  note: z.string().optional(),
});

export async function create(req: AuthRequest, res: Response): Promise<void> {
  const parsed = createOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: parsed.error.errors.map((e) => ({ field: String(e.path[0]), message: e.message })),
    });
    return;
  }

  const customerId = req.user!.role === 'CUSTOMER' ? req.user!.sub : (req.body.customerId ?? req.user!.sub);
  const order = await createOrder({ ...parsed.data, customerId, createdBy: req.user!.sub });
  res.status(201).json({ success: true, data: order });
}

export async function list(req: AuthRequest, res: Response): Promise<void> {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const status = req.query.status as OrderStatus | undefined;

  // Customers can only see their own orders
  const customerId = req.user!.role === 'CUSTOMER' ? req.user!.sub : (req.query.customerId as string | undefined);

  const { orders, total } = await getOrders({ customerId, status }, page, limit);
  res.json({
    success: true,
    data: orders,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function getOne(req: AuthRequest, res: Response): Promise<void> {
  const order = await getOrderById(req.params.id);
  if (!order) {
    res.status(404).json({ success: false, error: 'Order not found' });
    return;
  }

  if (req.user!.role === 'CUSTOMER' && order.customerId !== req.user!.sub) {
    res.status(403).json({ success: false, error: 'Access denied' });
    return;
  }

  res.json({ success: true, data: order });
}

export async function updateStatus(req: AuthRequest, res: Response): Promise<void> {
  const parsed = updateStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'Invalid status value' });
    return;
  }

  try {
    const order = await updateOrderStatus(
      req.params.id,
      parsed.data.status,
      req.user!.sub,
      parsed.data.note,
    );
    res.json({ success: true, data: order });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'ORDER_NOT_FOUND') {
        res.status(404).json({ success: false, error: 'Order not found' });
        return;
      }
      if (err.message.startsWith('INVALID_TRANSITION')) {
        const [, from, to] = err.message.split(':');
        res.status(422).json({ success: false, error: `Cannot transition order from ${from} to ${to}` });
        return;
      }
    }
    throw err;
  }
}
