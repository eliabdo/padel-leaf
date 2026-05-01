"use client";

import Link from "next/link";
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
  const [open, setOpen] = useState(false);
  const [liveCount, setLiveCount] = useState(unreadCount);

  useEffect(() => {
    // Fetch immediately then poll every 30 s
    async function fetchCount() {
      try {
        const res = await fetch("/api/admin/unread-count", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setLiveCount(data.count ?? 0);
        }
      } catch {}
    }
    fetchCount();
    const id = setInterval(fetchCount, 5_000);
    return () => clearInterval(id);
  }, []);

  const linkBase: React.CSSProperties = {
    fontFamily: "system-ui, sans-serif",
    fontSize: 13,
    fontWeight: 500,
    color: "#374151",
    textDecoration: "none",
    padding: "6px 12px",
    borderRadius: 8,
    transition: "all 0.15s ease",
    whiteSpace: "nowrap",
  };

  return (
    <>
      <header style={{
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(22,163,74,0.12)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)",
        flexShrink: 0,
      }}>
        <div style={{
          maxWidth: 1360, margin: "0 auto", padding: "0 20px",
          height: 58, display: "flex", alignItems: "center",
          justifyContent: "space-between", gap: 12,
        }}>
          {/* Brand */}
          <Link
            href="/admin"
            onClick={() => setOpen(false)}
            style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", flexShrink: 0 }}
          >
            <div style={{
              width: 28, height: 28, borderRadius: 7,
              background: "linear-gradient(135deg, #16a34a, #4ade80)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 8px rgba(22,163,74,0.35)",
            }}>
              <span style={{ fontFamily: "serif", fontSize: 14, fontWeight: 800, color: "#fff", lineHeight: 1 }}>PL</span>
            </div>
            <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, fontWeight: 700, color: "#14532d", letterSpacing: "0.01em" }}>
              Padel Leaf <span style={{ color: "#86efac", fontWeight: 400 }}>/ Admin</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="admin-desktop-nav" style={{ display: "flex", gap: 2, flexWrap: "nowrap" }}>
            {NAV.map(({ href, label }) => (
              <Link key={href} href={href} style={{ ...linkBase, display: "flex", alignItems: "center", gap: 4 }} className="admin-nav-link">
                {label}
                {href === "/admin/messages" && liveCount > 0 && (
                  <span style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", background:"#dc2626", color:"#fff", fontSize:10, fontWeight:700, minWidth:16, height:16, borderRadius:999, padding:"0 3px" }}>
                    {liveCount > 99 ? "99+" : liveCount}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {/* Sign out – desktop only */}
            <div className="admin-desktop-only">{logoutForm}</div>

            {/* Hamburger – mobile only */}
            <button
              className="admin-mobile-only"
              onClick={() => setOpen(o => !o)}
              aria-label={open ? "Close menu" : "Open menu"}
              style={{
                background: "none",
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                padding: "7px 9px",
                cursor: "pointer",
                lineHeight: 0,
              }}
            >
              {open ? (
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                  <path d="M4 4L16 16M16 4L4 16" stroke="#374151" strokeWidth="2" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                  <path d="M3 5h14M3 10h14M3 15h14" stroke="#374151" strokeWidth="2" strokeLinecap="round" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer – only in DOM when open */}
      {open && (
        <div style={{
          background: "rgba(255,255,255,0.98)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(22,163,74,0.12)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
          flexShrink: 0,
        }}>
          <div style={{ padding: "8px 16px 16px", display: "flex", flexDirection: "column", gap: 2 }}>
            {NAV.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                style={{
                  fontFamily: "system-ui, sans-serif",
                  fontSize: 15,
                  fontWeight: 500,
                  color: "#374151",
                  textDecoration: "none",
                  padding: "12px 14px",
                  borderRadius: 10,
                  display: "block",
                  transition: "background 0.1s",
                }}
                className="admin-nav-link"
              >
                <span style={{ display:"flex", alignItems:"center", gap:6 }}>
                  {label}
                  {href === "/admin/messages" && liveCount > 0 && (
                    <span style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", background:"#dc2626", color:"#fff", fontSize:10, fontWeight:700, minWidth:16, height:16, borderRadius:999, padding:"0 3px" }}>
                      {liveCount > 99 ? "99+" : liveCount}
                    </span>
                  )}
                </span>
              </Link>
            ))}
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(22,163,74,0.10)" }}>
              {logoutForm}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
