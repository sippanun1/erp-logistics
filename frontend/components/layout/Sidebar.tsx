'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Package, ShoppingCart, Receipt, Users, LogOut, LayoutDashboard } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '@/hooks/useAuth';
import { clearTokens } from '@/lib/auth';
import type { Role } from '../../../shared/types/index';

const NAV_ITEMS: { href: string; label: string; icon: React.ReactNode; roles: Role[] }[] = [
  { href: '/orders', label: 'Orders', icon: <ShoppingCart size={18} />, roles: ['ADMIN', 'WAREHOUSE_STAFF', 'CUSTOMER'] },
  { href: '/inventory', label: 'Inventory', icon: <Package size={18} />, roles: ['ADMIN', 'WAREHOUSE_STAFF'] },
  { href: '/billing', label: 'Billing', icon: <Receipt size={18} />, roles: ['ADMIN', 'BILLING'] },
  { href: '/users', label: 'Users', icon: <Users size={18} />, roles: ['ADMIN'] },
];

export function Sidebar() {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  function logout() {
    clearTokens();
    router.push('/login');
  }

  const visibleItems = NAV_ITEMS.filter((item) => user && item.roles.includes(user.role));

  return (
    <aside className="w-56 h-screen bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0">
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <LayoutDashboard size={20} className="text-brand-600" />
          <span className="font-bold text-gray-900 text-sm">ERP Logistics</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {visibleItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
              pathname.startsWith(item.href)
                ? 'bg-brand-50 text-brand-700 font-medium'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
            )}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-gray-100">
        <div className="px-3 mb-3">
          <p className="text-xs font-medium text-gray-900 truncate">{user?.name}</p>
          <p className="text-xs text-gray-500">{user?.role.replace('_', ' ')}</p>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 w-full transition-colors"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
