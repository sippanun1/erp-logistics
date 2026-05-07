import Cookies from 'js-cookie';
import type { WsEvent } from '@shared/types';

type Handler = (event: WsEvent) => void;

let socket: WebSocket | null = null;
const handlers = new Set<Handler>();

export function connectWs(): void {
  if (socket?.readyState === WebSocket.OPEN) return;

  const token = Cookies.get('access_token');
  if (!token) return;

  const wsBase = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000')
    .replace(/^http/, 'ws');
  socket = new WebSocket(`${wsBase}/ws?token=${token}`);

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
