/**
 * Minimal admin auth: a single env-seeded credential.
 *
 * - Email + bcrypt-hashed password live in env vars.
 * - On successful login we mint a JWT signed with ADMIN_JWT_SECRET and
 *   set it as an HTTP-only `castellino_admin` cookie.
 * - middleware.ts checks the cookie before letting anything in /admin
 *   through.
 *
 * This is intentionally lightweight — one user, no DB user table, no
 * password reset flow. Sufficient for a single photographer-admin. If
 * Bob ever needs help-desk users or multiple roles, swap this for
 * next-auth + a User table.
 */

import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE = "castellino_admin";
const ALG = "HS256";
const ISSUER = "castellino-admin";
// 14-day session
const MAX_AGE_SECONDS = 60 * 60 * 24 * 14;

function getSecret(): Uint8Array {
  const s = process.env.ADMIN_JWT_SECRET;
  if (!s || s.length < 16) {
    throw new Error("ADMIN_JWT_SECRET is not set (or too short)");
  }
  return new TextEncoder().encode(s);
}

export function isAuthConfigured(): boolean {
  return (
    !!process.env.ADMIN_EMAIL &&
    !!process.env.ADMIN_PASSWORD_HASH &&
    !!process.env.ADMIN_JWT_SECRET
  );
}

export async function verifyCredentials(
  email: string,
  password: string,
): Promise<boolean> {
  if (!isAuthConfigured()) return false;
  const expected = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const got = email.trim().toLowerCase();
  if (expected !== got) return false;
  const hash = process.env.ADMIN_PASSWORD_HASH!;
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}

export async function mintToken(email: string): Promise<string> {
  return await new SignJWT({ sub: email })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<{ sub: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      issuer: ISSUER,
      algorithms: [ALG],
    });
    return { sub: String(payload.sub || "") };
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE);
}

export async function getSession(): Promise<{ email: string } | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  return payload ? { email: payload.sub } : null;
}

export const ADMIN_COOKIE_NAME = COOKIE;
