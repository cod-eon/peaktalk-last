"use client";

import { useWebSocket } from '@/hooks/useWebSocket';

export function NotificationRealtime() {
  useWebSocket();
  return null;
}
