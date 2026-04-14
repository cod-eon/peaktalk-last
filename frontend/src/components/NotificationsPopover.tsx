"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Bell, Check } from "lucide-react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { AnimatePresence, motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string | null;
  target_url?: string | null;
  is_read: boolean;
  created_at: string;
}

export function NotificationsPopover({ isExpanded, isMobile = false }: { isExpanded?: boolean, isMobile?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!triggerRef.current?.contains(target) && !panelRef.current?.contains(target)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  // Scroll lock on mobile when open
  useEffect(() => {
    if (!isMobile || !isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [isMobile, isOpen]);

  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery<NotificationItem[]>({
    queryKey: ["notifications"],
    queryFn: () => api.get("/api/notifications/"),
    refetchInterval: 60000,
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => api.post(`/api/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => api.post("/api/notifications/read-all"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const handleNotificationClick = async (notification: NotificationItem) => {
    if (!notification.is_read) {
      await markAsReadMutation.mutateAsync(notification.id);
    }
    setIsOpen(false);
    router.push(notification.target_url || "/dashboard");
  };

  const renderNotificationsList = () => (
    <div className="flex flex-col h-full w-full">
      <div className="p-4 border-b border-neutral-100 flex items-center justify-between bg-white/60 backdrop-blur-md sticky top-0 z-10 shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="text-[11px] font-bold text-neutral-400 tracking-widest uppercase">
            Сигналы системы
          </h3>
          {unreadCount > 0 && (
            <span className="text-[10px] font-mono bg-neutral-900 text-white px-1.5 py-0.5 rounded-sm">
              {unreadCount} НОВЫХ
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => void markAllAsReadMutation.mutateAsync()}
          disabled={unreadCount === 0 || markAllAsReadMutation.isPending}
          className="h-8 px-3 border border-neutral-200 bg-white hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed text-[10px] font-mono uppercase tracking-[0.14em] text-neutral-700 transition-colors"
        >
          Прочитать все
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2" style={{ maxHeight: isMobile ? '60vh' : '400px' }}>
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
          <div className="flex flex-col gap-1 px-2">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => void handleNotificationClick(notif)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); void handleNotificationClick(notif); } }}
                role="button"
                tabIndex={0}
                className={`group relative p-3 rounded-lg hover:bg-neutral-50 transition-colors border border-transparent text-left w-full cursor-pointer ${!notif.is_read ? "bg-white border-neutral-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]" : "opacity-75"}`}
              >
                {!notif.is_read && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-neutral-900 rounded-r-full" />
                )}
                <div className="flex flex-col gap-[2px] pl-2">
                  <div className="flex justify-between items-start">
                    <span className={`text-[13px] leading-tight ${!notif.is_read ? "font-bold text-neutral-900" : "font-medium text-neutral-600"}`}>
                      {notif.title}
                    </span>
                    {!notif.is_read && (
                      <button
                        onClick={(e) => { e.stopPropagation(); void markAsReadMutation.mutateAsync(notif.id); }}
                        className="w-5 h-5 flex items-center justify-center text-neutral-300 hover:text-neutral-900 transition-colors rounded-full hover:bg-neutral-100"
                        title="Пометить как прочитанное"
                      >
                        <Check size={14} />
                      </button>
                    )}
                  </div>
                  <p className="text-[12px] text-neutral-500 leading-relaxed max-w-[90%]">{notif.message}</p>
                  <span className="text-[10px] font-mono text-neutral-300 mt-1 uppercase tracking-tight">
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
        className="p-3 bg-neutral-50/50 border-t border-neutral-100 text-center text-[10px] font-bold text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-all uppercase tracking-widest shrink-0"
      >
        Настройки уведомлений
      </Link>
    </div>
  );

  // ── Mobile: bottom sheet via portal ─────────────────────────────────────────
  const mobileSheet = mounted ? createPortal(
    <>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-neutral-900/20 backdrop-blur-sm"
        style={{ zIndex: 90 }}
        onClick={() => setIsOpen(false)}
      />
      <motion.div
        key="sheet"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 260 }}
        className="fixed inset-x-0 bottom-0 bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.1)] rounded-t-2xl flex flex-col overflow-hidden"
        style={{ zIndex: 100, maxHeight: "min(85vh, 720px)" }}
        ref={panelRef}
      >
        <div className="w-full flex items-center justify-center pt-3 pb-1 shrink-0">
          <div className="w-12 h-1.5 bg-neutral-200 rounded-full" />
        </div>
        {renderNotificationsList()}
      </motion.div>
    </>,
    document.body
  ) : null;

  // ── Desktop: fixed panel anchored to sidebar ─────────────────────────────────
  const desktopPanel = (
    <motion.div
      key="desktop-panel"
      ref={panelRef}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="fixed w-80 bg-white border border-neutral-200 shadow-[0_20px_50px_rgba(0,0,0,0.15)] z-[100] overflow-hidden flex flex-col"
      style={{
        left: isExpanded ? 252 : 84,
        bottom: 64,
        maxHeight: "min(520px, calc(100vh - 80px))",
        transition: "left 0.22s ease-in-out",
      }}
    >
      {renderNotificationsList()}
    </motion.div>
  );

  return (
    <div className={`relative ${isMobile ? '' : 'w-[216px]'}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center transition-all duration-150 relative group
          ${isMobile
            ? "h-9 w-9 justify-center border border-transparent hover:border-neutral-200 hover:bg-neutral-50"
            : "gap-3 px-2.5 h-9 w-full"}
          ${isMobile
            ? (isOpen ? "bg-neutral-100 border-neutral-200 text-neutral-900" : "text-neutral-400 hover:text-neutral-600")
            : (isOpen ? "bg-neutral-100 text-neutral-900" : "text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50")}
        `}
        aria-expanded={isOpen}
        aria-label="Открыть уведомления"
      >
        <div className="relative shrink-0">
          <Bell
            size={isMobile ? 19 : 17}
            strokeWidth={isOpen ? 2.5 : 2}
            className={`transition-colors ${isOpen ? "text-neutral-900" : "text-neutral-400 group-hover:text-neutral-900"}`}
          />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-neutral-900 text-[9px] font-bold text-white flex items-center justify-center rounded-full border border-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>

        <AnimatePresence>
          {!isMobile && isExpanded && (
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
        {isOpen && (isMobile ? mobileSheet : desktopPanel)}
      </AnimatePresence>
    </div>
  );
}
