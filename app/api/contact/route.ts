import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, schema } from "@/lib/db";


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
