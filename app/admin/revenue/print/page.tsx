import { db, schema } from "@/lib/db";
import { eq, desc, and, gte, lt } from "drizzle-orm";
import { parseDateKey, dateOnlyKey, formatTime } from "@/lib/booking";
import { formatUsd } from "@/lib/pricing";
import { PrintTrigger } from "./print-trigger";

export const dynamic = "force-dynamic";

export default async function RevenuePrintPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const sp      = await searchParams;
  const now     = new Date();
  const viewKey = sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : dateOnlyKey(now);

  const dayStart = parseDateKey(viewKey);
  const dayEnd   = new Date(dayStart.getTime() + 86_400_000);

  const [completedBookings, manualItems] = await Promise.all([
    db.select({
      id:            schema.bookings.id,
      customerName:  schema.bookings.customerName,
      customerEmail: schema.bookings.customerEmail,
      startsAt:      schema.bookings.startsAt,
      endsAt:        schema.bookings.endsAt,
      totalCents:    schema.bookings.totalCents,
      courtName:     schema.courts.name,
      paymentMethod: schema.bookings.paymentMethod,
    })
      .from(schema.bookings)
      .innerJoin(schema.courts, eq(schema.bookings.courtId, schema.courts.id))
      .where(and(
        eq(schema.bookings.status, "completed"),
        gte(schema.bookings.startsAt, dayStart),
        lt(schema.bookings.startsAt, dayEnd),
      ))
      .orderBy(desc(schema.bookings.startsAt)),
    db.select()
      .from(schema.revenueItems)
      .where(and(
        gte(schema.revenueItems.createdAt, dayStart),
        lt(schema.revenueItems.createdAt, dayEnd),
      ))
      .orderBy(desc(schema.revenueItems.createdAt)),
  ]);

  const bookingTotal = completedBookings.reduce((s, b) => s + b.totalCents, 0);
  const manualTotal  = manualItems.reduce((s, i) => s + i.amountCents, 0);
  const dayTotal     = bookingTotal + manualTotal;

  const dateLabel = dayStart.toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  const generatedAt = now.toLocaleString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  const payLabel: Record<string, string> = {
    venue: "Venue", whish: "Whish", omt: "OMT",
  };

  return (
    <>
      <PrintTrigger />
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: system-ui, -apple-system, sans-serif; background: #fff; color: #111; }
        @media print {
          @page { size: A4; margin: 14mm 16mm; }
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        .page { max-width: 760px; margin: 0 auto; padding: 32px 28px; }
        .header { background: #16a34a; border-radius: 10px; padding: 22px 28px; display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 22px; }
        .header-left h1 { color: #fff; font-size: 22px; font-weight: 700; letter-spacing: -0.3px; }
        .header-left p  { color: rgba(255,255,255,0.70); font-size: 12px; margin-top: 4px; }
        .header-right   { text-align: right; }
        .header-right .date-label { color: #fff; font-size: 16px; font-weight: 600; }
        .header-right .gen        { color: rgba(255,255,255,0.65); font-size: 10px; margin-top: 4px; }
        .summary { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; margin-bottom: 24px; }
        .card { border: 1px solid #e5f5ec; border-radius: 8px; padding: 14px 16px; background: #f0fdf4; }
        .card .clabel { font-size: 9px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #6b7280; margin-bottom: 5px; }
        .card .cvalue { font-size: 20px; font-weight: 700; color: #0d2010; font-variant-numeric: tabular-nums; }
        .card.blue { background: #eff9ff; border-color: #bae6fd; }
        .card.blue .cvalue { color: #0369a1; }
        .card.purple { background: #f5f3ff; border-color: #ddd6fe; }
        .card.purple .cvalue { color: #6d28d9; }
        .section { margin-bottom: 20px; border: 1px solid #dcfce7; border-radius: 8px; overflow: hidden; }
        .section-head { background: #16a34a; padding: 9px 14px; display: flex; justify-content: space-between; }
        .section-head span { color: #fff; font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; }
        table { width: 100%; border-collapse: collapse; }
        thead tr { background: #f0fdf4; }
        th { padding: 7px 12px; font-size: 9px; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase; color: #6b7280; text-align: left; border-bottom: 1px solid #dcfce7; }
        th.r, td.r { text-align: right; }
        td { padding: 9px 12px; font-size: 11px; color: #111827; border-bottom: 1px solid #f0fdf4; }
        tr:last-child td { border-bottom: none; }
        tr:nth-child(even) td { background: #fafff9; }
        td.mono { font-family: ui-monospace, monospace; font-size: 10px; }
        td.muted { color: #6b7280; }
        td.green { color: #16a34a; font-weight: 700; font-family: ui-monospace, monospace; font-size: 10px; }
        td.bold  { font-weight: 700; font-family: ui-monospace, monospace; }
        td.pill  { }
        .empty { padding: 18px 14px; font-size: 11px; color: #9ca3af; font-style: italic; }
        .total-row { background: #f0fdf4; border-top: 2px solid #16a34a; padding: 14px 16px; display: flex; justify-content: space-between; align-items: center; margin-top: 8px; border-radius: 8px; }
        .total-row .tl { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #6b7280; }
        .total-row .tv { font-size: 24px; font-weight: 700; color: #0d2010; font-variant-numeric: tabular-nums; }
        .footer { margin-top: 28px; border-top: 1px solid #e5e7eb; padding-top: 12px; display: flex; justify-content: space-between; }
        .footer span { font-size: 9px; color: #9ca3af; }
      `}</style>

      <div className="page">
        {/* Header */}
        <div className="header">
          <div className="header-left">
            <h1>Padelleaf</h1>
            <p>Daily Revenue Report</p>
          </div>
          <div className="header-right">
            <div className="date-label">{dateLabel}</div>
            <div className="gen">Generated {generatedAt}</div>
          </div>
        </div>

        {/* Summary cards */}
        <div className="summary">
          <div className="card">
            <div className="clabel">Day Total</div>
            <div className="cvalue">{formatUsd(dayTotal)}</div>
          </div>
          <div className="card blue">
            <div className="clabel">Booking Revenue</div>
            <div className="cvalue">{formatUsd(bookingTotal)}</div>
          </div>
          <div className="card purple">
            <div className="clabel">Other Revenue</div>
            <div className="cvalue">{formatUsd(manualTotal)}</div>
          </div>
        </div>

        {/* Completed bookings */}
        <div className="section">
          <div className="section-head">
            <span>Completed Bookings</span>
            <span>{formatUsd(bookingTotal)}</span>
          </div>
          {completedBookings.length === 0 ? (
            <div className="empty">No completed bookings for this day.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Customer</th>
                  <th>Email</th>
                  <th>Court</th>
                  <th>Time</th>
                  <th>Payment</th>
                  <th className="r">Amount</th>
                </tr>
              </thead>
              <tbody>
                {completedBookings.map((b) => (
                  <tr key={b.id}>
                    <td className="green">#{b.id}</td>
                    <td style={{ fontWeight: 600 }}>{b.customerName}</td>
                    <td className="muted">{b.customerEmail}</td>
                    <td className="muted">{b.courtName}</td>
                    <td className="mono muted">
                      {formatTime(new Date(b.startsAt))}–{formatTime(new Date(b.endsAt))}
                    </td>
                    <td className="muted">{payLabel[b.paymentMethod ?? "venue"] ?? b.paymentMethod}</td>
                    <td className="r bold">{formatUsd(b.totalCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Other revenue */}
        <div className="section">
          <div className="section-head">
            <span>Other Revenue</span>
            <span>{formatUsd(manualTotal)}</span>
          </div>
          {manualItems.length === 0 ? (
            <div className="empty">No other revenue items for this day.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Notes</th>
                  <th className="r">Amount</th>
                </tr>
              </thead>
              <tbody>
                {manualItems.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 600 }}>{item.label}</td>
                    <td className="muted">{item.notes ?? "—"}</td>
                    <td className="r bold">{formatUsd(item.amountCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Grand total */}
        <div className="total-row">
          <div className="tl">Grand Total</div>
          <div className="tv">{formatUsd(dayTotal)}</div>
        </div>

        {/* Footer */}
        <div className="footer">
          <span>Padelleaf · Mezher, Bsalim, Mount Lebanon</span>
          <span>padel-leaf.vercel.app</span>
          <span>{dateLabel}</span>
        </div>
      </div>
    </>
  );
}
