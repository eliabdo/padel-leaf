import { redirect } from "next/navigation";
import { asc, desc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { formatDateLong, formatTime } from "@/lib/booking";

export const metadata = { title: "Admin · Block-outs" };
export const dynamic = "force-dynamic";

async function createBlockOut(formData: FormData): Promise<void> {
  "use server";
  const courtId = Number(formData.get("courtId"));
  const startsAt = new Date(String(formData.get("startsAt")));
  const endsAt = new Date(String(formData.get("endsAt")));
  const reason = String(formData.get("reason") ?? "").trim() || "Maintenance";
  if (!courtId || isNaN(startsAt.getTime()) || isNaN(endsAt.getTime())) {
    throw new Error("Missing fields");
  }
  await db.insert(schema.blockOuts).values({ courtId, startsAt, endsAt, reason });
  redirect("/admin/block-outs");
}

async function deleteBlockOut(formData: FormData): Promise<void> {
  "use server";
  const id = Number(formData.get("id"));
  if (!id) return;
  await db.delete(schema.blockOuts).where(eq(schema.blockOuts.id, id));
  redirect("/admin/block-outs");
}

export default async function AdminBlockOutsPage() {
  const [courts, items] = await Promise.all([
    db.select().from(schema.courts).orderBy(asc(schema.courts.sortOrder)),
    db.select({
      id: schema.blockOuts.id,
      courtName: schema.courts.name,
      startsAt: schema.blockOuts.startsAt,
      endsAt:   schema.blockOuts.endsAt,
      reason:   schema.blockOuts.reason,
      createdAt: schema.blockOuts.createdAt,
    })
    .from(schema.blockOuts)
    .innerJoin(schema.courts, eq(schema.blockOuts.courtId, schema.courts.id))
    .orderBy(desc(schema.blockOuts.startsAt))
    .limit(100),
  ]);

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-10">
      <h1 className="font-serif text-4xl text-forest-deep">Block-outs</h1>

      <form action={createBlockOut} className="bg-cream rounded-2xl border border-forest/15 p-6 space-y-4">
        <h2 className="font-serif text-xl text-forest-deep mb-2">New block-out</h2>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>Court</Label>
            <select name="courtId" required className="w-full px-4 py-3 rounded-lg border border-forest/20 bg-cream">
              {courts.map((c) => (
                <option key={c.id} value={c.id}>Court · {c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Reason</Label>
            <input name="reason" placeholder="Maintenance / Rain / Tournament" className="w-full px-4 py-3 rounded-lg border border-forest/20 bg-cream" />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>Starts at</Label>
            <input name="startsAt" type="datetime-local" required className="w-full px-4 py-3 rounded-lg border border-forest/20 bg-cream" />
          </div>
          <div>
            <Label>Ends at</Label>
            <input name="endsAt"   type="datetime-local" required className="w-full px-4 py-3 rounded-lg border border-forest/20 bg-cream" />
          </div>
        </div>

        <button className="btn btn-primary">Add block-out</button>
      </form>

      <div className="bg-cream rounded-2xl border border-forest/15 overflow-hidden">
        <div className="px-6 py-4 border-b border-forest/10">
          <h2 className="font-serif text-xl text-forest-deep">Active & past block-outs</h2>
        </div>
        {items.length === 0 ? (
          <div className="p-10 text-center text-char-soft">No block-outs.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-cream-deep text-xs uppercase tracking-wider text-char-soft">
              <tr><Th>Court</Th><Th>When</Th><Th>Reason</Th><Th></Th></tr>
            </thead>
            <tbody>
              {items.map((b) => (
                <tr key={b.id} className="border-t border-forest/10">
                  <Td>Court {b.courtName}</Td>
                  <Td>
                    <div>{formatDateLong(new Date(b.startsAt))}</div>
                    <div className="text-char-soft text-xs">
                      {formatTime(new Date(b.startsAt))} — {formatTime(new Date(b.endsAt))}
                    </div>
                  </Td>
                  <Td>{b.reason}</Td>
                  <Td>
                    <form action={deleteBlockOut}>
                      <input type="hidden" name="id" value={b.id} />
                      <button className="text-clay hover:underline text-sm">Remove</button>
                    </form>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-xs uppercase tracking-[0.18em] text-forest font-semibold mb-2">{children}</div>;
}
function Th({ children }: { children?: React.ReactNode }) {
  return <th className="px-4 py-3 text-left font-semibold">{children}</th>;
}
function Td({ children }: { children?: React.ReactNode }) {
  return <td className="px-4 py-3 align-top">{children}</td>;
}
