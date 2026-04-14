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

export function NotificationsPopover({ isExpanded }: { isExpanded: boolean }) {
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
    refetchInterval: 30000,
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => api.post(`/api/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  return (
    <div className="relative w-full" ref={popoverRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-3 px-2.5 h-9 transition-all duration-150 w-full relative group
          ${isOpen ? "bg-neutral-100 text-neutral-900" : "text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50"}
        `}
      >
        <div className="relative shrink-0">
          <Bell
            size={17}
            strokeWidth={isOpen ? 2.5 : 2}
            className={`transition-colors ${isOpen ? "text-neutral-900" : "text-neutral-400 group-hover:text-neutral-500"}`}
          />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-neutral-900 text-[9px] font-bold text-white flex items-center justify-center rounded-full border border-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>
        
        <AnimatePresence>
          {isExpanded && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              className={`text-[13px] whitespace-nowrap font-inter ${isOpen ? "font-semibold text-neutral-900" : "font-medium"}`}
            >
              Уведомления
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: -10, y: 0 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className={`
              fixed left-[72px] bottom-16 ml-3 w-80 bg-white border border-neutral-200 shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-none z-[100] overflow-hidden flex flex-col
              ${isExpanded ? "left-[240px]" : "left-[72px]"}
            `}
            style={{ transition: "left 0.22s ease-in-out" }}
          >
            <div className="p-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/30">
              <h3 className="text-[11px] font-bold text-neutral-400 tracking-widest uppercase">
                Сигналы системы
              </h3>
              {unreadCount > 0 && (
                <span className="text-[10px] font-mono bg-neutral-900 text-white px-1.5 py-0.5">
                  {unreadCount} НОВЫХ
                </span>
              )}
            </div>

            <div className="max-h-[400px] overflow-y-auto scrollbar-hide py-2">
              {isLoading ? (
                <div className="p-12 flex justify-center">
                  <div className="w-5 h-5 border-2 border-neutral-200 border-t-neutral-800 rounded-full animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-12 text-center">
                  <Bell className="w-8 h-8 text-neutral-100 mx-auto mb-3" />
                  <p className="text-xs font-medium text-neutral-400 uppercase tracking-tight">Пусто</p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`
                        group relative p-4 hover:bg-neutral-50 transition-colors border-b border-neutral-50 last:border-0
                        ${!notif.is_read ? "bg-white" : "opacity-60"}
                      `}
                    >
                      {!notif.is_read && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-neutral-900" />
                      )}
                      
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-start">
                          <span className={`text-[13px] leading-tight ${!notif.is_read ? "font-bold text-neutral-900" : "font-medium text-neutral-600"}`}>
                            {notif.title}
                          </span>
                          {!notif.is_read && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsReadMutation.mutate(notif.id);
                              }}
                              className="w-5 h-5 flex items-center justify-center text-neutral-300 hover:text-neutral-900 transition-colors"
                            >
                              <Check size={14} />
                            </button>
                          )}
                        </div>
                        <p className="text-[12px] text-neutral-500 leading-relaxed">
                          {notif.message}
                        </p>
                        <span className="text-[10px] font-mono text-neutral-300 mt-1">
                          {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: ru })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <Link 
              href="/settings" 
              onClick={() => setIsOpen(false)}
              className="p-3 bg-neutral-50 border-t border-neutral-100 text-center text-[10px] font-bold text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-all uppercase tracking-widest"
            >
              Настройки уведомлений
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
