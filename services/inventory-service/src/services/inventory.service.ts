import prisma from './prisma';
import type { StockTransactionType } from '../../../shared/types/index';

export async function getCurrentStock(productId: string): Promise<number> {
  const result = await prisma.stockTransaction.aggregate({
    where: { productId },
    _sum: {
      quantity: true,
    },
  });
  // STOCK_IN and ADJUSTMENT(+) are positive; STOCK_OUT and ADJUSTMENT(-) are stored as negative quantities
  return result._sum.quantity ?? 0;
}

export async function createProduct(data: {
  sku: string;
  name: string;
  description?: string;
  unit?: string;
  reorderThreshold?: number;
  warehouseLocation?: string;
}) {
  return prisma.product.create({ data });
}

export async function getProducts(page: number, limit: number, search?: string) {
  const where = search
    ? { deletedAt: null, OR: [{ name: { contains: search, mode: 'insensitive' as const } }, { sku: { contains: search, mode: 'insensitive' as const } }] }
    : { deletedAt: null };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { name: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  const productsWithStock = await Promise.all(
    products.map(async (p) => ({ ...p, currentStock: await getCurrentStock(p.id) })),
  );

  return { products: productsWithStock, total };
}

export async function recordTransaction(data: {
  productId: string;
  type: StockTransactionType;
  quantity: number;
  orderId?: string;
  notes?: string;
  createdBy: string;
}) {
  // STOCK_OUT quantities are stored as negative
  const signedQty = data.type === 'STOCK_OUT' ? -Math.abs(data.quantity) : Math.abs(data.quantity);

  const product = await prisma.product.findUnique({ where: { id: data.productId } });
  if (!product) throw new Error('PRODUCT_NOT_FOUND');

  const currentStock = await getCurrentStock(data.productId);
  if (data.type === 'STOCK_OUT' && currentStock + signedQty < 0) {
    throw new Error('INSUFFICIENT_STOCK');
  }

  const tx = await prisma.stockTransaction.create({
    data: { ...data, quantity: signedQty },
    include: { product: true },
  });

  const newStock = currentStock + signedQty;
  const isLow = newStock <= product.reorderThreshold;

  return { transaction: tx, currentStock: newStock, isLowStock: isLow, product };
}

export async function getLowStockProducts() {
  const products = await prisma.product.findMany({ where: { deletedAt: null } });
  const withStock = await Promise.all(
    products.map(async (p) => ({ ...p, currentStock: await getCurrentStock(p.id) })),
  );
  return withStock.filter((p) => p.currentStock <= p.reorderThreshold);
}
