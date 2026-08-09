import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface BaseNotification {
  id: string;
  title: string;
  message: string;
  type: string | null;
  target_url?: string | null;
  is_read: boolean;
  created_at: string;
}

export const useWebSocket = () => {
  const wsRef = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    let reconnectTimeout: ReturnType<typeof setTimeout>;

    const buildWebSocketUrl = () => {
      const apiBase = process.env.NEXT_PUBLIC_API_URL
        ? process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '')
        : window.location.origin;
      const wsUrl = new URL(apiBase);

      wsUrl.protocol = wsUrl.protocol === 'https:' ? 'wss:' : 'ws:';
      wsUrl.pathname = `${wsUrl.pathname.replace(/\/$/, '')}/api/notifications/ws`;

      return wsUrl;
    };
    
    // Create an async function to get the session and connect
    const connect = async () => {
      try {
        const tokenResponse = await fetch('/api/auth/access-token', { credentials: 'include', cache: 'no-store' });
        if (!tokenResponse.ok) return;
        const tokenBody = await tokenResponse.json() as { access_token?: unknown };
        const accessToken = typeof tokenBody.access_token === 'string' ? tokenBody.access_token : null;
        if (!accessToken) return;
        const wsUrl = buildWebSocketUrl();
        wsUrl.searchParams.set('token', accessToken);

        const ws = new WebSocket(wsUrl.toString());
        
        ws.onopen = () => {
          console.debug('WebSocket connected for notifications');
        };

        ws.onmessage = (event) => {
          try {
            const data: BaseNotification = JSON.parse(event.data);
            
            // Instantly prepend notification
            queryClient.setQueryData<BaseNotification[]>(["notifications"], (oldData) => {
              if (!oldData) return [data];
              // Avoid duplicates
              if (oldData.some(n => n.id === data.id)) return oldData;
              return [data, ...oldData];
            });

            // Show a visual toast for the new notification if we are in app
            toast(data.title, {
              description: data.message,
              position: "bottom-right",
            });

          } catch (error) {
            console.error("Failed to parse incoming WS message:", error);
          }
        };

        ws.onclose = (event) => {
          // If not normal closure (1000) or token rejected (1008), reconnect
          if (event.code !== 1000 && event.code !== 1008) {
            reconnectTimeout = setTimeout(connect, 5000);
          }
        };

        wsRef.current = ws;
      } catch (error) {
        console.error("WS connection setup failed:", error);
      }
    };

    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close(1000);
      }
      clearTimeout(reconnectTimeout);
    };
  }, [queryClient]);
};
