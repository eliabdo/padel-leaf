"use client";

import { useRef, useState } from "react";

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  fontFamily: "system-ui, sans-serif", fontSize: 14, color: "#111827",
  background: "#fff", border: "1px solid rgba(22,163,74,0.22)",
  borderRadius: 9, padding: "10px 14px", outline: "none",
};
const labelStyle: React.CSSProperties = {
  display: "block", fontFamily: "system-ui, sans-serif", fontSize: 11,
  fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase",
  color: "#6b7280", marginBottom: 7,
};

// Venue opens 07:00 – 23:00
const OPEN  = "07:00";
const CLOSE = "23:00";

export default function BlockOutDateFields() {
  const [quickDate, setQuickDate] = useState("");
  const startsRef = useRef<HTMLInputElement>(null);
  const endsRef   = useRef<HTMLInputElement>(null);

  function fillFullDay() {
    if (!quickDate) return;
    if (startsRef.current) startsRef.current.value = `${quickDate}T${OPEN}`;
    if (endsRef.current)   endsRef.current.value   = `${quickDate}T${CLOSE}`;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Quick-fill row */}
      <div>
        <label style={labelStyle}>Quick fill — pick a date</label>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <input
            type="date"
            value={quickDate}
            onChange={e => setQuickDate(e.target.value)}
            style={{ ...inputStyle, width: "auto", flex: "1 1 160px", colorScheme: "light" }}
          />
          <button
            type="button"
            onClick={fillFullDay}
            disabled={!quickDate}
            style={{
              fontFamily: "system-ui, sans-serif", fontSize: 13, fontWeight: 600,
              color: quickDate ? "#15803d" : "#9ca3af",
              background: quickDate ? "rgba(22,163,74,0.09)" : "rgba(0,0,0,0.04)",
              border: `1px solid ${quickDate ? "rgba(22,163,74,0.30)" : "#e5e7eb"}`,
              borderRadius: 9, padding: "10px 18px", cursor: quickDate ? "pointer" : "not-allowed",
              whiteSpace: "nowrap", transition: "all 0.15s ease",
            }}
          >
            ☀︎ Full day (7 am – 11 pm)
          </button>
        </div>
        <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, color: "#9ca3af", marginTop: 6 }}>
          Select "All Courts" above to close the whole venue for the day.
        </div>
      </div>

      {/* Starts / ends inputs */}
      <div className="admin-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <label style={labelStyle}>Starts at</label>
          <input
            ref={startsRef}
            name="startsAt"
            type="datetime-local"
            required
            style={{ ...inputStyle, colorScheme: "light" }}
          />
        </div>
        <div>
          <label style={labelStyle}>Ends at</label>
          <input
            ref={endsRef}
            name="endsAt"
            type="datetime-local"
            required
            style={{ ...inputStyle, colorScheme: "light" }}
          />
        </div>
      </div>
    </div>
  );
}
