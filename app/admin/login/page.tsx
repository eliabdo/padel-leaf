import { redirect } from "next/navigation";
import { createAdminSession, verifyAdminPassword, getAdminSession } from "@/lib/session";

export const metadata = { title: "Admin · Sign in" };
export const dynamic = "force-dynamic";

async function loginAction(formData: FormData): Promise<void> {
  "use server";
  const password = String(formData.get("password") ?? "");
  const ok = await verifyAdminPassword(password);
  if (!ok) redirect("/admin/login?e=1");
  await createAdminSession();
  redirect("/admin");
}

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  const session = await getAdminSession();
  if (session.valid) redirect("/admin");
  const { e } = await searchParams;

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#f0f5f1",
      backgroundImage: "radial-gradient(circle, rgba(22,163,74,0.09) 1px, transparent 1px)",
      backgroundSize: "22px 22px",
      padding: "24px",
    }}>
      {/* Subtle glow behind card */}
      <div style={{ position: "fixed", top: "35%", left: "50%", transform: "translate(-50%,-50%)", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(22,163,74,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{
        background: "#fff",
        border: "1px solid rgba(22,163,74,0.15)",
        borderRadius: 18,
        padding: "44px 40px",
        width: "100%", maxWidth: 420,
        boxShadow: "0 4px 16px rgba(0,0,0,0.06), 0 20px 48px rgba(0,0,0,0.06), 0 0 0 1px rgba(22,163,74,0.04)",
        position: "relative",
      }}>
        {/* Top accent bar */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #15803d, #4ade80, #15803d)", borderRadius: "18px 18px 0 0" }} />

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg, #16a34a, #4ade80)", display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(22,163,74,0.35)", marginBottom: 14 }}>
            <span style={{ fontFamily: "serif", fontSize: 20, fontWeight: 800, color: "#fff" }}>PL</span>
          </div>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 18, fontWeight: 700, color: "#0d2010" }}>Padel Leaf</div>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: "#9ca3af", marginTop: 4, letterSpacing: "0.06em" }}>ADMIN PANEL</div>
        </div>

        <form action={loginAction} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label htmlFor="password" style={{ display: "block", fontFamily: "system-ui, sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6b7280", marginBottom: 8 }}>
              Password
            </label>
            <input
              id="password" name="password" type="password" required autoFocus
              style={{ width: "100%", boxSizing: "border-box", fontFamily: "system-ui, sans-serif", fontSize: 15, color: "#111827", background: "#f9fafb", border: "1px solid rgba(22,163,74,0.25)", borderRadius: 10, padding: "12px 16px", outline: "none" }}
            />
          </div>

          {e === "1" && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.22)", borderRadius: 9, padding: "10px 14px" }}>
              <span style={{ fontSize: 14 }}>⚠️</span>
              <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, fontWeight: 500, color: "#dc2626" }}>Wrong password. Please try again.</span>
            </div>
          )}

          <button type="submit" style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, fontWeight: 600, color: "#fff", background: "#16a34a", border: "none", borderRadius: 10, padding: "13px 24px", cursor: "pointer", marginTop: 4, boxShadow: "0 2px 8px rgba(22,163,74,0.30), 0 1px 3px rgba(22,163,74,0.20)" }}>
            Sign in →
          </button>
        </form>

        <a href="/" style={{ display: "block", marginTop: 24, textAlign: "center", fontFamily: "system-ui, sans-serif", fontSize: 12, color: "#9ca3af", textDecoration: "none" }}>
          ← Back to site
        </a>
      </div>
    </div>
  );
}
