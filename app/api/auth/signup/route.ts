import { createSession, createUser, rateLimit, sameOrigin, validateHandle } from "@/lib/server/auth";
import { store } from "@/lib/server/store";
import { fail, json } from "@/lib/server/http";
import { headers } from "next/headers";

export async function POST(req: Request) {
  if (!(await sameOrigin())) return fail("Cross-site request blocked", 403);
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0] ?? "local";
  if (!rateLimit(`signup:${ip}`, 5, 3600_000)) return fail("Too many sign-ups from this network, try later", 429);
  const b = await req.json().catch(() => ({}));
  const name = String(b.name ?? "").trim();
  const handle = String(b.handle ?? "").trim().replace(/^@/, "");
  const email = String(b.email ?? "").trim().toLowerCase();
  const password = String(b.password ?? "");
  if (!name || name.length > 50) return fail("Enter your name (up to 50 characters)");
  const hErr = await validateHandle(handle);
  if (hErr) return fail(hErr);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("Enter a valid email");
  if (await (await store()).emailTaken(email)) return fail("An account with this email already exists");
  if (password.length < 8) return fail("Password must be at least 8 characters");
  const id = await createUser({ name, handle, email, password });
  await createSession(id);
  return json({ ok: true, handle }, 201);
}
