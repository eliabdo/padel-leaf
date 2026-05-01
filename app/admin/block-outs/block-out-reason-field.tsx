"use client";

import { useState } from "react";

const PRESET_REASONS = [
  "Maintenance",
  "Rain",
  "Tournament",
  "Private event",
  "Staff training",
  "Other",
];

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

export default function BlockOutReasonField() {
  const [selected, setSelected] = useState(PRESET_REASONS[0]);
  const [custom, setCustom]     = useState("");

  const value = selected === "Other" ? custom : selected;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Hidden input — the only field with name="reason" so the server reads it */}
      <input type="hidden" name="reason" value={value} />

      <div>
        <label style={labelStyle}>Reason</label>
        <select
          value={selected}
          onChange={e => setSelected(e.target.value)}
          style={{ ...inputStyle, cursor: "pointer" }}
        >
          {PRESET_REASONS.map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {selected === "Other" && (
        <div>
          <label style={labelStyle}>Describe the reason</label>
          <input
            type="text"
            placeholder="e.g. Court resurfacing, VIP event…"
            value={custom}
            onChange={e => setCustom(e.target.value)}
            style={inputStyle}
            autoFocus
          />
        </div>
      )}
    </div>
  );
}
