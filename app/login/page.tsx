import { redirect } from "next/navigation";
import type { Metadata } from "next";
import AuthForm from "@/components/social/AuthForm";
import { currentUser } from "@/lib/server/auth";
import { googleEnabled } from "@/lib/server/google";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Sign in" };

const ERRORS: Record<string, string> = {
  google_not_configured: "Google sign-in isn't set up yet. Use email and password for now.",
  google_state: "Google sign-in expired. Please try again.",
  google_cancelled: "Google sign-in was cancelled.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await currentUser()) redirect("/feed");
  const { error } = await searchParams;
  return <AuthForm mode="login" google={googleEnabled()} error={error ? ERRORS[error] ?? "Google sign-in failed. Please try again." : undefined} />;
}
