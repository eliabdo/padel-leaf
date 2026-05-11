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
const SESSION_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export async function verifyAdminPassword(password: string): Promise<boolean> {
  const raw = process.env.ADMIN_PASSWORD_HASH;
  if (!raw) {
    console.error("ADMIN_PASSWORD_HASH is not set");
    return false;
  }
  // The hash is base64-encoded in .env.local to prevent dotenv-expand from
  // mangling the $ characters that are part of every bcrypt hash.
  const hash = Buffer.from(raw, "base64").toString("utf8");
  return bcrypt.compare(password, hash);
}

export async function createAdminSession(): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TIMEOUT_MS);

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

/** Extend the current session by another 5 minutes (called on user activity). */
export async function touchAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return false;

  const newExpiry = new Date(Date.now() + SESSION_TIMEOUT_MS);

  const result = await db
    .update(schema.adminSessions)
    .set({ expiresAt: newExpiry })
    .where(
      and(
        eq(schema.adminSessions.token, token),
        gt(schema.adminSessions.expiresAt, new Date()),
      ),
    );

  if (!result.rowCount) return false;

  // Refresh the cookie expiry too
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: newExpiry,
    path: "/",
  });

  return true;
}

export async function destroyAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.delete(schema.adminSessions).where(eq(schema.adminSessions.token, token));
  }
  cookieStore.delete(SESSION_COOKIE);
}
