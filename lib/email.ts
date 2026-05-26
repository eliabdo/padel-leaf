// Outbound email — booking confirmations via Resend.
//
// Configuration via env vars (added to .env.local + Vercel):
//   RESEND_API_KEY        - re_xxx... from https://resend.com/api-keys
//   BOOKING_EMAIL_FROM    - "Padel Leaf <bookings@padelleafclub.com>"
//   BOOKING_EMAIL_BCC     - optional, BCC every confirmation here (Eli's inbox)
//
// If RESEND_API_KEY is unset, sends are skipped silently (lets dev/preview
// work without configuring email). The booking itself never fails because
// of an email error.

import { formatUsd, formatLbp } from "@/lib/pricing";

export type BookingEmailPayload = {
  bookingId: number;
  customerName: string;
  customerEmail: string;
  courtName: string;
  startsAt: Date;
  endsAt: Date;
  durationMinutes: number;
  totalCents: number;
  paymentMethod: "venue" | "whish" | "omt";
};

const TZ = "Asia/Beirut";

function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
    timeZone: TZ,
  });
}
function fmtTime(d: Date): string {
  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit", minute: "2-digit", timeZone: TZ,
  });
}

const PAY_LABEL: Record<BookingEmailPayload["paymentMethod"], string> = {
  venue: "Pay at the venue",
  whish: "Whish",
  omt:   "OMT",
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildHtml(p: BookingEmailPayload): string {
  const dateStr = fmtDate(p.startsAt);
  const timeStr = `${fmtTime(p.startsAt)} — ${fmtTime(p.endsAt)}`;
  const total = formatUsd(p.totalCents);
  const totalLbp = formatLbp(p.totalCents);
  const name = escapeHtml(p.customerName);
  const court = escapeHtml(p.courtName);

  return `<!DOCTYPE html><html><body style="margin:0;background:#f4f7f5;font-family:system-ui,-apple-system,Segoe UI,sans-serif;color:#0d2010;">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
    <div style="background:#0d2010;color:#fff;padding:28px 28px 22px;border-radius:14px 14px 0 0;">
      <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#86efac;margin-bottom:8px;">Padel Leaf Club</div>
      <h1 style="margin:0;font-family:Georgia,serif;font-size:24px;font-weight:600;letter-spacing:-0.01em;">Booking confirmed</h1>
      <div style="font-size:14px;color:rgba(255,255,255,0.78);margin-top:6px;">Booking #${p.bookingId}</div>
    </div>

    <div style="background:#fff;padding:28px;border:1px solid rgba(22,163,74,0.10);border-top:none;border-radius:0 0 14px 14px;">
      <p style="margin:0 0 18px;font-size:15px;line-height:1.55;">
        Hi ${name},<br/>
        Your court is booked. Here are the details:
      </p>

      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:9px 0;color:#6b7280;width:130px;">Court</td>
            <td style="padding:9px 0;font-weight:600;">${court}</td></tr>
        <tr><td style="padding:9px 0;color:#6b7280;border-top:1px solid rgba(22,163,74,0.08);">Date</td>
            <td style="padding:9px 0;font-weight:600;border-top:1px solid rgba(22,163,74,0.08);">${dateStr}</td></tr>
        <tr><td style="padding:9px 0;color:#6b7280;border-top:1px solid rgba(22,163,74,0.08);">Time</td>
            <td style="padding:9px 0;font-weight:600;border-top:1px solid rgba(22,163,74,0.08);font-family:ui-monospace,monospace;">${timeStr}</td></tr>
        <tr><td style="padding:9px 0;color:#6b7280;border-top:1px solid rgba(22,163,74,0.08);">Duration</td>
            <td style="padding:9px 0;font-weight:600;border-top:1px solid rgba(22,163,74,0.08);">${p.durationMinutes} min</td></tr>
        <tr><td style="padding:9px 0;color:#6b7280;border-top:1px solid rgba(22,163,74,0.08);">Total</td>
            <td style="padding:9px 0;font-weight:700;border-top:1px solid rgba(22,163,74,0.08);">
              ${total}
              <span style="font-weight:500;color:#16a34a;margin-left:8px;font-size:13px;">${totalLbp}</span>
            </td></tr>
        <tr><td style="padding:9px 0;color:#6b7280;border-top:1px solid rgba(22,163,74,0.08);">Payment</td>
            <td style="padding:9px 0;font-weight:600;border-top:1px solid rgba(22,163,74,0.08);">${PAY_LABEL[p.paymentMethod]}</td></tr>
      </table>

      <div style="margin-top:24px;padding:14px 16px;background:#fafdfb;border:1px solid rgba(22,163,74,0.10);border-radius:10px;font-size:13px;line-height:1.55;color:#374151;">
        <strong style="color:#0d2010;">Cancellation policy.</strong>
        Free cancellation up to 24 hours before. Same-day cancellations and
        no-shows are charged the full fee.
      </div>

      <p style="margin:24px 0 4px;font-size:14px;line-height:1.55;color:#374151;">
        See you on court.<br/>
        <strong style="color:#0d2010;">Padel Leaf Club</strong><br/>
        Mezher, Bsalim, Mount Lebanon
      </p>
    </div>

    <div style="text-align:center;font-size:11px;color:#9ca3af;margin-top:18px;">
      You received this email because you booked a court at Padel Leaf Club.
    </div>
  </div>
</body></html>`;
}

function buildText(p: BookingEmailPayload): string {
  const dateStr = fmtDate(p.startsAt);
  const timeStr = `${fmtTime(p.startsAt)} - ${fmtTime(p.endsAt)}`;
  return [
    `PADEL LEAF CLUB - Booking confirmed (#${p.bookingId})`,
    ``,
    `Hi ${p.customerName},`,
    `Your court is booked. Details:`,
    ``,
    `  Court:    ${p.courtName}`,
    `  Date:     ${dateStr}`,
    `  Time:     ${timeStr}`,
    `  Duration: ${p.durationMinutes} min`,
    `  Total:    ${formatUsd(p.totalCents)}  /  ${formatLbp(p.totalCents)}`,
    `  Payment:  ${PAY_LABEL[p.paymentMethod]}`,
    ``,
    `Cancellation policy: free cancellation up to 24 hours before.`,
    `Same-day cancellations and no-shows are charged the full fee.`,
    ``,
    `See you on court.`,
    `Padel Leaf Club, Mezher, Bsalim, Mount Lebanon`,
  ].join("\n");
}

/**
 * Send a booking confirmation email. Never throws - on failure the booking
 * still succeeds and we just log the error.
 */
export async function sendBookingConfirmation(p: BookingEmailPayload): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from   = process.env.BOOKING_EMAIL_FROM;
  const bcc    = process.env.BOOKING_EMAIL_BCC || undefined;

  if (!apiKey || !from) {
    console.warn("[email] skipped - RESEND_API_KEY / BOOKING_EMAIL_FROM not set");
    return;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type":  "application/json",
      },
      body: JSON.stringify({
        from,
        to: [p.customerEmail],
        bcc: bcc ? [bcc] : undefined,
        subject: `Booking confirmed — Padel Leaf · ${p.courtName} · ${fmtDate(p.startsAt)} ${fmtTime(p.startsAt)}`,
        html: buildHtml(p),
        text: buildText(p),
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error(`[email] send failed for booking #${p.bookingId}:`, res.status, errText);
    } else {
      console.log(`[email] confirmation sent for booking #${p.bookingId} to ${p.customerEmail}`);
    }
  } catch (e) {
    console.error(`[email] send threw for booking #${p.bookingId}:`, e);
  }
}
