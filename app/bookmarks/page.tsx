import { redirect } from "next/navigation";
import type { Metadata } from "next";
import SocialLayout from "@/components/social/SocialLayout";
import PostList from "@/components/social/PostList";
import { bookmarks } from "@/lib/server/social";
import { viewer as getViewer } from "@/lib/server/viewer";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Bookmarks" };

export default async function BookmarksPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  return (
    <SocialLayout>
      <header className="feed-head"><div className="head-row"><div><strong style={{ fontSize: 20 }}>Bookmarks</strong><div className="muted small">@{viewer.handle}</div></div></div></header>
      <PostList posts={await bookmarks(viewer.id)} viewer={viewer} empty="Save posts for later — tap the bookmark icon on any post." />
    </SocialLayout>
  );
}
