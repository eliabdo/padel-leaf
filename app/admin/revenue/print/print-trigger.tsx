"use client";

import { useEffect } from "react";

export function PrintTrigger() {
  useEffect(() => {
    // Remove focus from opener so the popup gets full print control
    window.opener?.blur?.();
    window.focus();
    const t = setTimeout(() => {
      window.print();
    }, 700);
    return () => clearTimeout(t);
  }, []);

  return (
    <button
      className="no-print"
      onClick={() => window.close()}
      style={{
        position: "fixed", top: 20, right: 20,
        background: "#16a34a", color: "#fff",
        border: "none", borderRadius: 8,
        padding: "9px 16px", fontSize: 13, fontWeight: 600,
        cursor: "pointer", fontFamily: "system-ui, sans-serif",
        boxShadow: "0 2px 8px rgba(22,163,74,0.3)",
        zIndex: 999,
      }}
    >
      ✕ Close
    </button>
  );
}
