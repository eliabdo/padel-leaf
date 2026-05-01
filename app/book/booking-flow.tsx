"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ALLOWED_DURATIONS,
  type Duration,
  formatDateShort,
  formatTime,
  next14Days,
  dateOnlyKey,
  parseDateKey,
} from "@/lib/booking";
import { formatUsd, priceForDuration } from "@/lib/pricing";

type Court = {
  id: number;
  name: string;
  surface: string;
};

type AvailabilityResp = {
  courts: {
    id: number;
    name: string;
    slots: { startIso: string; available: boolean; blocked?: boolean }[];
    allBlocked: boolean;
    blockOutReasons: string[];
  }[];
};

export function BookingFlow({
  courts,
  hourlyRateCents,
  blockedDates = [],
}: {
  courts: Court[];
  hourlyRateCents: number;
  blockedDates?: string[];
}) {
  const router = useRouter();
  const dates = useMemo(() => next14Days(), []);
  const [selectedDate, setSelectedDate] = useState<Date>(dates[0]);
  const [duration, setDuration] = useState<Duration>(90);
  const [courtId, setCourtId] = useState<number>(courts[0]?.id ?? 0);
  const [availability, setAvailability] = useState<AvailabilityResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSlotIso, setSelectedSlotIso] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"venue" | "whish" | "omt">("venue");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalCents = priceForDuration(hourlyRateCents, duration);

  useEffect(() => {
    const url = `/api/availability?date=${dateOnlyKey(selectedDate)}&duration=${duration}`;
    setLoading(true);
    setSelectedSlotIso(null);
    fetch(url)
      .then((r) => r.json())
      .then((data: AvailabilityResp) => setAvailability(data))
      .catch(() => setAvailability(null))
      .finally(() => setLoading(false));
  }, [selectedDate, duration]);

  const courtAvail = availability?.courts.find((c) => c.id === courtId);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedSlotIso) return;
    setSubmitting(true);
    setError(null);

    const f = new FormData(e.currentTarget);
    const body = {
      courtId,
      startsAtIso: selectedSlotIso,
      durationMinutes: duration,
      customerName:    String(f.get("name")  ?? ""),
      customerEmail:   String(f.get("email") ?? ""),
      customerPhone:   String(f.get("phone") ?? ""),
      paymentMethod,
    };

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Booking failed");
      router.push(`/book/confirmation/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* DATE STRIP */}
      <div>
        <Label>Date</Label>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6">
          {dates.map((d) => {
            const isSelected = dateOnlyKey(d) === dateOnlyKey(selectedDate);
            const isDateBlocked = blockedDates.includes(dateOnlyKey(d));
            return (
              <button
                key={d.toISOString()}
                onClick={() => { if (!isDateBlocked) setSelectedDate(parseDateKey(dateOnlyKey(d))); }}
                disabled={isDateBlocked}
                title={isDateBlocked ? "All courts unavailable" : undefined}
                className={`shrink-0 px-4 py-3 rounded-xl border text-sm transition ${
                  isDateBlocked
                    ? "bg-cream/50 text-charcoal/30 border-forest/10 cursor-not-allowed line-through"
                    : isSelected
                      ? "bg-forest text-cream border-forest"
                      : "bg-cream text-charcoal border-forest/15 hover:border-forest/40"
                }`}
              >
                <div className="font-medium">{formatDateShort(d)}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* DURATION */}
      <div>
        <Label>Duration</Label>
        <div className="flex gap-2 flex-wrap">
          {ALLOWED_DURATIONS.map((m) => (
            <button
              key={m}
              onClick={() => setDuration(m as Duration)}
              className={`px-5 py-3 rounded-xl border text-sm transition ${
                duration === m
                  ? "bg-forest text-cream border-forest"
                  : "bg-cream text-charcoal border-forest/15 hover:border-forest/40"
              }`}
            >
              {m} min
            </button>
          ))}
        </div>
      </div>

      {/* COURT */}
      <div>
        <Label>Court</Label>
        <div className="flex gap-2 flex-wrap">
          {courts.map((c) => {
            const courtData = availability?.courts.find(ct => ct.id === c.id);
            const blocked   = courtData?.allBlocked ?? false;
            return (
              <button
                key={c.id}
                onClick={() => { if (!blocked) { setCourtId(c.id); setSelectedSlotIso(null); } }}
                disabled={blocked}
                className={`px-5 py-3 rounded-xl border text-sm transition ${
                  blocked
                    ? "bg-cream/50 text-charcoal/40 border-forest/10 cursor-not-allowed line-through"
                    : courtId === c.id
                      ? "bg-forest text-cream border-forest"
                      : "bg-cream text-charcoal border-forest/15 hover:border-forest/40"
                }`}
              >
                Court · {c.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* TIME SLOTS */}
      <div>
        <Label>Time</Label>
        {loading ? (
          <div className="text-char-soft text-sm">Loading availability…</div>
        ) : !courtAvail ? (
          <div className="text-char-soft text-sm">No courts found.</div>
        ) : courtAvail.allBlocked ? (
          <div className="rounded-xl border border-clay/30 bg-clay/5 px-5 py-4 flex items-start gap-3">
            <span className="text-lg leading-none mt-0.5">🚫</span>
            <div>
              <div className="font-semibold text-clay text-sm">Court unavailable</div>
              <div className="text-char-soft text-sm mt-1">
                {courtAvail.blockOutReasons.length > 0
                  ? courtAvail.blockOutReasons.join(" · ")
                  : "This court is blocked for the full day."}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-2">
            {courtAvail.slots.map((s) => {
              const isSelected = s.startIso === selectedSlotIso;
              const baseClass =
                "px-3 py-3 rounded-lg border text-sm text-center transition";
              if (!s.available) {
                return (
                  <div
                    key={s.startIso}
                    className={`${baseClass} text-char-soft/50 line-through border-forest/10 cursor-not-allowed bg-cream/40`}
                  >
                    {formatTime(new Date(s.startIso))}
                  </div>
                );
              }
              return (
                <button
                  key={s.startIso}
                  onClick={() => setSelectedSlotIso(s.startIso)}
                  className={`${baseClass} ${
                    isSelected
                      ? "bg-forest text-cream border-forest"
                      : "bg-cream border-forest/30 hover:border-forest"
                  }`}
                >
                  {formatTime(new Date(s.startIso))}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* TOTAL + CONFIRM — only shown after a slot is picked */}
      {selectedSlotIso && (
        <div className="bg-sage-soft rounded-2xl p-5 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-forest font-semibold mb-1">
                Total
              </div>
              <div className="font-serif text-3xl sm:text-4xl text-forest-deep">
                {formatUsd(totalCents)}
              </div>
              <div className="text-sm text-char-soft mt-1">
                {duration} min · pay at the venue
              </div>
            </div>
          </div>

          {/* PAYMENT METHOD */}
          <div className="mb-6">
            <div className="text-xs uppercase tracking-[0.18em] text-forest font-semibold mb-3">
              Payment Method
            </div>
            <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-3">
              {/* Pay at Venue */}
              <button
                type="button"
                onClick={() => setPaymentMethod("venue")}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition w-full sm:w-auto ${
                  paymentMethod === "venue"
                    ? "bg-forest text-cream border-forest shadow-sm"
                    : "bg-cream text-charcoal border-forest/15 hover:border-forest/40"
                }`}
              >
                <span>💵</span>
                <span>Pay at Venue</span>
              </button>

              {/* Whish */}
              <button
                type="button"
                onClick={() => setPaymentMethod("whish")}
                className={`flex items-center justify-center px-5 py-3 rounded-xl border transition w-full sm:w-auto ${
                  paymentMethod === "whish"
                    ? "bg-[#e8192c] border-[#e8192c] shadow-sm"
                    : "bg-cream border-forest/15 hover:border-[#e8192c]/40"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/whish-logo.svg" alt="Whish" className="h-5 w-auto" />
              </button>

              {/* OMT Pay */}
              <button
                type="button"
                onClick={() => setPaymentMethod("omt")}
                className={`flex items-center justify-center px-5 py-3 rounded-xl border transition w-full sm:w-auto ${
                  paymentMethod === "omt"
                    ? "bg-[#fede00] border-[#fede00] shadow-sm ring-1 ring-[#fede00]/60"
                    : "bg-cream border-forest/15 hover:border-[#fede00]/60"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/omt-logo.svg" alt="OMT Pay" className="h-5 w-auto" />
              </button>
            </div>

            {paymentMethod === "whish" && (
              <p className="mt-3 text-xs text-[#b91c1c] bg-[#fff5f5] border border-[#e8192c]/20 rounded-xl px-4 py-3 leading-relaxed">
                You will receive Whish payment instructions by email after booking.
              </p>
            )}
            {paymentMethod === "omt" && (
              <p className="mt-3 text-xs text-[#92650a] bg-[#fffbeb] border border-[#fede00]/50 rounded-xl px-4 py-3 leading-relaxed">
                You will receive OMT Pay instructions by email after booking.
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field name="name"  label="Name"  type="text"  required />
              <Field name="phone" label="Phone" type="tel"   required />
            </div>
            <Field name="email" label="Email" type="email" required />
            {error && <div className="text-sm text-clay">{error}</div>}
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary w-full justify-center disabled:opacity-50 py-4 text-base"
            >
              {submitting ? "Confirming…" : "Confirm reservation →"}
            </button>
            <p className="text-xs text-char-soft text-center">
              By confirming, you agree to the cancellation policy: full refund
              up to 24h before, full fee owed for same-day cancellations.
            </p>
          </form>
        </div>
      )}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs uppercase tracking-[0.18em] text-forest font-semibold mb-3">
      {children}
    </div>
  );
}

function Field({
  name, label, type, required,
}: { name: string; label: string; type: string; required?: boolean }) {
  return (
    <div>
      <label htmlFor={name} className="block text-xs uppercase tracking-[0.18em] text-forest font-semibold mb-2">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        className="w-full px-4 py-3 rounded-lg border border-forest/20 bg-cream focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest"
      />
    </div>
  );
}
