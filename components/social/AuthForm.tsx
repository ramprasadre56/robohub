"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/format";

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
);

export default function AuthForm({ mode, google, error }: { mode: "login" | "signup"; google: boolean; error?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(error ?? "");
  const signup = mode === "signup";

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setErr("");
    const f = Object.fromEntries(new FormData(e.currentTarget));
    try {
      await api(signup ? "/api/auth/signup" : "/api/auth/login", { body: f });
      router.push(signup ? "/settings/profile?welcome=1" : "/feed");
      router.refresh();
    } catch (e) { setErr((e as Error).message); setBusy(false); }
  }

  return (
    <div className="auth-card">
      <div className="brand-logo" style={{ fontSize: 30 }}>robo<span>hub</span></div>
      <h1>{signup ? "Join RoboHub" : "Sign in to RoboHub"}</h1>
      <p className="muted">{signup ? "Share builds, learn from other robot makers, and find hackathon teammates." : "Welcome back, builder."}</p>

      {google ? (
        <a className="btn google" href="/api/auth/google"><GoogleIcon /> {signup ? "Sign up" : "Sign in"} with Google</a>
      ) : (
        <button className="btn google" disabled title="Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env.local to enable"><GoogleIcon /> Google sign-in (not configured yet)</button>
      )}
      <div className="or"><span>or</span></div>

      <form className="form" onSubmit={submit} style={{ maxWidth: "none" }}>
        {signup && (
          <>
            <div className="field"><label htmlFor="name">Name</label><input id="name" name="name" required maxLength={50} autoComplete="name" /></div>
            <div className="field">
              <label htmlFor="handle">Username</label>
              <div className="handle-input"><span>@</span><input id="handle" name="handle" required pattern="[A-Za-z0-9_]{3,15}" title="3–15 letters, numbers or _" autoComplete="username" /></div>
            </div>
            <div className="field"><label htmlFor="email">Email</label><input id="email" name="email" type="email" required autoComplete="email" /></div>
          </>
        )}
        {!signup && <div className="field"><label htmlFor="identifier">Email or username</label><input id="identifier" name="identifier" required autoComplete="username" /></div>}
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" required minLength={signup ? 8 : 1} autoComplete={signup ? "new-password" : "current-password"} />
          {signup && <span className="muted small">At least 8 characters.</span>}
        </div>
        {err && <p className="form-error" role="alert">{err}</p>}
        <button className="btn primary block" disabled={busy}>{busy ? "Please wait…" : signup ? "Create account" : "Sign in"}</button>
      </form>
      <p className="muted" style={{ marginTop: 18 }}>
        {signup ? <>Already have an account? <Link className="link" href="/login">Sign in</Link></> : <>New to RoboHub? <Link className="link" href="/signup">Create an account</Link></>}
      </p>
    </div>
  );
}
