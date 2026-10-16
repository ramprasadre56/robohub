import { createSession, rateLimit, sameOrigin, verifyPassword } from "@/lib/server/auth";
import { store } from "@/lib/server/store";
import { fail, json } from "@/lib/server/http";

export async function POST(req: Request) {
  if (!(await sameOrigin())) return fail("Cross-site request blocked", 403);
  const b = await req.json().catch(() => ({}));
  const id = String(b.identifier ?? "").trim().replace(/^@/, "").toLowerCase();
  const password = String(b.password ?? "");
  if (!rateLimit(`login:${id}`, 8, 15 * 60_000)) return fail("Too many attempts. Try again in 15 minutes.", 429);
  const u = await (await store()).findLogin(id);
  if (!u || !verifyPassword(password, u.password_hash)) return fail("Wrong email/handle or password", 401);
  await createSession(u.id);
  return json({ ok: true, handle: u.handle });
}
