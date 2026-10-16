import crypto from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { appUrl, googleEnabled } from "@/lib/server/google";

export async function GET() {
  if (!googleEnabled()) return NextResponse.redirect(new URL("/login?error=google_not_configured", appUrl()));
  const state = crypto.randomBytes(16).toString("hex");
  (await cookies()).set("rh_oauth_state", state, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 600 });
  const p = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: `${appUrl()}/api/auth/google/callback`,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });
  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${p}`);
}
