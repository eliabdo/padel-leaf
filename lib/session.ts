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
  if (!hash) {
    console.error("ADMIN_PASSWORD_HASH is not set");
    return false;
  }
  return bcrypt.compare(password, hash);
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
