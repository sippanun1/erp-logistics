import prisma from './prisma';
import type { InvoiceStatus } from '../../../shared/types/index';

async function generateInvoiceNumber(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const seq = await prisma.invoiceSequence.upsert({
    where: { year_month: { year, month } },
    create: { year, month, sequence: 1 },
    update: { sequence: { increment: 1 } },
  });

  return `INV-${year}${String(month).padStart(2, '0')}-${String(seq.sequence).padStart(4, '0')}`;
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
  const invoiceNumber = await generateInvoiceNumber();

  return prisma.invoice.create({
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
  if (invoice.status === 'VOID') throw new Error('INVOICE_VOID');

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
