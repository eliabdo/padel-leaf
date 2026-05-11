"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const IDLE_TIMEOUT_MS  = 5 * 60 * 1000;  // 5 minutes → redirect
const TOUCH_INTERVAL_MS = 2 * 60 * 1000; // ping server every 2 min of activity

/**
 * Invisible component that lives inside the admin layout.
 * Tracks user activity (mouse, keyboard, touch, scroll).
 * - After 5 min of silence → redirect to /admin/login?timeout=1
 * - Every 2 min of activity → POST /api/admin/touch to extend the server session
 */
export function IdleGuard() {
  const router       = useRouter();
  const lastActivity = useRef<number>(0);
  const lastTouch    = useRef<number>(0);

  useEffect(() => {
    lastActivity.current = Date.now();
    lastTouch.current    = Date.now();

    function resetTimer() {
      lastActivity.current = Date.now();
    }

    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "click"];
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }));

    // Check idle every 10 seconds; ping server every 2 minutes
    const interval = setInterval(async () => {
      const now     = Date.now();
      const idle    = now - lastActivity.current;
      const sinceTouch = now - lastTouch.current;

      if (idle >= IDLE_TIMEOUT_MS) {
        clearInterval(interval);
        router.push("/admin/login?timeout=1");
        return;
      }

      // Ping the server to refresh session expiry while user is active
      if (sinceTouch >= TOUCH_INTERVAL_MS) {
        lastTouch.current = now;
        try {
          const res = await fetch("/api/admin/touch", { method: "POST" });
          if (res.status === 401) {
            // Server session already expired (e.g. server restart)
            router.push("/admin/login?timeout=1");
          }
        } catch {
          // Network error — let the idle timer handle it
        }
      }
    }, 10_000);

    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer));
      clearInterval(interval);
    };
  }, [router]);

  return null;
}
