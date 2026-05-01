import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { asc } from "drizzle-orm";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET() {
  const courts = await db
    .select()
    .from(schema.courts)
    .orderBy(asc(schema.courts.sortOrder));
  return NextResponse.json(courts, { headers: CORS });
}
