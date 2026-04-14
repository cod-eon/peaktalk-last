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

export function NotificationsPopover({ isExpanded, isMobile = false }: { isExpanded?: boolean; isMobile?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const router = useRouter();

  useEffect(() => { setMounted(true); }, []);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!triggerRef.current?.contains(t) && !panelRef.current?.contains(t)) {
        setIsOpen(false);
      }
    };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setIsOpen(false); };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", handler); document.removeEventListener("keydown", esc); };
  }, [isOpen]);

  // Scroll lock on mobile
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
    if (!notification.is_read) await markAsReadMutation.mutateAsync(notification.id);
    setIsOpen(false);
    router.push(notification.target_url || "/dashboard");
  };

  // ── Shared notification list ───────────────────────────────────────────────
  const notificationsList = (
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-neutral-100 flex items-center justify-between bg-white shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="text-[11px] font-bold text-neutral-400 tracking-widest uppercase whitespace-nowrap">
            Уведомления
          </h3>
          {unreadCount > 0 && (
            <span className="text-[10px] font-mono bg-neutral-900 text-white px-1.5 py-0.5 rounded-sm shrink-0">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => void markAllAsReadMutation.mutateAsync()}
            disabled={markAllAsReadMutation.isPending}
            className="text-[11px] text-neutral-500 hover:text-neutral-900 transition-colors whitespace-nowrap shrink-0 ml-3"
          >
            Прочитать все
          </button>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto py-1" style={{ maxHeight: isMobile ? "60vh" : "380px" }}>
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <div className="w-5 h-5 border-2 border-neutral-200 border-t-neutral-800 rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="w-8 h-8 text-neutral-200 mx-auto mb-3" />
            <p className="text-xs text-neutral-400">Нет уведомлений</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => void handleNotificationClick(notif)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); void handleNotificationClick(notif); } }}
                role="button"
                tabIndex={0}
                className={`relative px-4 py-3 hover:bg-neutral-50 transition-colors text-left w-full cursor-pointer border-b border-neutral-50 last:border-0 ${!notif.is_read ? "bg-white" : "opacity-60"}`}
              >
                {!notif.is_read && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-neutral-900" />}
                <div className="flex flex-col gap-0.5">
                  <div className="flex justify-between items-start gap-2">
                    <span className={`text-[13px] leading-tight ${!notif.is_read ? "font-bold text-neutral-900" : "font-medium text-neutral-600"}`}>
                      {notif.title}
                    </span>
                    {!notif.is_read && (
                      <button
                        onClick={(e) => { e.stopPropagation(); void markAsReadMutation.mutateAsync(notif.id); }}
                        className="w-5 h-5 flex items-center justify-center text-neutral-300 hover:text-neutral-900 transition-colors shrink-0"
                        title="Прочитать"
                      >
                        <Check size={14} />
                      </button>
                    )}
                  </div>
                  <p className="text-[12px] text-neutral-500 leading-relaxed">{notif.message}</p>
                  <span className="text-[10px] font-mono text-neutral-300 mt-0.5">
                    {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: ru })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <Link
        href="/settings"
        onClick={() => setIsOpen(false)}
        className="p-3 bg-neutral-50 border-t border-neutral-100 text-center text-[10px] font-bold text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-all uppercase tracking-widest shrink-0"
      >
        Настройки уведомлений
      </Link>
    </div>
  );

  // ── Bell button ────────────────────────────────────────────────────────────
  const bellButton = (
    <button
      ref={triggerRef}
      type="button"
      onClick={() => setIsOpen(!isOpen)}
      className={`
        flex items-center transition-all duration-150 relative group
        ${isMobile
          ? "h-9 w-9 justify-center"
          : "gap-3 px-2.5 h-9 w-full"}
        ${isOpen
          ? "bg-neutral-100 text-neutral-900"
          : "text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50"}
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
  );

  // ── Mobile: portal with AnimatePresence INSIDE ─────────────────────────────
  const mobilePortal = mounted && isMobile
    ? createPortal(
        <AnimatePresence>
          {isOpen && (
            <>
              <motion.div
                key="notif-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/20 backdrop-blur-sm"
                style={{ zIndex: 90 }}
                onClick={() => setIsOpen(false)}
              />
              <motion.div
                key="notif-sheet"
                ref={panelRef}
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 260 }}
                className="fixed inset-x-0 bottom-0 bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.1)] rounded-t-2xl flex flex-col overflow-hidden"
                style={{ zIndex: 100, maxHeight: "85vh" }}
              >
                <div className="w-full flex items-center justify-center pt-3 pb-1 shrink-0">
                  <div className="w-10 h-1 bg-neutral-200 rounded-full" />
                </div>
                {notificationsList}
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )
    : null;

  // ── Desktop: inline panel ──────────────────────────────────────────────────
  const desktopInlinePanel = !isMobile ? (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="notif-desktop"
          ref={panelRef}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -8 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className={`fixed w-80 bg-white border border-neutral-200 shadow-[0_20px_50px_rgba(0,0,0,0.15)] z-[100] overflow-hidden flex flex-col ${isExpanded ? "left-[252px]" : "left-[84px]"}`}
          style={{
            bottom: 64,
            maxHeight: "min(520px, calc(100vh - 80px))",
            transition: "left 0.22s ease-in-out",
          }}
        >
          {notificationsList}
        </motion.div>
      )}
    </AnimatePresence>
  ) : null;

  return (
    <div className={`relative ${isMobile ? "" : "w-[216px]"}`}>
      {bellButton}
      {mobilePortal}
      {desktopInlinePanel}
    </div>
  );
}
