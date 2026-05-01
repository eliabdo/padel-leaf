import { redirect } from "next/navigation";
import BlockOutDateFields from "./block-out-date-fields";
import BlockOutReasonField from "./block-out-reason-field";
import { asc, desc, eq, and, inArray, lt, gt } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { formatDateLong, formatTime } from "@/lib/booking";

export const metadata = { title: "Admin · Block-outs" };
export const dynamic = "force-dynamic";

async function createBlockOut(formData: FormData): Promise<void> {
  "use server";
  const courtIdRaw = String(formData.get("courtId") ?? "");
  const startsAt = new Date(String(formData.get("startsAt")));
  const endsAt   = new Date(String(formData.get("endsAt")));
  const reason   = String(formData.get("reason") ?? "").trim() || "Maintenance";
  if (!courtIdRaw || isNaN(startsAt.getTime()) || isNaN(endsAt.getTime())) throw new Error("Missing fields");

  if (courtIdRaw === "all") {
    // Block all courts — venue closed
    const courts = await db.select({ id: schema.courts.id }).from(schema.courts);
    const courtIds = courts.map((c) => c.id);
    await db.insert(schema.blockOuts).values(
      courtIds.map((id) => ({ courtId: id, startsAt, endsAt, reason })),
    );
    // Cancel any confirmed bookings that overlap this block-out window
    const overlap = await db
      .select({ id: schema.bookings.id })
      .from(schema.bookings)
      .where(
        and(
          inArray(schema.bookings.courtId, courtIds),
          eq(schema.bookings.status, "confirmed"),
          lt(schema.bookings.startsAt, endsAt),
          gt(schema.bookings.endsAt,   startsAt),
        ),
      );
    if (overlap.length > 0) {
      await db
        .update(schema.bookings)
        .set({ status: "cancelled", cancelledAt: new Date() })
        .where(inArray(schema.bookings.id, overlap.map((b) => b.id)));
    }
  } else {
    const courtId = Number(courtIdRaw);
    if (!courtId) throw new Error("Invalid court");
    await db.insert(schema.blockOuts).values({ courtId, startsAt, endsAt, reason });
    // Cancel any confirmed bookings that overlap this block-out window
    const overlap = await db
      .select({ id: schema.bookings.id })
      .from(schema.bookings)
      .where(
        and(
          eq(schema.bookings.courtId, courtId),
          eq(schema.bookings.status, "confirmed"),
          lt(schema.bookings.startsAt, endsAt),
          gt(schema.bookings.endsAt,   startsAt),
        ),
      );
    if (overlap.length > 0) {
      await db
        .update(schema.bookings)
        .set({ status: "cancelled", cancelledAt: new Date() })
        .where(inArray(schema.bookings.id, overlap.map((b) => b.id)));
    }
  }
  redirect("/admin/block-outs");
}
async function deleteBlockOut(formData: FormData): Promise<void> {
  "use server";
  const id = Number(formData.get("id"));
  if (!id) return;
  await db.delete(schema.blockOuts).where(eq(schema.blockOuts.id, id));
  redirect("/admin/block-outs");
}

const FALLBACK_COLOR = { text: "#6b7280", bg: "rgba(107,114,128,0.10)" };
const courtColor: Record<string, { text: string; bg: string }> = {
  Laurel: { text: "#15803d", bg: "rgba(22,163,74,0.10)" },
  Oak:    { text: "#b45309", bg: "rgba(217,119,6,0.10)" },
  Olive:  { text: "#0369a1", bg: "rgba(3,105,161,0.10)" },
};
const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  fontFamily: "system-ui, sans-serif", fontSize: 14, color: "#111827",
  background: "#fff", border: "1px solid rgba(22,163,74,0.22)",
  borderRadius: 9, padding: "10px 14px", outline: "none",
};
const labelStyle: React.CSSProperties = {
  display: "block", fontFamily: "system-ui, sans-serif", fontSize: 11,
  fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6b7280", marginBottom: 7,
};

export default async function AdminBlockOutsPage() {
  const [courts, items] = await Promise.all([
    db.select().from(schema.courts).orderBy(asc(schema.courts.sortOrder)),
    db.select({ id: schema.blockOuts.id, courtName: schema.courts.name, startsAt: schema.blockOuts.startsAt, endsAt: schema.blockOuts.endsAt, reason: schema.blockOuts.reason })
      .from(schema.blockOuts).innerJoin(schema.courts, eq(schema.blockOuts.courtId, schema.courts.id)).orderBy(desc(schema.blockOuts.startsAt)).limit(100),
  ]);

  return (
    <div style={{ maxWidth: 920, margin: "0 auto", padding: "36px 28px", display: "flex", flexDirection: "column", gap: 28 }}>
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: "#16a34a", marginBottom: 6, fontFamily: "system-ui, sans-serif" }}>Schedule</div>
        <h1 style={{ fontFamily: "system-ui, sans-serif", fontSize: 26, fontWeight: 700, color: "#0d2010", margin: 0 }}>Block-outs</h1>
      </div>

      {/* Create form */}
      <form action={createBlockOut} style={{ background: "#fff", border: "1px solid rgba(22,163,74,0.12)", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)" }}>
        <div style={{ padding: "16px 24px", background: "#fafdfb", borderBottom: "1px solid rgba(22,163,74,0.08)" }}>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, fontWeight: 700, color: "#0d2010" }}>New block-out</div>
        </div>
        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 18 }}>
          <div className="admin-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={labelStyle}>Court</label>
              <select name="courtId" required style={{ ...inputStyle, cursor: "pointer" }}>
                <option value="all">⛔ All Courts — Venue closed</option>
                <optgroup label="Individual courts">
                  {courts.map(c => <option key={c.id} value={c.id}>Court · {c.name}</option>)}
                </optgroup>
              </select>
            </div>
            <BlockOutReasonField />
          </div>
          <BlockOutDateFields />
          <div>
            <button type="submit" style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, fontWeight: 600, color: "#fff", background: "#16a34a", border: "none", borderRadius: 9, padding: "10px 22px", cursor: "pointer", boxShadow: "0 2px 8px rgba(22,163,74,0.28)" }}>
              Add block-out
            </button>
          </div>
        </div>
      </form>

      {/* List */}
      <div style={{ background: "#fff", border: "1px solid rgba(22,163,74,0.12)", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)" }}>
        <div style={{ padding: "16px 24px", background: "#fafdfb", borderBottom: "1px solid rgba(22,163,74,0.08)" }}>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, fontWeight: 700, color: "#0d2010" }}>Active &amp; past block-outs</div>
        </div>
        {items.length === 0 ? (
          <div style={{ padding: "52px 24px", textAlign: "center", color: "#9ca3af", fontFamily: "system-ui, sans-serif" }}>No block-outs.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(22,163,74,0.10)", background: "#fafdfb" }}>
                  {["Court", "When", "Reason", ""].map((h, i) => (
                    <th key={i} style={{ padding: "10px 16px", textAlign: "left", fontFamily: "system-ui, sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#9ca3af" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((b, idx) => {
                  const cc = courtColor[b.courtName] ?? FALLBACK_COLOR;
                  return (
                    <tr key={b.id} style={{ borderTop: "1px solid rgba(22,163,74,0.07)", background: idx % 2 === 1 ? "rgba(22,163,74,0.015)" : "#fff" }}>
                      <td style={{ padding: "13px 16px", verticalAlign: "top" }}>
                        <span style={{ fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20, fontFamily: "system-ui, sans-serif", background: cc.bg, color: cc.text }}>{b.courtName}</span>
                      </td>
                      <td style={{ padding: "13px 16px", verticalAlign: "top" }}>
                        <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: "#111827", fontWeight: 500 }}>{formatDateLong(new Date(b.startsAt))}</div>
                        <div style={{ fontFamily: "ui-monospace, 'SF Mono', monospace", fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{formatTime(new Date(b.startsAt))} — {formatTime(new Date(b.endsAt))}</div>
                      </td>
                      <td style={{ padding: "13px 16px", fontFamily: "system-ui, sans-serif", fontSize: 13, color: "#374151", verticalAlign: "top" }}>{b.reason}</td>
                      <td style={{ padding: "13px 16px", verticalAlign: "top" }}>
                        <form action={deleteBlockOut}>
                          <input type="hidden" name="id" value={b.id} />
                          <button type="submit" style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, fontWeight: 500, color: "#dc2626", background: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.22)", borderRadius: 7, padding: "4px 12px", cursor: "pointer" }}>
                            Remove
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
