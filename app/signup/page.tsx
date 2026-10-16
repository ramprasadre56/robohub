import { redirect } from "next/navigation";
import type { Metadata } from "next";
import AuthForm from "@/components/social/AuthForm";
import { currentUser } from "@/lib/server/auth";
import { googleEnabled } from "@/lib/server/google";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Create account" };

export default async function SignupPage() {
  if (await currentUser()) redirect("/feed");
  return <AuthForm mode="signup" google={googleEnabled()} />;
}
