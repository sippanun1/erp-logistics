import Cookies from 'js-cookie';
import type { WsEvent } from '@shared/types';

type Handler = (event: WsEvent) => void;

let socket: WebSocket | null = null;
const handlers = new Set<Handler>();

export function connectWs(): void {
  if (socket?.readyState === WebSocket.OPEN) return;

  const token = Cookies.get('access_token');
  if (!token) return;

  // NEXT_PUBLIC_WS_URL is set at build time (e.g. wss://erp-gateway.onrender.com).
  // Falls back to the current browser host so it works in Docker Compose via Nginx.
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL ??
    `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}`;
  socket = new WebSocket(`${wsUrl}/ws?token=${token}`);

  socket.onmessage = (ev) => {
    try {
      const event: WsEvent = JSON.parse(ev.data);
      handlers.forEach((h) => h(event));
    } catch {
      // ignore malformed messages
    }
  };

  socket.onclose = () => {
    // Null out the old reference before reconnecting so connectWs()
    // doesn't see a stale CLOSING/CLOSED socket and skip the new connect
    socket = null;
    setTimeout(connectWs, 3000);
  };
}

export function disconnectWs(): void {
  socket?.close();
  socket = null;
}

export function onWsEvent(handler: Handler): () => void {
  handlers.add(handler);
  return () => handlers.delete(handler);
}
