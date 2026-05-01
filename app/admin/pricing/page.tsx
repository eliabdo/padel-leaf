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
  const cents = Math.round(dollars * 100);
  await db
    .update(schema.pricingRules)
    .set({ hourlyRateCents: cents })
    .where(eq(schema.pricingRules.id, id));
  redirect("/admin/pricing");
}

export default async function AdminPricingPage() {
  const rules = await db
    .select()
    .from(schema.pricingRules)
    .orderBy(asc(schema.pricingRules.id));

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="font-serif text-4xl text-forest-deep mb-3">Pricing</h1>
      <p className="text-char-soft mb-8 text-sm">
        Single flat hourly rate in v1. Peak/off-peak rules can be layered in later
        without changing the schema.
      </p>

      {rules.map((r) => (
        <form
          key={r.id}
          action={updatePricing}
          className="bg-cream rounded-2xl border border-forest/15 p-6 space-y-4"
        >
          <input type="hidden" name="id" value={r.id} />
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-forest font-semibold mb-1">
              {r.label}
            </div>
            <div className="text-char-soft text-sm">
              Active: {r.active ? "yes" : "no"}
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-[0.18em] text-forest font-semibold mb-2">
              Hourly rate (USD)
            </label>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-2xl text-forest-deep">$</span>
              <input
                name="hourlyRateDollars"
                type="number"
                step="0.01"
                min="0.01"
                defaultValue={(r.hourlyRateCents / 100).toFixed(2)}
                className="flex-1 px-4 py-3 rounded-lg border border-forest/20 bg-cream font-serif text-2xl text-forest-deep"
              />
              <span className="text-char-soft">/ hour</span>
            </div>
          </div>

          <button className="btn btn-primary">Save</button>
        </form>
      ))}
    </div>
  );
}
