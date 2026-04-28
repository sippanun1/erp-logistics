'use client';
import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { AlertTriangle } from 'lucide-react';
import api from '@/lib/api';
import { useWsEvent } from '@/hooks/useWs';
import type { Product, WsEvent } from '../../../../shared/types/index';

export default function InventoryPage() {
  const [products, setProducts] = useState<(Product & { currentStock: number })[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchProducts() {
    try {
      const { data } = await api.get('/inventory/products');
      setProducts(data.data);
    } catch {
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchProducts(); }, []);

  const handleWsEvent = useCallback((event: WsEvent) => {
    if (event.type === 'STOCK_ALERT') {
      toast(`Low stock: ${event.productName} (${event.currentStock} left)`, {
        icon: '⚠️',
        duration: 6000,
      });
      fetchProducts();
    }
  }, []);

  useWsEvent(handleWsEvent);

  if (loading) return <div className="text-gray-500 text-sm">Loading inventory...</div>;

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Inventory</h1>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">SKU</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Location</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Stock</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Reorder At</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">No products yet</td>
              </tr>
            ) : (
              products.map((p) => {
                const isLow = p.currentStock <= p.reorderThreshold;
                return (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{p.sku}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                    <td className="px-4 py-3 text-gray-500">{p.warehouseLocation ?? '—'}</td>
                    <td className="px-4 py-3 text-right font-medium">{p.currentStock} {p.unit}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{p.reorderThreshold}</td>
                    <td className="px-4 py-3">
                      {isLow ? (
                        <span className="flex items-center gap-1 text-amber-600 text-xs font-medium">
                          <AlertTriangle size={13} /> Low Stock
                        </span>
                      ) : (
                        <span className="text-green-600 text-xs font-medium">OK</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
