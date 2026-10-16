import { NextResponse } from "next/server";
import { currentUser, rateLimit, sameOrigin, type User } from "./auth";

export const json = (data: unknown, status = 200) => NextResponse.json(data, { status });
export const fail = (message: string, status = 400) => NextResponse.json({ error: message }, { status });

/** Wraps a mutating handler: same-origin check, signed-in user, rate limit, error → JSON. */
export async function mutate(
  bucket: string,
  limit: [number, number],
  fn: (user: User) => Promise<Response> | Response
) {
  if (!(await sameOrigin())) return fail("Cross-site request blocked", 403);
  const user = await currentUser();
  if (!user) return fail("Please sign in", 401);
  if (!rateLimit(`${bucket}:${user.id}`, limit[0], limit[1])) return fail("You're doing that too fast — try again in a minute", 429);
  try {
    return await fn(user);
  } catch (e) {
    return fail((e as Error).message || "Something went wrong");
  }
}
