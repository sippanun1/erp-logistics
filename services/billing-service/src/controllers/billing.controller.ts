import type { Response } from 'express';
import { z } from 'zod';
import {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoiceStatus,
  getRevenueReport,
} from '../services/billing.service';
import type { AuthRequest } from '../middleware/auth.middleware';
import type { InvoiceStatus } from '../../../../shared/types/index';

const lineItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
});

const createInvoiceSchema = z.object({
  customerId: z.string().uuid(),
  orderId: z.string().uuid().optional(),
  taxRate: z.number().min(0).max(100).optional(),
  dueDate: z.string().datetime(),
  notes: z.string().optional(),
  lineItems: z.array(lineItemSchema).min(1),
});

const updateStatusSchema = z.object({
  status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'VOID']),
});

export async function create(req: AuthRequest, res: Response): Promise<void> {
  const parsed = createInvoiceSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: parsed.error.errors.map((e) => ({ field: String(e.path[0]), message: e.message })),
    });
    return;
  }

  const invoice = await createInvoice({
    ...parsed.data,
    dueDate: new Date(parsed.data.dueDate),
    createdBy: req.user!.sub,
  });
  res.status(201).json({ success: true, data: invoice });
}

export async function list(req: AuthRequest, res: Response): Promise<void> {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const status = req.query.status as InvoiceStatus | undefined;
  const customerId = req.query.customerId as string | undefined;

  const { invoices, total } = await getInvoices({ customerId, status }, page, limit);
  res.json({
    success: true,
    data: invoices,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function getOne(req: AuthRequest, res: Response): Promise<void> {
  const invoice = await getInvoiceById(req.params.id);
  if (!invoice) {
    res.status(404).json({ success: false, error: 'Invoice not found' });
    return;
  }
  res.json({ success: true, data: invoice });
}

export async function updateStatus(req: AuthRequest, res: Response): Promise<void> {
  const parsed = updateStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'Invalid status' });
    return;
  }

  try {
    const invoice = await updateInvoiceStatus(req.params.id, parsed.data.status);
    res.json({ success: true, data: invoice });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'INVOICE_NOT_FOUND') {
        res.status(404).json({ success: false, error: 'Invoice not found' });
        return;
      }
      if (err.message.startsWith('INVALID_TRANSITION')) {
        const [, from, to] = err.message.split(':');
        res.status(422).json({ success: false, error: `Cannot transition invoice from ${from} to ${to}` });
        return;
      }
    }
    throw err;
  }
}

export async function revenueReport(req: AuthRequest, res: Response): Promise<void> {
  const fromStr = req.query.from as string;
  const toStr = req.query.to as string;

  if (!fromStr || !toStr) {
    res.status(400).json({ success: false, error: 'from and to query params required (ISO dates)' });
    return;
  }

  const from = new Date(fromStr);
  const to = new Date(toStr);
  if (isNaN(from.getTime()) || isNaN(to.getTime())) {
    res.status(400).json({ success: false, error: 'Invalid date format' });
    return;
  }

  const report = await getRevenueReport(from, to);
  res.json({ success: true, data: report });
}
