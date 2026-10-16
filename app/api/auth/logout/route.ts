import { destroySession, sameOrigin } from "@/lib/server/auth";
import { fail, json } from "@/lib/server/http";

export async function POST() {
  if (!(await sameOrigin())) return fail("Cross-site request blocked", 403);
  await destroySession();
  return json({ ok: true });
}
