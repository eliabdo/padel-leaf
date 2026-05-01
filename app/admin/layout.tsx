import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { destroyAdminSession, getAdminSession } from "@/lib/session";

export const dynamic = "force-dynamic";

async function logoutAction(): Promise<void> {
  "use server";
  await destroyAdminSession();
  redirect("/admin/login");
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const headerStore = await headers();
  const pathname = headerStore.get("x-admin-pathname") ?? "";
  if (pathname.startsWith("/admin/login")) return <>{children}</>;

  const session = await getAdminSession();
  if (!session.valid) redirect("/admin/login");

  const navLinks = [
    { href: "/admin",            label: "Today" },
    { href: "/admin/calendar",   label: "Calendar" },
    { href: "/admin/bookings",   label: "Bookings" },
    { href: "/admin/customers",  label: "Customers" },
    { href: "/admin/messages",   label: "Messages" },
    { href: "/admin/block-outs", label: "Block-outs" },
    { href: "/admin/pricing",    label: "Pricing" },
  ];

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f0f5f1", backgroundImage: "radial-gradient(circle, rgba(22,163,74,0.09) 1px, transparent 1px)", backgroundSize: "22px 22px" }}>

      {/* Top accent bar */}
      <div style={{ height: 3, background: "linear-gradient(90deg, #15803d, #4ade80, #15803d)", flexShrink: 0 }} />

      <header style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(22,163,74,0.12)", boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)", flexShrink: 0 }}>
        <div style={{ maxWidth: 1360, margin: "0 auto", padding: "0 28px", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24 }}>

          {/* Brand */}
          <Link href="/admin" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", flexShrink: 0 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: "linear-gradient(135deg, #16a34a, #4ade80)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(22,163,74,0.35)" }}>
              <span style={{ fontFamily: "serif", fontSize: 14, fontWeight: 800, color: "#fff", lineHeight: 1 }}>PL</span>
            </div>
            <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, fontWeight: 700, color: "#14532d", letterSpacing: "0.01em" }}>
              Padel Leaf <span style={{ color: "#86efac", fontWeight: 400 }}>/ Admin</span>
            </span>
          </Link>

          {/* Nav */}
          <nav style={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            {navLinks.map(({ href, label }) => (
              <Link key={href} href={href} style={{
                fontFamily: "system-ui, sans-serif", fontSize: 13, fontWeight: 500,
                color: "#374151", textDecoration: "none",
                padding: "6px 14px", borderRadius: 8,
                transition: "all 0.15s ease",
              }}
              className="admin-nav-link"
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Sign out */}
          <form action={logoutAction} style={{ flexShrink: 0 }}>
            <button type="submit" style={{
              fontFamily: "system-ui, sans-serif", fontSize: 12, fontWeight: 500,
              color: "#6b7280", background: "none",
              border: "1px solid #e5e7eb", borderRadius: 8,
              padding: "6px 14px", cursor: "pointer",
              transition: "all 0.15s ease",
            }}>
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main style={{ flex: 1 }}>{children}</main>

      <style>{`
        .admin-nav-link:hover { background: rgba(22,163,74,0.08) !important; color: #15803d !important; }
      `}</style>
    </div>
  );
}
