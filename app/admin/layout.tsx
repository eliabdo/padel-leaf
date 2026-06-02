import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { destroyAdminSession, getAdminSession } from "@/lib/session";
import AdminNav from "./admin-nav";
import { IdleGuard } from "./idle-guard";
import { sweepIfDue } from "@/lib/auto-complete";

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

  // Throttled inline sweep: any past-end confirmed booking auto-flips to
  // "completed" so admin always sees current state. Vercel Cron does the
  // same sweep every 5 min in production; this is the dev/preview safety
  // net + a no-cost catch-up on first admin pageload after downtime.
  // sweepIfDue() runs at most once per 60s per server instance.
  await sweepIfDue();

  const logoutForm = (
    <form action={logoutAction}>
      <button type="submit" style={{
        fontFamily: "system-ui, sans-serif", fontSize: 12, fontWeight: 500,
        color: "#6b7280", background: "none",
        border: "1px solid #e5e7eb", borderRadius: 8,
        padding: "6px 14px", cursor: "pointer",
        transition: "all 0.15s", width: "100%",
      }}>
        Sign out
      </button>
    </form>
  );

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f4f7f5" }}>

      {/* Top accent line */}
      <div style={{ height: 3, background: "linear-gradient(90deg, #15803d 0%, #4ade80 50%, #15803d 100%)", flexShrink: 0 }} />

      <IdleGuard />
      <AdminNav logoutForm={logoutForm} />

      <main style={{ flex: 1 }}>{children}</main>

      <style>{`
        /* ── Nav links ──────────────────────────────────────────── */
        .admin-nav-link { transition: background 0.15s, color 0.15s !important; }
        .admin-nav-link:hover  { background: rgba(22,163,74,0.09) !important; color: #15803d !important; }
        .admin-nav-link.active { background: rgba(22,163,74,0.13) !important; color: #15803d !important; font-weight: 700 !important; }

        /* ── Table rows ─────────────────────────────────────────── */
        tbody tr { transition: background 0.10s; }
        tbody tr:hover td { background: rgba(22,163,74,0.05) !important; }

        /* ── Cards hover lift ───────────────────────────────────── */
        .admin-card { transition: box-shadow 0.2s, transform 0.2s; }
        .admin-card:hover { box-shadow: 0 8px 28px rgba(0,0,0,0.09) !important; transform: translateY(-1px); }

        /* ── Inputs & selects focus ─────────────────────────────── */
        input:not([type=hidden]):not([type=checkbox]):not([type=radio]):focus,
        select:focus,
        textarea:focus {
          border-color: rgba(22,163,74,0.55) !important;
          box-shadow: 0 0 0 3px rgba(22,163,74,0.10) !important;
          outline: none !important;
        }

        /* ── Submit / primary buttons ───────────────────────────── */
        button[type=submit] { transition: filter 0.15s, transform 0.12s, box-shadow 0.15s !important; }
        button[type=submit]:hover:not(:disabled) {
          filter: brightness(1.07);
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(22,163,74,0.35) !important;
        }
        button[type=submit]:active:not(:disabled) { transform: translateY(0) scale(0.98); }

        /* ── Stat cards ──────────────────────────────────────────── */
        .admin-stat-card {
          transition: box-shadow 0.2s, transform 0.2s;
          cursor: default;
        }
        .admin-stat-card:hover {
          box-shadow: 0 10px 30px rgba(0,0,0,0.10) !important;
          transform: translateY(-2px);
        }

        /* ── "Manage →" / "View →" row-action links ─────────────── */
        .admin-row-action {
          transition: background 0.15s, border-color 0.15s, transform 0.12s !important;
        }
        .admin-row-action:hover {
          background: rgba(22,163,74,0.13) !important;
          border-color: rgba(22,163,74,0.45) !important;
          transform: translateY(-1px);
        }

        /* ── Logout button ───────────────────────────────────────── */
        form button[type=submit] {
          transition: background 0.15s, color 0.15s, border-color 0.15s !important;
        }
        form button[type=submit]:hover {
          background: rgba(22,163,74,0.07) !important;
          color: #15803d !important;
          border-color: rgba(22,163,74,0.30) !important;
          filter: none !important;
          transform: none !important;
          box-shadow: none !important;
        }

        /* ── Responsive ──────────────────────────────────────────── */
        .admin-desktop-nav  { display: flex !important; gap: 2px; }
        .admin-desktop-only { display: block !important; }
        .admin-mobile-only  { display: none !important; }

        /* Tables wrapped in overflowX: auto get momentum scroll on touch */
        main [style*="overflow-x: auto"],
        main [style*="overflowX"] { -webkit-overflow-scrolling: touch; }

        @media (max-width: 720px) {
          .admin-desktop-nav  { display: none !important; }
          .admin-desktop-only { display: none !important; }
          .admin-mobile-only  { display: flex !important; }

          /* Page wrapper — tighten side gutters and vertical padding */
          main > div { padding-left: 14px !important; padding-right: 14px !important; padding-top: 20px !important; padding-bottom: 24px !important; }

          /* Headings — admin h1 is fontSize:26 by default; bring to 22 on mobile */
          main h1 { font-size: 22px !important; }

          /* Stat cards: tighten padding so they fit nicely two-up at 375px */
          .admin-stat-card { padding: 16px 18px !important; }
          .admin-stat-card > div:last-child { font-size: 22px !important; }

          /* Forms — single column always */
          .admin-form-grid { grid-template-columns: 1fr !important; }

          /* Tab bars scroll horizontally */
          .admin-tabs-bar  { overflow-x: auto; -webkit-overflow-scrolling: touch; }
          .admin-tabs-bar button,
          .admin-tabs-bar a { flex-shrink: 0; }

          /* Subtle visual cue that tables can be horizontally scrolled */
          main [style*="overflow-x: auto"]:has(table),
          main [style*="overflowX"]:has(table) {
            position: relative;
            background-image: linear-gradient(to right, transparent calc(100% - 24px), rgba(13,32,16,0.08));
            background-attachment: local;
            background-size: 100% 100%;
            background-repeat: no-repeat;
          }

          /* Inputs at min 16px to stop iOS Safari zooming on focus */
          input:not([type=hidden]), select, textarea { font-size: 16px !important; }

          /* Buttons / links — meet 44px touch target */
          button[type=submit] { min-height: 44px; }
          .admin-row-action { min-height: 36px; display: inline-flex !important; align-items: center; }
        }

        @media (max-width: 420px) {
          /* On the smallest phones, stat cards drop to one column */
          main > div > div[style*="grid-template-columns: repeat(auto-fit"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
