import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { destroyAdminSession, getAdminSession } from "@/lib/session";
import AdminNav from "./admin-nav";

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

  const logoutForm = (
    <form action={logoutAction}>
      <button type="submit" style={{
        fontFamily: "system-ui, sans-serif", fontSize: 12, fontWeight: 500,
        color: "#6b7280", background: "none",
        border: "1px solid #e5e7eb", borderRadius: 8,
        padding: "6px 14px", cursor: "pointer",
        transition: "all 0.15s ease", width: "100%",
      }}>
        Sign out
      </button>
    </form>
  );

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      background: "#f0f5f1",
      backgroundImage: "radial-gradient(circle, rgba(22,163,74,0.09) 1px, transparent 1px)",
      backgroundSize: "22px 22px",
    }}>
      {/* Top accent bar */}
      <div style={{ height: 3, background: "linear-gradient(90deg, #15803d, #4ade80, #15803d)", flexShrink: 0 }} />

      <AdminNav logoutForm={logoutForm} />

      <main style={{ flex: 1 }}>{children}</main>

      <style>{`
        .admin-nav-link:hover { background: rgba(22,163,74,0.08) !important; color: #15803d !important; }

        /* Desktop defaults */
        .admin-desktop-nav { display: flex !important; gap: 2px; }
        .admin-desktop-only { display: block !important; }
        .admin-mobile-only { display: none !important; }

        /* Mobile breakpoint */
        @media (max-width: 720px) {
          .admin-desktop-nav { display: none !important; }
          .admin-desktop-only { display: none !important; }
          .admin-mobile-only { display: flex !important; }

          /* Tighter page padding */
          main > div { padding-left: 14px !important; padding-right: 14px !important; }

          /* Stack 2-col form grids */
          .admin-form-grid { grid-template-columns: 1fr !important; }

          /* Scrollable tab bars */
          .admin-tabs-bar { overflow-x: auto; -webkit-overflow-scrolling: touch; }
          .admin-tabs-bar button { flex-shrink: 0; }
        }
      `}</style>
    </div>
  );
}
