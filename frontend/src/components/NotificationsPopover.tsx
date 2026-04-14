"use client";

import React, { useState, useEffect, useRef } from "react";
import { Bell, Check, Info } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string | null;
  is_read: boolean;
  created_at: string;
}

// Ensure base64 padding is correct for VAPID conversion
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function NotificationsPopover() {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Close context menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery<NotificationItem[]>({
    queryKey: ["notifications"],
    queryFn: () => api.get("/api/notifications/"),
    refetchInterval: 30000, // Poll every 30s
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => api.post(`/api/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const subscribePushMutation = useMutation({
    mutationFn: (subscription: PushSubscriptionJSON) =>
      api.post("/api/notifications/subscribe", subscription),
    onSuccess: () => {
      toast.success("Уведомления включены");
    },
  });

  const handleSubscribePush = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      toast.error("Ваш браузер не поддерживает push-уведомления.");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("Уведомления не разрешены пользователем.");
        return;
      }

      // Register the service worker if not already registered
      const registration = await navigator.serviceWorker.register("/worker-development.js");
      await navigator.serviceWorker.ready;

      // Ensure you replace this with your actual VAPID public key
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "BIz_YOUR_DEFAULT_VAPID_PUBLIC_KEY_HERE";
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });

      subscribePushMutation.mutate(subscription.toJSON());
    } catch (error) {
      console.error("Error subscribing to push", error);
      toast.error("Ошибка при подписке на уведомления.");
    }
  };

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center w-9 h-9 rounded-md transition-colors hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600"
        title="Уведомления"
      >
        <Bell size={18} strokeWidth={2} />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.15 }}
            className="absolute left-full top-0 ml-4 w-80 bg-white border border-neutral-200 shadow-xl rounded-xl z-50 overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-neutral-100 bg-neutral-50/50">
              <h3 className="font-semibold text-neutral-900 text-sm">Уведомления</h3>
              {Notification.permission !== "granted" && (
                <button
                  onClick={handleSubscribePush}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Включить push
                </button>
              )}
            </div>

            <div className="max-h-[360px] overflow-y-auto w-full">
              {isLoading ? (
                <div className="p-8 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-neutral-300 border-t-neutral-800 rounded-full animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 flex flex-col items-center justify-center text-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 mb-1">
                    <Bell size={18} />
                  </div>
                  <p className="text-sm font-medium text-neutral-600">Нет новых уведомлений</p>
                  <p className="text-xs text-neutral-400">Здесь будут появляться важные обновления</p>
                </div>
              ) : (
                <ul className="flex flex-col">
                  {notifications.map((notif) => (
                    <li
                      key={notif.id}
                      className={`relative flex gap-3 p-4 border-b border-neutral-50 last:border-0 hover:bg-neutral-50/80 transition-colors ${
                        !notif.is_read ? "bg-blue-50/30" : ""
                      }`}
                    >
                      <div className="shrink-0 mt-0.5">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            !notif.is_read ? "bg-blue-100 text-blue-600" : "bg-neutral-100 text-neutral-500"
                          }`}
                        >
                          {notif.type === "success" ? (
                            <Check size={14} strokeWidth={2.5} />
                          ) : (
                            <Info size={14} strokeWidth={2.5} />
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 pr-8">
                        <p className={`text-sm mb-0.5 ${!notif.is_read ? 'font-semibold text-neutral-900' : 'font-medium text-neutral-700'}`}>
                          {notif.title}
                        </p>
                        <p className="text-[13px] text-neutral-500 leading-relaxed mb-1.5 break-words">
                          {notif.message}
                        </p>
                        <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
                          {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: ru })}
                        </span>
                      </div>

                      {!notif.is_read && (
                        <button
                          onClick={() => markAsReadMutation.mutate(notif.id)}
                          disabled={markAsReadMutation.isPending}
                          className="absolute right-4 top-4 w-6 h-6 rounded-full flex items-center justify-center hover:bg-neutral-200 transition-colors opacity-0 group-hover:opacity-100 sm:opacity-100 text-neutral-400 hover:text-neutral-700"
                          title="Отметить как прочитанное"
                        >
                          <Check size={14} />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
