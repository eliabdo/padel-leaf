/**
 * Lean admin session — random server-stored token in HTTP-only cookie.
 * No NextAuth needed for v1 (one user, one password).
 */
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { db, schema } from "./db";
import { eq, gt, and } from "drizzle-orm";
import bcrypt from "bcryptjs";

const SESSION_COOKIE = "pl_admin_session";
const SESSION_DURATION_DAYS = 14;

export async function verifyAdminPassword(password: string): Promise<boolean> {
  const hash = process.env.ADMIN_PASSWORD_HASH;
  // #region agent log
  fetch("http://127.0.0.1:7589/ingest/dca80672-932e-4ef8-bfcb-5f2627301044",{method:"POST",headers:{"Content-Type":"application/json","X-Debug-Session-Id":"e69d34"},body:JSON.stringify({sessionId:"e69d34",runId:"admin-login-debug-1",hypothesisId:"H1",location:"lib/session.ts:16",message:"verifyAdminPassword input + env shape",data:{passwordLength:password.length,hasHash:Boolean(hash),hashLength:hash?.length ?? 0,hashPrefix:hash?.slice(0,4) ?? null,hashHasEquals:hash?.includes("=") ?? false,hashHasWhitespace:(hash?.trim() ?? "")!== (hash ?? "")},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  if (!hash) {
    console.error("ADMIN_PASSWORD_HASH is not set");
    return false;
  }
  const result = await bcrypt.compare(password, hash);
  // #region agent log
  fetch("http://127.0.0.1:7589/ingest/dca80672-932e-4ef8-bfcb-5f2627301044",{method:"POST",headers:{"Content-Type":"application/json","X-Debug-Session-Id":"e69d34"},body:JSON.stringify({sessionId:"e69d34",runId:"admin-login-debug-1",hypothesisId:"H2",location:"lib/session.ts:24",message:"bcrypt comparison result",data:{match:result},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  return result;
}

export async function createAdminSession(): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);

  await db.insert(schema.adminSessions).values({ token, expiresAt });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

export async function getAdminSession(): Promise<{ valid: boolean }> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return { valid: false };

  const rows = await db
    .select()
    .from(schema.adminSessions)
    .where(
      and(
        eq(schema.adminSessions.token, token),
        gt(schema.adminSessions.expiresAt, new Date()),
      ),
    )
    .limit(1);

  return { valid: rows.length > 0 };
}

export async function destroyAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.delete(schema.adminSessions).where(eq(schema.adminSessions.token, token));
  }
  cookieStore.delete(SESSION_COOKIE);
}
