'use client';
import { useEffect } from 'react';
import { connectWs, onWsEvent } from '@/lib/ws';
import type { WsEvent } from '../../shared/types/index';

export function useWsEvent(handler: (event: WsEvent) => void) {
  useEffect(() => {
    connectWs();
    const unsubscribe = onWsEvent(handler);
    return unsubscribe;
  }, [handler]);
}
