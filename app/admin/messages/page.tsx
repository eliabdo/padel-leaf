import { db, schema } from "@/lib/db";
import { desc } from "drizzle-orm";

export const metadata = { title: "Admin · Messages" };
export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  const messages = await db.select().from(schema.contactMessages).orderBy(desc(schema.contactMessages.createdAt)).limit(200);

  return (
    <div style={{ maxWidth: 840, margin: "0 auto", padding: "36px 28px" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: "#16a34a", marginBottom: 6, fontFamily: "system-ui, sans-serif" }}>Inbox</div>
        <h1 style={{ fontFamily: "system-ui, sans-serif", fontSize: 26, fontWeight: 700, color: "#0d2010", margin: 0 }}>Messages</h1>
      </div>

      {messages.length === 0 && (
        <div style={{ background: "#fff", border: "1px solid rgba(22,163,74,0.12)", borderRadius: 14, padding: "56px 24px", textAlign: "center", color: "#9ca3af", fontFamily: "system-ui, sans-serif" }}>
          No messages yet.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {messages.map((m) => (
          <div key={m.id} style={{ background: "#fff", border: "1px solid rgba(22,163,74,0.12)", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)" }}>
            {/* Header strip */}
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "16px 22px", background: "#fafdfb", borderBottom: "1px solid rgba(22,163,74,0.08)" }}>
              <div>
                <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 15, fontWeight: 700, color: "#0d2010" }}>{m.name}</div>
                <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: "#6b7280", marginTop: 3 }}>
                  {m.email}{m.phone ? ` · ${m.phone}` : ""}
                </div>
              </div>
              <div style={{ fontFamily: "ui-monospace, 'SF Mono', monospace", fontSize: 11, color: "#9ca3af" }}>
                {new Date(m.createdAt).toLocaleString()}
              </div>
            </div>
            {/* Body */}
            <div style={{ padding: "18px 22px" }}>
              <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, color: "#374151", lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap" }}>
                {m.message}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
