import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, schema } from "@/lib/db";

// #region agent log
fetch("http://127.0.0.1:7589/ingest/dca80672-932e-4ef8-bfcb-5f2627301044",{method:"POST",headers:{"Content-Type":"application/json","X-Debug-Session-Id":"e69d34"},body:JSON.stringify({sessionId:"e69d34",runId:"prebuild-sweep-1",hypothesisId:"H3",location:"app/api/contact/route.ts:5",message:"contact route module loaded",data:{hasDatabaseUrl:Boolean(process.env.DATABASE_URL)},timestamp:Date.now()})}).catch(()=>{});
// #endregion

const ContactSchema = z.object({
  name:    z.string().min(1).max(120),
  email:   z.string().email().max(200),
  phone:   z.string().max(40).optional().default(""),
  message: z.string().min(2).max(4000),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = ContactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  await db.insert(schema.contactMessages).values({
    name:    parsed.data.name,
    email:   parsed.data.email,
    phone:   parsed.data.phone || null,
    message: parsed.data.message,
  });

  return NextResponse.json({ ok: true });
}
