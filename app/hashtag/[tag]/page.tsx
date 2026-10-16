import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import SocialLayout from "@/components/social/SocialLayout";
import PostList from "@/components/social/PostList";
import { hashtagPosts } from "@/lib/server/social";
import { viewer as getViewer } from "@/lib/server/viewer";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ tag: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `#${(await params).tag}` };
}

export default async function HashtagPage({ params }: Props) {
  const { tag } = await params;
  const viewer = await getViewer();
  const posts = await hashtagPosts(tag, viewer?.id ?? null);
  return (
    <SocialLayout>
      <header className="feed-head">
        <div className="head-row"><Link href="/explore" className="icon-btn" aria-label="Back"><ArrowLeft size={20} /></Link>
          <div><strong style={{ fontSize: 19 }}>#{tag}</strong><div className="muted small">{posts.length} posts</div></div></div>
      </header>
      <PostList posts={posts} viewer={viewer} empty={`No posts with #${tag} yet. Use it in a post to start the conversation.`} />
    </SocialLayout>
  );
}
