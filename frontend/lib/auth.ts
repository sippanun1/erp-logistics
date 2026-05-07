import Cookies from 'js-cookie';
import type { AuthUser, Role } from '@shared/types';

export function saveTokens(accessToken: string, refreshToken: string): void {
  Cookies.set('access_token', accessToken, { secure: true, sameSite: 'strict' });
  Cookies.set('refresh_token', refreshToken, { secure: true, sameSite: 'strict', expires: 7 });
}

export function clearTokens(): void {
  Cookies.remove('access_token');
  Cookies.remove('refresh_token');
}

export function parseJwt(token: string): AuthUser | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = JSON.parse(atob(base64));
    return { id: json.sub, email: json.email, name: json.name ?? '', role: json.role as Role };
  } catch {
    return null;
  }
}

export function getStoredUser(): AuthUser | null {
  const token = Cookies.get('access_token');
  if (!token) return null;
  return parseJwt(token);
}

export const ROLE_HOME: Record<Role, string> = {
  ADMIN: '/orders',
  WAREHOUSE_STAFF: '/orders',
  BILLING: '/billing',
  CUSTOMER: '/orders',
};
