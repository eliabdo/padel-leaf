"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const NAV = [
  { href: "/admin",            label: "Today" },
  { href: "/admin/calendar",   label: "Calendar" },
  { href: "/admin/bookings",   label: "Bookings" },
  { href: "/admin/customers",  label: "Customers" },
  { href: "/admin/messages",   label: "Messages" },
  { href: "/admin/block-outs", label: "Block-outs" },
  { href: "/admin/revenue",    label: "Finance" },
  { href: "/admin/pricing",    label: "Pricing" },
];

interface Props {
  logoutForm: React.ReactNode;
  unreadCount?: number;
}

export default function AdminNav({ logoutForm, unreadCount = 0 }: Props) {
  const pathname   = usePathname();
  const [open, setOpen]         = useState(false);
  const [liveCount, setLiveCount] = useState(unreadCount);

  useEffect(() => {
    async function fetchCount() {
      try {
        const res = await fetch("/api/admin/unread-count", { cache: "no-store" });
        if (res.ok) { const d = await res.json(); setLiveCount(d.count ?? 0); }
      } catch {}
    }
    fetchCount();
    const id = setInterval(fetchCount, 5_000);
    return () => clearInterval(id);
  }, []);

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  return (
    <>
      <header style={{
        background: "rgba(255,255,255,0.96)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(22,163,74,0.10)",
        boxShadow: "0 1px 0 rgba(22,163,74,0.06), 0 2px 12px rgba(0,0,0,0.04)",
        flexShrink: 0,
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <div style={{
          maxWidth: 1360, margin: "0 auto", padding: "0 20px",
          height: 58, display: "flex", alignItems: "center",
          justifyContent: "space-between", gap: 12,
        }}>

          {/* Brand */}
          <Link href="/admin" onClick={() => setOpen(false)}
            style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", flexShrink: 0 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: "linear-gradient(135deg, #16a34a 0%, #4ade80 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 8px rgba(22,163,74,0.38)",
            }}>
              <span style={{ fontFamily: "Georgia, serif", fontSize: 13, fontWeight: 800, color: "#fff", letterSpacing: "-0.5px" }}>PL</span>
            </div>
            <div>
              <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, fontWeight: 700, color: "#0d2010", letterSpacing: "-0.01em" }}>
                Padel Leaf
              </span>
              <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, fontWeight: 500, color: "#86efac", marginLeft: 6, letterSpacing: "0.04em" }}>
                ADMIN
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="admin-desktop-nav" style={{ display: "flex", gap: 1, flexWrap: "nowrap" }}>
            {NAV.map(({ href, label }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`admin-nav-link${active ? " active" : ""}`}
                  style={{
                    fontFamily: "system-ui, sans-serif",
                    fontSize: 13,
                    fontWeight: active ? 700 : 500,
                    color: active ? "#15803d" : "#4b5563",
                    textDecoration: "none",
                    padding: "6px 13px",
                    borderRadius: 8,
                    display: "inline-flex", alignItems: "center", gap: 5,
                    background: active ? "rgba(22,163,74,0.10)" : "transparent",
                    whiteSpace: "nowrap",
                  }}
                >
                  {label}
                  {href === "/admin/messages" && liveCount > 0 && (
                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#dc2626", color: "#fff", fontSize: 10, fontWeight: 700, minWidth: 16, height: 16, borderRadius: 999, padding: "0 3px" }}>
                      {liveCount > 99 ? "99+" : liveCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <div className="admin-desktop-only">{logoutForm}</div>

            {/* Hamburger */}
            <button
              className="admin-mobile-only"
              onClick={() => setOpen(o => !o)}
              aria-label={open ? "Close menu" : "Open menu"}
              style={{
                background: "none", border: "1px solid #e5e7eb",
                borderRadius: 8, padding: "7px 9px", cursor: "pointer", lineHeight: 0,
                transition: "border-color 0.15s, background 0.15s",
              }}
            >
              {open ? (
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                  <path d="M4 4L16 16M16 4L4 16" stroke="#374151" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                  <path d="M3 5h14M3 10h14M3 15h14" stroke="#374151" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div style={{
          background: "rgba(255,255,255,0.98)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(22,163,74,0.10)",
          boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
          flexShrink: 0,
          position: "sticky", top: 58, zIndex: 49,
        }}>
          <div style={{ padding: "8px 16px 16px", display: "flex", flexDirection: "column", gap: 2 }}>
            {NAV.map(({ href, label }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="admin-nav-link"
                  style={{
                    fontFamily: "system-ui, sans-serif", fontSize: 15,
                    fontWeight: active ? 700 : 500,
                    color: active ? "#15803d" : "#374151",
                    textDecoration: "none",
                    padding: "12px 14px", borderRadius: 10, display: "block",
                    background: active ? "rgba(22,163,74,0.08)" : "transparent",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {label}
                    {href === "/admin/messages" && liveCount > 0 && (
                      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#dc2626", color: "#fff", fontSize: 10, fontWeight: 700, minWidth: 16, height: 16, borderRadius: 999, padding: "0 3px" }}>
                        {liveCount > 99 ? "99+" : liveCount}
                      </span>
                    )}
                  </span>
                </Link>
              );
            })}
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(22,163,74,0.10)" }}>
              {logoutForm}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
