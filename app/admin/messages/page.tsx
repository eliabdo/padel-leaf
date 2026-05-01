import { db, schema } from "@/lib/db";
import { desc } from "drizzle-orm";

export const metadata = { title: "Admin · Messages" };
export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  const messages = await db
    .select()
    .from(schema.contactMessages)
    .orderBy(desc(schema.contactMessages.createdAt))
    .limit(200);

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="font-serif text-4xl text-forest-deep mb-8">Messages</h1>

      {messages.length === 0 && (
        <div className="bg-cream rounded-2xl border border-forest/15 p-10 text-center text-char-soft">
          No messages yet.
        </div>
      )}

      <div className="space-y-4">
        {messages.map((m) => (
          <div key={m.id} className="bg-cream rounded-2xl border border-forest/15 p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-4 mb-3">
              <div>
                <div className="font-serif text-xl text-forest-deep">{m.name}</div>
                <div className="text-sm text-char-soft">{m.email}{m.phone ? ` · ${m.phone}` : ""}</div>
              </div>
              <div className="text-xs text-char-soft">
                {new Date(m.createdAt).toLocaleString()}
              </div>
            </div>
            <p className="whitespace-pre-wrap text-charcoal leading-relaxed">{m.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
