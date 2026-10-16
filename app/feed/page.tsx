import Link from "next/link";
import type { Metadata } from "next";
import SocialLayout from "@/components/social/SocialLayout";
import Composer from "@/components/social/Composer";
import PostList from "@/components/social/PostList";
import NewPostsBanner from "@/components/social/NewPostsBanner";
import { forYou, following } from "@/lib/server/social";
import { viewer as getViewer } from "@/lib/server/viewer";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Home · # Robotics" };

export default async function FeedPage({ searchParams }: { searchParams: Promise<{ tab?: string; page?: string; before?: string }> }) {
  const sp = await searchParams;
  const viewer = await getViewer();
  const tab = sp.tab === "following" && viewer ? "following" : "for-you";
  const page = Math.max(0, Number(sp.page) || 0);
  const posts = tab === "following" ? await following(viewer!.id, Number(sp.before) || undefined) : await forYou(viewer?.id ?? null, page);
  const since = Date.now();
  const more = tab === "following"
    ? posts.length ? `/feed?tab=following&before=${posts[posts.length - 1].createdAt}` : null
    : posts.length === 20 ? `/feed?page=${page + 1}` : null;

  return (
    <SocialLayout>
      <header className="feed-head tabs-only">
        <nav className="tabs x-tabs">
          <Link href="/feed" className={`tab ${tab === "for-you" ? "active" : ""}`}>For you</Link>
          <Link href={viewer ? "/feed?tab=following" : "/login"} className={`tab ${tab === "following" ? "active" : ""}`}>Following</Link>
          <Link href="/hashtag/robotics" className="tab"># Robotics</Link>
        </nav>
      </header>
      <Composer viewer={viewer} />
      <NewPostsBanner tab={tab} since={since} />
      <PostList posts={posts} viewer={viewer} empty={tab === "following" ? "Follow some builders to fill your Following tab." : "No posts yet — be the first!"} />
      {more && <Link href={more} className="load-more">Show more posts</Link>}
    </SocialLayout>
  );
}
