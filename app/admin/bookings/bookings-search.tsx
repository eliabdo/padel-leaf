"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function BookingsSearch({ status }: { status: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [value, setValue] = useState(sp.get("q") ?? "");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const params = new URLSearchParams();
      if (status && status !== "all") params.set("status", status);
      if (value.trim()) params.set("q", value.trim());
      router.push(`/admin/bookings${params.toString() ? "?" + params.toString() : ""}`);
    }, 280);
    return () => { if (timer.current) clearTimeout(timer.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div style={{ position: "relative", width: 240 }}>
      <svg
        style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
        width="15" height="15" viewBox="0 0 24 24" fill="none"
        stroke="#9ca3af" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="Search by name…"
        style={{
          width: "100%", boxSizing: "border-box",
          fontFamily: "system-ui, sans-serif", fontSize: 13,
          color: "#111827", background: "#fff",
          border: "1px solid rgba(22,163,74,0.22)",
          borderRadius: 9, padding: "9px 14px 9px 34px",
          outline: "none", boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
        onFocus={e => (e.target.style.borderColor = "#16a34a")}
        onBlur={e  => (e.target.style.borderColor = "rgba(22,163,74,0.22)")}
      />
      {value && (
        <button
          onClick={() => setValue("")}
          style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
            background: "none", border: "none", cursor: "pointer", color: "#9ca3af",
            fontFamily: "system-ui, sans-serif", fontSize: 15, lineHeight: 1, padding: 0 }}
          aria-label="Clear"
        >×</button>
      )}
    </div>
  );
}
