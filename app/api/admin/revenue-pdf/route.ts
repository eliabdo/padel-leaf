import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, desc, and, gte, lt } from "drizzle-orm";
import { parseDateKey, dateOnlyKey } from "@/lib/booking";
import type { PDFDocument as PDFDocumentType, RGB } from "pdf-lib";
import path from "path";
import fs from "fs";

export const dynamic = "force-dynamic";

// ── helpers ───────────────────────────────────────────────────────────────────
function usd(cents: number) {
  return "$" + (cents / 100).toFixed(2);
}
function fmtTime(d: Date) {
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}
function hexToRgb(hex: string, rgbFn: typeof import("pdf-lib").rgb) {
  const n = parseInt(hex.replace("#", ""), 16);
  return rgbFn(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

// ── PDF builder ───────────────────────────────────────────────────────────────
async function buildPdf(data: {
  dateLabel: string;
  generatedAt: string;
  bookingTotal: number;
  manualTotal: number;
  dayTotal: number;
  completedBookings: {
    id: number;
    customerName: string;
    courtName: string;
    startsAt: Date;
    endsAt: Date;
    totalCents: number;
    paymentMethod: string | null;
  }[];
  manualItems: {
    id: number;
    label: string;
    notes: string | null;
    amountCents: number;
  }[];
}): Promise<Uint8Array> {
  const { PDFDocument, rgb, StandardFonts } = await import("pdf-lib");

  const h  = (hex: string) => hexToRgb(hex, rgb);
  const GREEN  = h("#16a34a");
  const DARK   = h("#0d2010");
  const GREY   = h("#6b7280");
  const LGREY  = h("#9ca3af");
  const WHITE  = rgb(1, 1, 1);
  const LGREEN = h("#f0fdf4");
  const BLUE   = h("#0369a1");
  const PURPLE = h("#6d28d9");

  const doc  = await PDFDocument.create();
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const reg  = await doc.embedFont(StandardFonts.Helvetica);

  const PAGE_W = 595, PAGE_H = 842;
  const ML = 40, MR = 40, MT = 40;
  const CW = PAGE_W - ML - MR; // 515

  let page = doc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MT; // y counts DOWN from top in pdf-lib (we flip)

  // helper: draw from top-left
  const draw = {
    rect(x: number, yTop: number, w: number, h: number, color: RGB) {
      page.drawRectangle({ x, y: yTop - h, width: w, height: h, color });
    },
    text(t: string, x: number, yTop: number, size: number, color: RGB, font = reg, maxW?: number) {
      let str = t;
      if (maxW) {
        while (str.length > 1 && font.widthOfTextAtSize(str, size) > maxW) str = str.slice(0, -1);
        if (str !== t) str = str.slice(0, -1) + "…";
      }
      page.drawText(str, { x, y: yTop - size, size, font, color });
    },
    textR(t: string, xRight: number, yTop: number, size: number, color: RGB, font = reg) {
      const w = font.widthOfTextAtSize(t, size);
      page.drawText(t, { x: xRight - w, y: yTop - size, size, font, color });
    },
    line(x1: number, y1: number, x2: number, thickness: number, color: RGB) {
      page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y1 }, thickness, color });
    },
  };

  // ── Header ────────────────────────────────────────────────────────────────
  draw.rect(ML, y, CW, 56, GREEN);
  draw.text("Padel Leaf",        ML + 16, y - 8,  18, WHITE, bold);
  draw.text("Daily Revenue Report", ML + 16, y - 30, 10, rgb(1,1,1));
  draw.textR(data.dateLabel,     ML + CW - 16, y - 8,  13, WHITE, bold);
  draw.textR("Generated " + data.generatedAt, ML + CW - 16, y - 28, 9, rgb(0.9,0.9,0.9));
  y -= 68;

  // ── Summary cards (3-up) ──────────────────────────────────────────────────
  const cw3 = (CW - 16) / 3;
  const cards = [
    { label: "DAY TOTAL",       value: usd(data.dayTotal),     bg: LGREEN,              valCol: DARK  },
    { label: "BOOKING REVENUE", value: usd(data.bookingTotal), bg: h("#eff9ff"),  valCol: BLUE  },
    { label: "OTHER REVENUE",   value: usd(data.manualTotal),  bg: h("#f5f3ff"),  valCol: PURPLE },
  ];
  cards.forEach((c, i) => {
    const cx = ML + i * (cw3 + 8);
    draw.rect(cx, y, cw3, 52, c.bg);
    draw.text(c.label, cx + 10, y - 8,  7,  GREY, bold);
    draw.text(c.value, cx + 10, y - 24, 18, c.valCol, bold);
  });
  y -= 64;

  // ── Section helpers ───────────────────────────────────────────────────────
  function sectionHeader(title: string, total: string) {
    draw.rect(ML, y, CW, 24, GREEN);
    draw.text(title.toUpperCase(), ML + 12, y - 7, 9, WHITE, bold);
    draw.textR(total, ML + CW - 12, y - 7, 9, WHITE, bold);
    y -= 24;
  }

  const TH_H = 18;
  function tableHeader(cols: { label: string; x: number; w: number; right?: boolean }[]) {
    draw.rect(ML, y, CW, TH_H, LGREEN);
    cols.forEach(c => {
      if (c.right) draw.textR(c.label.toUpperCase(), c.x + c.w, y - 5, 7.5, GREY, bold);
      else         draw.text(c.label.toUpperCase(),  c.x,       y - 5, 7.5, GREY, bold);
    });
    y -= TH_H;
  }

  const ROW_H = 20;
  function tableRow(cols: { text: string; x: number; w: number; right?: boolean; bold?: boolean; color?: RGB }[], even: boolean) {
    if (even) draw.rect(ML, y, CW, ROW_H, h("#fafff9"));
    cols.forEach(c => {
      const font  = c.bold ? bold : reg;
      const color = c.color ?? DARK;
      if (c.right) draw.textR(c.text, c.x + c.w, y - 5, 9, color, font);
      else         draw.text(c.text,  c.x,        y - 5, 9, color, font, c.w - 4);
    });
    y -= ROW_H;
  }

  // ── Completed Bookings ────────────────────────────────────────────────────
  sectionHeader("Completed Bookings", usd(data.bookingTotal));

  const bCols = [
    { label: "#",        x: ML+4,   w: 28 },
    { label: "Customer", x: ML+36,  w: 110 },
    { label: "Court",    x: ML+150, w: 72 },
    { label: "Time",     x: ML+226, w: 80 },
    { label: "Payment",  x: ML+310, w: 70 },
    { label: "Amount",   x: ML+384, w: 80, right: true },
  ];
  tableHeader(bCols);

  const payLabel: Record<string, string> = { venue: "Venue", whish: "Whish", omt: "OMT" };

  if (data.completedBookings.length === 0) {
    draw.text("No completed bookings for this day.", ML + 12, y - 6, 9, LGREY);
    y -= 24;
  } else {
    data.completedBookings.forEach((b, i) => {
      if (y < 120) { page = doc.addPage([PAGE_W, PAGE_H]); y = PAGE_H - MT; }
      tableRow([
        { text: "#" + b.id,      x: ML+4,   w: 28,  bold: true, color: GREEN },
        { text: b.customerName,  x: ML+36,  w: 110, bold: true },
        { text: b.courtName,     x: ML+150, w: 72,  color: GREY },
        { text: fmtTime(b.startsAt) + "–" + fmtTime(b.endsAt), x: ML+226, w: 80, color: GREY },
        { text: payLabel[b.paymentMethod ?? "venue"] ?? (b.paymentMethod ?? ""), x: ML+310, w: 70, color: GREY },
        { text: usd(b.totalCents), x: ML+384, w: 80, right: true, bold: true },
      ], i % 2 === 1);
    });
  }

  y -= 12;
  if (y < 160) { page = doc.addPage([PAGE_W, PAGE_H]); y = PAGE_H - MT; }

  // ── Other Revenue ─────────────────────────────────────────────────────────
  sectionHeader("Other Revenue", usd(data.manualTotal));

  const mCols = [
    { label: "Item",   x: ML+4,   w: 200 },
    { label: "Notes",  x: ML+208, w: 200 },
    { label: "Amount", x: ML+412, w: 80, right: true },
  ];
  tableHeader(mCols);

  if (data.manualItems.length === 0) {
    draw.text("No other revenue items for this day.", ML + 12, y - 6, 9, LGREY);
    y -= 24;
  } else {
    data.manualItems.forEach((item, i) => {
      if (y < 120) { page = doc.addPage([PAGE_W, PAGE_H]); y = PAGE_H - MT; }
      tableRow([
        { text: item.label,        x: ML+4,   w: 200, bold: true },
        { text: item.notes ?? "—", x: ML+208, w: 200, color: GREY },
        { text: usd(item.amountCents), x: ML+412, w: 80, right: true, bold: true },
      ], i % 2 === 1);
    });
  }

  y -= 16;

  // ── Grand Total ───────────────────────────────────────────────────────────
  draw.rect(ML, y, CW, 40, LGREEN);
  draw.line(ML, y, ML + CW, 2, GREEN);
  draw.text("GRAND TOTAL", ML + 12, y - 13, 9, GREY, bold);
  draw.textR(usd(data.dayTotal), ML + CW - 12, y - 8, 20, DARK, bold);
  y -= 56;

  // ── Footer ────────────────────────────────────────────────────────────────
  draw.line(ML, y, ML + CW, 0.5, h("#e5e7eb"));
  y -= 8;
  draw.text("Padel Leaf · Mezher, Bsalim, Mount Lebanon", ML, y - 8, 8, LGREY);
  draw.textR(data.dateLabel, ML + CW, y - 8, 8, LGREY);

  return doc.save();
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const sp      = req.nextUrl.searchParams;
  const now     = new Date();
  const viewKey = sp.get("date") && /^\d{4}-\d{2}-\d{2}$/.test(sp.get("date")!)
    ? sp.get("date")!
    : dateOnlyKey(now);

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

  const pdfBytes = await buildPdf({
    dateLabel, generatedAt,
    bookingTotal, manualTotal, dayTotal,
    completedBookings: completedBookings.map(b => ({
      ...b,
      startsAt: new Date(b.startsAt),
      endsAt:   new Date(b.endsAt),
    })),
    manualItems,
  });

  // Save to Revenue/ folder when running locally (silently skipped on Vercel)
  try {
    const revenueDir = path.join(process.cwd(), "Revenue");
    if (!fs.existsSync(revenueDir)) fs.mkdirSync(revenueDir, { recursive: true });
    fs.writeFileSync(path.join(revenueDir, "revenue-" + viewKey + ".pdf"), pdfBytes);
  } catch { /* read-only filesystem on Vercel — skip */ }

  const filename = "revenue-" + viewKey + ".pdf";
  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type":        "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length":      String(pdfBytes.length),
      "Cache-Control":       "no-store",
    },
  });
}
