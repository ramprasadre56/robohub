import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSession, createUser, validateHandle } from "@/lib/server/auth";
import { store } from "@/lib/server/store";
import { appUrl, googleEnabled } from "@/lib/server/google";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const back = (e: string) => NextResponse.redirect(new URL(`/login?error=${e}`, appUrl()));
  if (!googleEnabled()) return back("google_not_configured");
  const jar = await cookies();
  const state = jar.get("rh_oauth_state")?.value;
  jar.delete("rh_oauth_state");
  if (!state || state !== url.searchParams.get("state")) return back("google_state");
  const code = url.searchParams.get("code");
  if (!code) return back("google_cancelled");

  const tok = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code, client_id: process.env.GOOGLE_CLIENT_ID!, client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${appUrl()}/api/auth/google/callback`, grant_type: "authorization_code",
    }),
  }).then((r) => r.json());
  if (!tok.access_token) return back("google_token");
  const info = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { authorization: `Bearer ${tok.access_token}` },
  }).then((r) => r.json()) as { sub: string; email?: string; email_verified?: boolean; name?: string; picture?: string };
  if (!info.sub) return back("google_profile");

  const s = await store();
  let userId = await s.findIdByGoogleSub(info.sub);
  if (!userId && info.email && info.email_verified) {
    userId = await s.findIdByEmail(info.email.toLowerCase());
    if (userId) await s.linkGoogle(userId, info.sub);
  }
  let isNew = false;
  if (!userId) {
    let base = (info.email?.split("@")[0] ?? "robot").replace(/[^A-Za-z0-9_]/g, "").slice(0, 11) || "robot";
    if (base.length < 3) base = base.padEnd(3, "0");
    let handle = base;
    for (let i = 0; i < 20 && (await validateHandle(handle)); i++) handle = `${base}${Math.floor(Math.random() * 9000 + 1000)}`;
    userId = await createUser({ name: info.name || handle, handle, email: info.email ?? `${info.sub}@google.local`, googleSub: info.sub, avatar: info.picture ?? null });
    isNew = true;
  }
  await createSession(userId);
  return NextResponse.redirect(new URL(isNew ? "/settings/profile?welcome=1" : "/feed", appUrl()));
}
