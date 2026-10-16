import { redirect } from "next/navigation";
import type { Metadata } from "next";
import ProfileForm from "@/components/social/ProfileForm";
import { currentUser } from "@/lib/server/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Edit profile" };

export default async function EditProfile({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const u = await currentUser();
  if (!u) redirect("/login");
  const { welcome } = await searchParams;
  return (
    <div style={{ maxWidth: 640, margin: "8px auto 0" }}>
      <header className="page-head" style={{ paddingTop: 16 }}>
        <h1>{welcome ? `Welcome, ${u.name.split(" ")[0]}!` : "Edit profile"}</h1>
        <p>{welcome ? "Add a photo and a short bio so other builders know what you work on." : "Update how you appear on RoboHub."}</p>
      </header>
      <ProfileForm user={{ handle: u.handle, name: u.name, bio: u.bio, location: u.location, website: u.website, avatar: u.avatar, banner: u.banner }} />
    </div>
  );
}
