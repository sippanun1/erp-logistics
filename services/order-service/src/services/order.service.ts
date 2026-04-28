import prisma from './prisma';
import type { OrderStatus } from '../../../shared/types/index';

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

export async function createOrder(data: {
  customerId: string;
  shippingAddress: string;
  notes?: string;
  createdBy: string;
  items: Array<{
    productId: string;
    productName: string;
    sku: string;
    quantity: number;
    unitPrice: number;
  }>;
}) {
  const totalAmount = data.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);

  return prisma.order.create({
    data: {
      customerId: data.customerId,
      shippingAddress: data.shippingAddress,
      notes: data.notes,
      totalAmount,
      createdBy: data.createdBy,
      items: { create: data.items },
      statusLogs: {
        create: { toStatus: 'PENDING', changedBy: data.createdBy },
      },
    },
    include: { items: true, statusLogs: { orderBy: { createdAt: 'desc' }, take: 1 } },
  });
}

export async function getOrders(filter: { customerId?: string; status?: OrderStatus }, page: number, limit: number) {
  const where = {
    ...(filter.customerId ? { customerId: filter.customerId } : {}),
    ...(filter.status ? { status: filter.status } : {}),
  };
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);
  return { orders, total };
}

export async function getOrderById(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: { items: true, statusLogs: { orderBy: { createdAt: 'desc' } } },
  });
}

export async function updateOrderStatus(
  id: string,
  newStatus: OrderStatus,
  changedBy: string,
  note?: string,
) {
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw new Error('ORDER_NOT_FOUND');

  const allowed = VALID_TRANSITIONS[order.status];
  if (!allowed.includes(newStatus)) {
    throw new Error(`INVALID_TRANSITION:${order.status}:${newStatus}`);
  }

  return prisma.order.update({
    where: { id },
    data: {
      status: newStatus,
      statusLogs: {
        create: { fromStatus: order.status, toStatus: newStatus, changedBy, note },
      },
    },
    include: { items: true },
  });
}
