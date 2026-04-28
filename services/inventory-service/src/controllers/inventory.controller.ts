import type { Response } from 'express';
import { z } from 'zod';
import { createProduct, getProducts, recordTransaction, getLowStockProducts } from '../services/inventory.service';
import type { AuthRequest } from '../middleware/auth.middleware';

const createProductSchema = z.object({
  sku: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  unit: z.string().default('pcs'),
  reorderThreshold: z.number().int().nonnegative().default(10),
  warehouseLocation: z.string().optional(),
});

const transactionSchema = z.object({
  productId: z.string().uuid(),
  type: z.enum(['STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT']),
  quantity: z.number().int().positive(),
  orderId: z.string().uuid().optional(),
  notes: z.string().optional(),
});

export async function addProduct(req: AuthRequest, res: Response): Promise<void> {
  const parsed = createProductSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: parsed.error.errors.map((e) => ({ field: String(e.path[0]), message: e.message })),
    });
    return;
  }
  const product = await createProduct(parsed.data);
  res.status(201).json({ success: true, data: product });
}

export async function listProducts(req: AuthRequest, res: Response): Promise<void> {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const search = req.query.search as string | undefined;
  const { products, total } = await getProducts(page, limit, search);
  res.json({
    success: true,
    data: products,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function stockTransaction(req: AuthRequest, res: Response): Promise<void> {
  const parsed = transactionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: parsed.error.errors.map((e) => ({ field: String(e.path[0]), message: e.message })),
    });
    return;
  }

  try {
    const result = await recordTransaction({ ...parsed.data, createdBy: req.user!.sub });
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'PRODUCT_NOT_FOUND') {
        res.status(404).json({ success: false, error: 'Product not found' });
        return;
      }
      if (err.message === 'INSUFFICIENT_STOCK') {
        res.status(422).json({ success: false, error: 'Insufficient stock for this transaction' });
        return;
      }
    }
    throw err;
  }
}

export async function lowStockAlerts(_req: AuthRequest, res: Response): Promise<void> {
  const products = await getLowStockProducts();
  res.json({ success: true, data: products });
}
