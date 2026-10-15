import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { Composer, PostCard } from "@/components/Feed";
import { getThread, TOPICS } from "@/lib/feed";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ topic: string; id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const thread = await getThread(id).catch(() => null);
  return { title: thread ? `${thread.post.author}: “${thread.post.text.slice(0, 60)}”` : "Post" };
}

export default async function ThreadPage({ params }: Props) {
  const { topic, id } = await params;
  if (!TOPICS[topic]) notFound();
  const thread = await getThread(id);
  if (!thread) notFound();

  return (
    <div className="feed-layout">
      <section className="feed-col">
        <header className="feed-head">
          <Link href={`/topics/${topic}`} className="link"><ArrowLeft size={16} /> # {TOPICS[topic].name}</Link>
        </header>
        <PostCard post={thread.post} topic={topic} asThread />
        <Composer topic={topic} parentId={thread.post.id} placeholder="Post your reply" compact />
        {thread.replies.length === 0 && (
          <p className="muted" style={{ padding: "24px 16px" }}>No replies yet — start the discussion.</p>
        )}
        {thread.replies.map((r) => <PostCard key={r.id} post={r} topic={topic} />)}
      </section>
    </div>
  );
}
