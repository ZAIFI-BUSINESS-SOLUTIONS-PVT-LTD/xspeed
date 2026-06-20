"use client";

import { useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import AOS from "aos";
import "aos/dist/aos.css";
import api from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";

interface Notif {
  id: number;
  title: string;
  message: string;
  notif_type: string;
  is_read: boolean;
}

function toastForNotif(n: Notif) {
  const preview = n.message.length > 130 ? n.message.slice(0, 130) + "…" : n.message;
  const opts = { description: preview, duration: 6000 };

  if (n.notif_type === "status_update") {
    const lower = n.title.toLowerCase();
    if (lower.includes("approved"))  return toast.success(n.title, opts);
    if (lower.includes("rejected"))  return toast.error(n.title, opts);
    if (lower.includes("waitlist"))  return toast.warning(n.title, opts);
    return toast.info(n.title, opts);
  }
  if (n.notif_type === "document") {
    const lower = n.title.toLowerCase();
    if (lower.includes("approved"))               return toast.success(n.title, opts);
    if (lower.includes("rejected"))               return toast.error(n.title, opts);
    if (lower.includes("re-upload"))              return toast.warning(n.title, opts);
    return toast.info(n.title, opts);
  }
  // default: admin message
  return toast.info(n.title, opts);
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const prevCountRef = useRef<number | null>(null);

  const poll = useCallback(async () => {
    if (!isAuthenticated()) return;
    try {
      const countRes = await api.get("/api/notifications/unread-count");
      const count: number = countRes.data.count;

      if (prevCountRef.current !== null && count > prevCountRef.current) {
        const notifsRes = await api.get("/api/notifications");
        const all: Notif[] = notifsRes.data;
        // Show toast for each newly arrived unread notification
        const newCount = count - prevCountRef.current;
        all.filter(n => !n.is_read).slice(0, newCount).forEach(toastForNotif);
      }

      prevCountRef.current = count;
    } catch {
      // silently ignore network errors during poll
    }
  }, []);

  useEffect(() => {
    // Global AOS init for all dashboard sub-pages
    AOS.init({ duration: 650, easing: "ease-out-cubic", once: true, offset: 30 });
  }, []);

  useEffect(() => {
    poll();
    const id = setInterval(poll, 10_000);
    return () => clearInterval(id);
  }, [poll]);

  return <>{children}</>;
}
