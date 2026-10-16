import crypto from "node:crypto";
import { cookies, headers } from "next/headers";
import { store } from "./store";
import type { User } from "./types";

export type { User } from "./types";
export const SESSION_COOKIE = "rh_session";
const SESSION_DAYS = 30;

// ---------- passwords (scrypt) ----------
export function hashPassword(pw: string) {
  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(pw, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$${salt.toString("base64")}$${key.toString("base64")}`;
}
export function verifyPassword(pw: string, stored: string | null) {
  if (!stored) return false;
  const [, s, k] = stored.split("$");
  const key = crypto.scryptSync(pw, Buffer.from(s, "base64"), 64, { N: 16384, r: 8, p: 1 });
  const expected = Buffer.from(k, "base64");
  return expected.length === key.length && crypto.timingSafeEqual(expected, key);
}

// ---------- validation ----------
export const HANDLE_RE = /^[A-Za-z0-9_]{3,15}$/;
const RESERVED = new Set(["robohub", "admin", "settings", "explore", "home", "login", "signup", "api", "media", "feed", "notifications", "bookmarks"]);
export async function validateHandle(h: string) {
  if (!HANDLE_RE.test(h)) return "Handle must be 3–15 letters, numbers or _";
  if (RESERVED.has(h.toLowerCase())) return "That handle is reserved";
  if (await (await store()).handleTaken(h)) return "That handle is taken";
  return null;
}

// ---------- sessions ----------
const sha = (s: string) => crypto.createHash("sha256").update(s).digest("hex");

export async function createSession(userId: string) {
  const token = crypto.randomBytes(32).toString("base64url");
  const expires = Date.now() + SESSION_DAYS * 86400_000;
  await (await store()).createSession(sha(token), userId, expires);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", expires: new Date(expires),
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await (await store()).deleteSession(sha(token));
  jar.delete(SESSION_COOKIE);
}

/** Current signed-in user (memoised per request via the cookie value). */
export async function currentUser(): Promise<User | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return (await store()).sessionUser(sha(token));
}

export async function createUser(u: { handle: string; name: string; email: string; password?: string; googleSub?: string; avatar?: string | null }) {
  return (await store()).createUser({
    handle: u.handle, name: u.name, email: u.email.toLowerCase(),
    passwordHash: u.password ? hashPassword(u.password) : null, googleSub: u.googleSub ?? null, avatar: u.avatar ?? null,
  });
}

// ---------- request guards ----------
/** Blocks cross-site POSTs (CSRF) on top of SameSite=Lax cookies. */
export async function sameOrigin() {
  const h = await headers();
  const origin = h.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === (h.get("x-forwarded-host") ?? h.get("host"));
  } catch {
    return false;
  }
}

const buckets = new Map<string, number[]>();
/** Simple in-memory sliding-window rate limit (per server instance). */
export function rateLimit(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const arr = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (arr.length >= max) return false;
  arr.push(now);
  buckets.set(key, arr);
  return true;
}
