import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import SocialLayout from "@/components/social/SocialLayout";
import Composer from "@/components/social/Composer";
import PostCard from "@/components/social/PostCard";
import PostList from "@/components/social/PostList";
import { thread } from "@/lib/server/social";
import { viewer as getViewer } from "@/lib/server/viewer";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ handle: string; id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const t = await thread(id, null).catch(() => null);
  return { title: t ? `${t.post.author.name}: “${t.post.text.slice(0, 60)}”` : "Post" };
}

export default async function StatusPage({ params }: Props) {
  const { id } = await params;
  const viewer = await getViewer();
  const t = await thread(id, viewer?.id ?? null);
  if (!t) notFound();
  return (
    <SocialLayout>
      <header className="feed-head">
        <div className="head-row"><Link href="/feed" className="icon-btn" aria-label="Back"><ArrowLeft size={20} /></Link><strong style={{ fontSize: 19 }}>Post</strong></div>
      </header>
      {t.ancestors.map((a) => <div key={a.id} className="ancestor"><PostCard post={a} viewer={viewer} /></div>)}
      <PostCard post={t.post} viewer={viewer} focus />
      {!t.post.deleted && <Composer viewer={viewer} replyTo={t.post} placeholder="Post your reply" compact />}
      <PostList posts={t.replies} viewer={viewer} empty="No replies yet." />
    </SocialLayout>
  );
}
