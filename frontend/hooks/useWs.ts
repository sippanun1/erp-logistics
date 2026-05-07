'use client';
import { useEffect, useRef } from 'react';
import { connectWs, onWsEvent } from '@/lib/ws';
import type { WsEvent } from '@shared/types';

export function useWsEvent(handler: (event: WsEvent) => void) {
  // Keep the latest handler in a ref so the effect never needs to re-run
  // when the parent component re-renders with a logically identical callback.
  const handlerRef = useRef(handler);
  useEffect(() => { handlerRef.current = handler; }, [handler]);

  useEffect(() => {
    connectWs();
    const unsubscribe = onWsEvent((event) => handlerRef.current(event));
    return unsubscribe;
  }, []); // intentionally empty — connect once, always call latest handler
}
