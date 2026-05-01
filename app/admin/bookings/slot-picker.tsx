"use client";

import { useEffect, useRef, useState } from "react";

const OPEN  = 7;   // 07:00
const CLOSE = 23;  // 23:00
const STEP  = 30;  // minutes

function pad(n: number) { return String(n).padStart(2, "0"); }

// Generate every 30-min label from 07:00 to 22:30
const TIME_OPTIONS: string[] = [];
for (let h = OPEN; h < CLOSE; h++) {
  for (let m = 0; m < 60; m += STEP) {
    TIME_OPTIONS.push(`${pad(h)}:${pad(m)}`);
  }
}

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  fontFamily: "system-ui, sans-serif", fontSize: 14, color: "#111827",
  background: "#fff", border: "1px solid rgba(22,163,74,0.22)",
  borderRadius: 9, padding: "11px 14px", outline: "none",
  colorScheme: "light",
};

/** Parses a datetime-local string (YYYY-MM-DDTHH:MM) into { date, time } */
function splitDT(val: string): { date: string; time: string } {
  if (!val) return { date: "", time: TIME_OPTIONS[0] };
  const [date, timeFull = ""] = val.split("T");
  const time = timeFull.slice(0, 5);
  // Round to nearest 30-min slot
  const rounded = TIME_OPTIONS.find(t => t >= time) ?? TIME_OPTIONS[TIME_OPTIONS.length - 1];
  return { date, time: rounded };
}

export default function SlotPicker({
  name,
  defaultValue = "",
  hasError = false,
}: {
  name: string;
  defaultValue?: string;
  hasError?: boolean;
}) {
  const init = splitDT(defaultValue);
  const [date, setDate] = useState(init.date);
  const [time, setTime] = useState(init.time);
  const hiddenRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (hiddenRef.current) {
      hiddenRef.current.value = date && time ? `${date}T${time}` : "";
    }
  }, [date, time]);

  const errBorder = hasError ? "rgba(220,38,38,0.40)" : "rgba(22,163,74,0.22)";

  return (
    <div style={{ display: "flex", gap: 10 }}>
      <input type="hidden" name={name} ref={hiddenRef} defaultValue={date && time ? `${date}T${time}` : ""} />
      <input
        type="date"
        value={date}
        onChange={e => setDate(e.target.value)}
        required
        style={{ ...inputStyle, flex: "1 1 140px", borderColor: errBorder }}
      />
      <select
        value={time}
        onChange={e => setTime(e.target.value)}
        required
        style={{ ...inputStyle, flex: "0 0 110px", cursor: "pointer", borderColor: errBorder }}
      >
        {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
      </select>
    </div>
  );
}
