import { redirect } from "next/navigation";
import { eq, asc } from "drizzle-orm";
import { db, schema } from "@/lib/db";

export const metadata = { title: "Admin · Pricing" };
export const dynamic = "force-dynamic";

async function updatePricing(formData: FormData): Promise<void> {
  "use server";
  const id = Number(formData.get("id"));
  const dollars = Number(formData.get("hourlyRateDollars"));
  if (!id || !Number.isFinite(dollars) || dollars <= 0) return;
  await db.update(schema.pricingRules).set({ hourlyRateCents: Math.round(dollars * 100) }).where(eq(schema.pricingRules.id, id));
  redirect("/admin/pricing");
}

const inputStyle: React.CSSProperties = {
  flex: 1, fontFamily: "ui-monospace, 'SF Mono', monospace", fontSize: 24, fontWeight: 700, color: "#0d2010",
  background: "#f9fafb", border: "1px solid rgba(22,163,74,0.22)",
  borderRadius: 9, padding: "10px 14px", outline: "none",
};

export default async function AdminPricingPage() {
  const rules = await db.select().from(schema.pricingRules).orderBy(asc(schema.pricingRules.id));

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "36px 28px" }}>
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: "#16a34a", marginBottom: 6, fontFamily: "system-ui, sans-serif" }}>Config</div>
        <h1 style={{ fontFamily: "system-ui, sans-serif", fontSize: 26, fontWeight: 700, color: "#0d2010", margin: 0 }}>Pricing</h1>
      </div>
      <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: "#6b7280", lineHeight: 1.7, marginBottom: 28, marginTop: 8 }}>
        Single flat hourly rate. Peak / off-peak rules can be layered in later without changing the schema.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {rules.map((r) => (
          <form key={r.id} action={updatePricing} style={{ background: "#fff", border: "1px solid rgba(22,163,74,0.12)", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)" }}>
            <input type="hidden" name="id" value={r.id} />
            {/* Rule header */}
            <div style={{ padding: "16px 24px", background: "#fafdfb", borderBottom: "1px solid rgba(22,163,74,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, fontWeight: 700, color: "#0d2010" }}>{r.label}</div>
              <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: r.active ? "rgba(22,163,74,0.10)" : "rgba(107,114,128,0.09)", color: r.active ? "#15803d" : "#6b7280", border: r.active ? "1px solid rgba(22,163,74,0.22)" : "1px solid rgba(107,114,128,0.18)" }}>
                {r.active ? "Active" : "Inactive"}
              </span>
            </div>
            {/* Rate input */}
            <div style={{ padding: "24px" }}>
              <label style={{ display: "block", fontFamily: "system-ui, sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6b7280", marginBottom: 10 }}>
                Hourly rate (USD)
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 24, fontWeight: 700, color: "#9ca3af" }}>$</span>
                <input name="hourlyRateDollars" type="number" step="0.01" min="0.01" defaultValue={(r.hourlyRateCents / 100).toFixed(2)} style={inputStyle} />
                <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, color: "#9ca3af" }}>/ hr</span>
              </div>
              <button type="submit" style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, fontWeight: 600, color: "#fff", background: "#16a34a", border: "none", borderRadius: 9, padding: "10px 22px", cursor: "pointer", boxShadow: "0 2px 8px rgba(22,163,74,0.28)" }}>
                Save changes
              </button>
            </div>
          </form>
        ))}
      </div>
    </div>
  );
}
