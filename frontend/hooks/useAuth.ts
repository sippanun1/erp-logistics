'use client';
import { useState, useEffect } from 'react';
import { getStoredUser } from '@/lib/auth';
import type { AuthUser } from '../../shared/types/index';

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(getStoredUser());
    setLoading(false);
  }, []);

  return { user, loading };
}
