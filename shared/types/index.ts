// ─── Roles ───────────────────────────────────────────────────────────────────

export type Role = 'ADMIN' | 'WAREHOUSE_STAFF' | 'BILLING' | 'CUSTOMER';

// ─── API Response ─────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ValidationErrorResponse {
  success: false;
  error: 'Validation failed';
  details: Array<{ field: string; message: string }>;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface JwtPayload {
  sub: string;       // user id
  email: string;
  role: Role;
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

export interface OrderItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  customerId: string;
  status: OrderStatus;
  items: OrderItem[];
  shippingAddress: string;
  notes?: string;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Inventory ────────────────────────────────────────────────────────────────

export type StockTransactionType = 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT';

export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  unit: string;
  reorderThreshold: number;
  currentStock: number;
  warehouseLocation?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockTransaction {
  id: string;
  productId: string;
  type: StockTransactionType;
  quantity: number;
  orderId?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

// ─── Billing ──────────────────────────────────────────────────────────────────

export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'VOID';

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  orderId?: string;
  status: InvoiceStatus;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  dueDate: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── WebSocket Events ─────────────────────────────────────────────────────────

export type WsEventType =
  | 'STOCK_ALERT'
  | 'ORDER_STATUS_CHANGED'
  | 'DASHBOARD_METRICS';

export interface WsStockAlert {
  type: 'STOCK_ALERT';
  productId: string;
  productName: string;
  sku: string;
  currentStock: number;
  reorderThreshold: number;
}

export interface WsOrderStatusChanged {
  type: 'ORDER_STATUS_CHANGED';
  orderId: string;
  previousStatus: OrderStatus;
  newStatus: OrderStatus;
  customerId: string;
}

export interface WsDashboardMetrics {
  type: 'DASHBOARD_METRICS';
  ordersToday: number;
  pendingOrders: number;
  revenueToday: number;
  lowStockCount: number;
}

export type WsEvent = WsStockAlert | WsOrderStatusChanged | WsDashboardMetrics;
