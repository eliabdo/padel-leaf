import Link from "next/link";
import { redirect } from "next/navigation";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { PhoneInput } from "@/app/components/phone-input";
import {
  CUSTOMER_CATEGORIES,
  normalizeCategoryInput,
} from "@/lib/customer-categories";
import {
  CUSTOMER_GENDERS,
  normalizeGenderInput,
} from "@/lib/customer-genders";

export const metadata = { title: "Admin · New customer" };
export const dynamic = "force-dynamic";

async function createCustomer(formData: FormData): Promise<void> {
  "use server";

  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName  = String(formData.get("lastName")  ?? "").trim();
  const name      = `${firstName} ${lastName}`.trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const category = normalizeCategoryInput(formData.get("category"));
  const gender = normalizeGenderInput(formData.get("gender"));

  if (!name || !email || !phone) {
    redirect("/admin/customers/new?error=missing");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    redirect("/admin/customers/new?error=email");
  }

  const existing = await db
    .select({ email: schema.customers.email })
    .from(schema.customers)
    .where(eq(schema.customers.email, email))
    .limit(1);

  if (existing.length > 0) {
    redirect(`/admin/customers/${encodeURIComponent(email)}?exists=1`);
  }

  await db.insert(schema.customers).values({
    name,
    email,
    phone,
    notes,
    category,
    gender,
    source: "manual",
  });

  redirect("/admin/customers?created=1");
}

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  fontFamily: "system-ui, sans-serif", fontSize: 14, color: "#111827",
  background: "#fff", border: "1px solid rgba(22,163,74,0.22)",
  borderRadius: 9, padding: "11px 14px", outline: "none",
};
const labelStyle: React.CSSProperties = {
  display: "block", fontFamily: "system-ui, sans-serif", fontSize: 11,
  fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase",
  color: "#6b7280", marginBottom: 7,
};

export default async function AdminNewCustomerPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;
  const errorMessage =
    sp.error === "missing"
      ? "Name, email, and phone are all required."
      : sp.error === "email"
        ? "That email address doesn't look right. Check it?"
        : null;

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "36px 28px" }}>
      <Link
        href="/admin/customers"
        style={{
          fontFamily: "system-ui, sans-serif", fontSize: 13, fontWeight: 500,
          color: "#16a34a", textDecoration: "none",
        }}
      >
        ← Customers
      </Link>

      <div style={{ margin: "16px 0 28px" }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: "#16a34a", marginBottom: 6, fontFamily: "system-ui, sans-serif" }}>
          New
        </div>
        <h1 style={{ fontFamily: "system-ui, sans-serif", fontSize: 26, fontWeight: 700, color: "#0d2010", margin: 0 }}>
          Add a customer
        </h1>
        <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, color: "#6b7280", marginTop: 6, lineHeight: 1.55 }}>
          For customers you want to pre-load before they book - friends, walk-ins, regulars who only call.
          They&rsquo;ll appear in the customers list right away, and any future booking under this email
          will link to this record automatically.
        </p>
      </div>

      {errorMessage && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.25)", borderRadius: 12, padding: "14px 18px", marginBottom: 24 }}>
          <span style={{ fontSize: 16, lineHeight: 1.2 }}>⚠️</span>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: "#991b1b", lineHeight: 1.5 }}>
            {errorMessage}
          </div>
        </div>
      )}

      <form
        action={createCustomer}
        style={{
          background: "#fff", border: "1px solid rgba(22,163,74,0.12)",
          borderRadius: 14, padding: "32px 28px",
          display: "flex", flexDirection: "column", gap: 20,
          boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)",
        }}
      >
        <div className="admin-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={labelStyle}>First name</label>
            <input name="firstName" type="text" required maxLength={60} style={inputStyle} autoFocus />
          </div>
          <div>
            <label style={labelStyle}>Last name</label>
            <input name="lastName" type="text" required maxLength={60} style={inputStyle} />
          </div>
        </div>

        <div className="admin-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={labelStyle}>Phone</label>
            <PhoneInput name="phone" required />
          </div>
          <div>
            <label style={labelStyle}>Email</label>
            <input name="email" type="email" required maxLength={200} style={inputStyle} />
          </div>
        </div>

        <div className="admin-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={labelStyle}>Category</label>
            <select name="category" defaultValue="" style={{ ...inputStyle, cursor: "pointer" }}>
              <option value="">— Not yet rated —</option>
              {CUSTOMER_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Gender</label>
            <select name="gender" defaultValue="" style={{ ...inputStyle, cursor: "pointer" }}>
              <option value="">— Not specified —</option>
              {CUSTOMER_GENDERS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label style={labelStyle}>Notes (optional)</label>
          <textarea
            name="notes"
            rows={3}
            placeholder="Anything worth remembering - referrer, preferred court, dietary, etc."
            style={{ ...inputStyle, resize: "vertical", fontFamily: "system-ui, sans-serif" }}
          />
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 4 }}>
          <button
            type="submit"
            style={{
              fontFamily: "system-ui, sans-serif", fontSize: 14, fontWeight: 600,
              color: "#fff", background: "#16a34a", border: "none",
              borderRadius: 9, padding: "13px 24px", cursor: "pointer",
              boxShadow: "0 2px 8px rgba(22,163,74,0.30)",
            }}
          >
            Add customer →
          </button>
          <Link
            href="/admin/customers"
            style={{
              fontFamily: "system-ui, sans-serif", fontSize: 13, fontWeight: 500,
              color: "#6b7280", textDecoration: "none",
              padding: "12px 18px", borderRadius: 9,
              border: "1px solid #e5e7eb", background: "#fff",
            }}
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
