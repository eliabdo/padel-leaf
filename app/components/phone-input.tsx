"use client";

import { useState, useId } from "react";

// ── Country list ─────────────────────────────────────────────────────────────
// Lebanon is first (default). Grouped: Levant / Gulf / Europe / Rest.
export const COUNTRIES = [
  // Levant / MENA
  { code: "LB", flag: "🇱🇧", name: "Lebanon",      dial: "+961" },
  { code: "SY", flag: "🇸🇾", name: "Syria",         dial: "+963" },
  { code: "JO", flag: "🇯🇴", name: "Jordan",        dial: "+962" },
  { code: "IQ", flag: "🇮🇶", name: "Iraq",          dial: "+964" },
  { code: "EG", flag: "🇪🇬", name: "Egypt",         dial: "+20"  },
  { code: "TR", flag: "🇹🇷", name: "Turkey",        dial: "+90"  },
  // Gulf
  { code: "AE", flag: "🇦🇪", name: "UAE",           dial: "+971" },
  { code: "SA", flag: "🇸🇦", name: "Saudi Arabia",  dial: "+966" },
  { code: "QA", flag: "🇶🇦", name: "Qatar",         dial: "+974" },
  { code: "KW", flag: "🇰🇼", name: "Kuwait",        dial: "+965" },
  { code: "BH", flag: "🇧🇭", name: "Bahrain",       dial: "+973" },
  { code: "OM", flag: "🇴🇲", name: "Oman",          dial: "+968" },
  // Europe
  { code: "FR", flag: "🇫🇷", name: "France",        dial: "+33"  },
  { code: "DE", flag: "🇩🇪", name: "Germany",       dial: "+49"  },
  { code: "GB", flag: "🇬🇧", name: "United Kingdom",dial: "+44"  },
  { code: "IT", flag: "🇮🇹", name: "Italy",         dial: "+39"  },
  { code: "ES", flag: "🇪🇸", name: "Spain",         dial: "+34"  },
  { code: "NL", flag: "🇳🇱", name: "Netherlands",   dial: "+31"  },
  { code: "BE", flag: "🇧🇪", name: "Belgium",       dial: "+32"  },
  { code: "CH", flag: "🇨🇭", name: "Switzerland",   dial: "+41"  },
  { code: "SE", flag: "🇸🇪", name: "Sweden",        dial: "+46"  },
  { code: "NO", flag: "🇳🇴", name: "Norway",        dial: "+47"  },
  { code: "DK", flag: "🇩🇰", name: "Denmark",       dial: "+45"  },
  { code: "PT", flag: "🇵🇹", name: "Portugal",      dial: "+351" },
  { code: "GR", flag: "🇬🇷", name: "Greece",        dial: "+30"  },
  { code: "CY", flag: "🇨🇾", name: "Cyprus",        dial: "+357" },
  { code: "AT", flag: "🇦🇹", name: "Austria",       dial: "+43"  },
  { code: "PL", flag: "🇵🇱", name: "Poland",        dial: "+48"  },
  // Americas / Oceania
  { code: "US", flag: "🇺🇸", name: "United States", dial: "+1"   },
  { code: "CA", flag: "🇨🇦", name: "Canada",        dial: "+1"   },
  { code: "AU", flag: "🇦🇺", name: "Australia",     dial: "+61"  },
  { code: "BR", flag: "🇧🇷", name: "Brazil",        dial: "+55"  },
  { code: "MX", flag: "🇲🇽", name: "Mexico",        dial: "+52"  },
] as const;

// ── Parse a stored value like "+961 71234567" into { dial, number } ──────────
function parseDefault(value: string): { dial: string; number: string } {
  if (!value) return { dial: "+961", number: "" };
  // Match longest code first to avoid "+1" eating "+961"
  const sorted = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);
  for (const c of sorted) {
    const prefix = c.dial + " ";
    if (value.startsWith(prefix)) return { dial: c.dial, number: value.slice(prefix.length) };
    if (value.startsWith(c.dial))  return { dial: c.dial, number: value.slice(c.dial.length).trim() };
  }
  return { dial: "+961", number: value };
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface PhoneInputProps {
  name: string;
  defaultValue?: string;
  required?: boolean;
  /** "admin" (inline-styled cards) | "booking" (Tailwind public form) */
  variant?: "admin" | "booking";
}

// ── Component ─────────────────────────────────────────────────────────────────
export function PhoneInput({
  name,
  defaultValue = "",
  required,
  variant = "admin",
}: PhoneInputProps) {
  const uid = useId();
  const parsed = parseDefault(defaultValue);
  const [dialCode, setDialCode] = useState(parsed.dial);
  const [number,   setNumber]   = useState(parsed.number);

  const combined = number.trim() ? `${dialCode} ${number.trim()}` : "";

  // ── Admin styles ────────────────────────────────────────────────────────────
  if (variant === "admin") {
    return (
      <div style={{ display: "flex", width: "100%", borderRadius: 9, overflow: "hidden", border: "1px solid rgba(22,163,74,0.22)", background: "#fff" }}>
        {/* Hidden input that gets submitted */}
        <input type="hidden" name={name} value={combined} />

        {/* Country selector */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <select
            value={dialCode}
            onChange={e => setDialCode(e.target.value)}
            aria-label="Country code"
            style={{
              appearance: "none", WebkitAppearance: "none",
              border: "none", outline: "none",
              background: "rgba(22,163,74,0.05)",
              borderRight: "1px solid rgba(22,163,74,0.15)",
              fontFamily: "system-ui, sans-serif", fontSize: 13, fontWeight: 600,
              color: "#111827", cursor: "pointer",
              padding: "11px 32px 11px 12px",
              height: "100%",
            }}
          >
            {COUNTRIES.map(c => (
              <option key={c.code + c.dial} value={c.dial}>
                {c.flag}  {c.name} ({c.dial})
              </option>
            ))}
          </select>
          {/* Chevron */}
          <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", fontSize: 10, color: "#6b7280" }}>▾</span>
        </div>

        {/* Number input */}
        <input
          id={uid}
          type="tel"
          value={number}
          onChange={e => setNumber(e.target.value)}
          required={required}
          placeholder="71 234 567"
          style={{
            flex: 1, border: "none", outline: "none",
            fontFamily: "system-ui, sans-serif", fontSize: 14, color: "#111827",
            background: "#fff", padding: "11px 14px",
            minWidth: 0,
          }}
        />
      </div>
    );
  }

  // ── Booking (public) styles ─────────────────────────────────────────────────
  return (
    <div className="flex w-full rounded-lg border border-forest/20 overflow-hidden bg-cream focus-within:border-forest focus-within:ring-1 focus-within:ring-forest">
      {/* Hidden input that gets submitted */}
      <input type="hidden" name={name} value={combined} />

      {/* Country selector */}
      <div className="relative flex-shrink-0">
        <select
          value={dialCode}
          onChange={e => setDialCode(e.target.value)}
          aria-label="Country code"
          className="appearance-none border-none outline-none bg-forest/5 border-r border-forest/15 text-forest font-semibold text-sm cursor-pointer pl-3 pr-7 py-3 h-full"
        >
          {COUNTRIES.map(c => (
            <option key={c.code + c.dial} value={c.dial}>
              {c.flag}  {c.name} ({c.dial})
            </option>
          ))}
        </select>
        <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-forest/50 text-xs">▾</span>
      </div>

      {/* Number input */}
      <input
        id={uid}
        type="tel"
        value={number}
        onChange={e => setNumber(e.target.value)}
        required={required}
        placeholder="71 234 567"
        className="flex-1 border-none outline-none bg-transparent px-4 py-3 text-sm text-charcoal min-w-0"
      />
    </div>
  );
}
