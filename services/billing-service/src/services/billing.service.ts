import prisma from './prisma';
import type { InvoiceStatus } from '../../../../shared/types/index';

// Valid status transitions — prevents nonsensical moves like PAID → DRAFT
const ALLOWED_TRANSITIONS: Partial<Record<InvoiceStatus, InvoiceStatus[]>> = {
  DRAFT:   ['SENT', 'VOID'],
  SENT:    ['PAID', 'OVERDUE', 'VOID'],
  OVERDUE: ['PAID', 'VOID'],
  PAID:    [],          // terminal — cannot be changed
  VOID:    [],          // terminal — cannot be changed
};

/**
 * Generate an invoice number inside the same DB transaction as the invoice
 * create so the sequence increment and the invoice row are always atomic.
 * Uses a raw UPDATE ... RETURNING to avoid Prisma's non-atomic find-then-upsert.
 */
async function generateInvoiceNumber(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  // Atomic upsert via raw SQL — no race condition possible
  const result = await tx.$queryRaw<{ sequence: number }[]>`
    INSERT INTO billing."invoice_sequences" (year, month, sequence)
    VALUES (${year}, ${month}, 1)
    ON CONFLICT (year, month)
    DO UPDATE SET sequence = billing."invoice_sequences".sequence + 1
    RETURNING sequence
  `;

  const seq = result[0].sequence;
  return `INV-${year}${String(month).padStart(2, '0')}-${String(seq).padStart(4, '0')}`;
}

export async function createInvoice(data: {
  customerId: string;
  orderId?: string;
  taxRate?: number;
  dueDate: Date;
  notes?: string;
  createdBy: string;
  lineItems: Array<{ description: string; quantity: number; unitPrice: number }>;
}) {
  const taxRate = data.taxRate ?? 7;
  const subtotal = data.lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const taxAmount = subtotal * (taxRate / 100);
  const totalAmount = subtotal + taxAmount;

  // Run sequence increment + invoice create in one transaction — no duplicate numbers
  return prisma.$transaction(async (tx) => {
    const invoiceNumber = await generateInvoiceNumber(tx);

    return tx.invoice.create({
      data: {
        invoiceNumber,
        customerId: data.customerId,
        orderId: data.orderId,
        taxRate,
        subtotal,
        taxAmount,
        totalAmount,
        dueDate: data.dueDate,
        notes: data.notes,
        createdBy: data.createdBy,
        lineItems: {
          create: data.lineItems.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice,
          })),
        },
      },
      include: { lineItems: true },
    });
  });
}

export async function getInvoices(
  filter: { customerId?: string; status?: InvoiceStatus },
  page: number,
  limit: number,
) {
  const where = {
    ...(filter.customerId ? { customerId: filter.customerId } : {}),
    ...(filter.status ? { status: filter.status } : {}),
  };
  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      include: { lineItems: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.invoice.count({ where }),
  ]);
  return { invoices, total };
}

export async function getInvoiceById(id: string) {
  return prisma.invoice.findUnique({
    where: { id },
    include: { lineItems: true },
  });
}

export async function updateInvoiceStatus(id: string, status: InvoiceStatus) {
  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) throw new Error('INVOICE_NOT_FOUND');

  const allowed = ALLOWED_TRANSITIONS[invoice.status as InvoiceStatus] ?? [];
  if (!allowed.includes(status)) {
    throw new Error(`INVALID_TRANSITION:${invoice.status}:${status}`);
  }

  return prisma.invoice.update({
    where: { id },
    data: {
      status,
      ...(status === 'PAID' ? { paidAt: new Date() } : {}),
    },
    include: { lineItems: true },
  });
}

export async function getRevenueReport(from: Date, to: Date) {
  const invoices = await prisma.invoice.findMany({
    where: { status: 'PAID', paidAt: { gte: from, lte: to } },
    select: { totalAmount: true, paidAt: true },
  });

  const total = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
  return { total, count: invoices.length, from, to };
}
