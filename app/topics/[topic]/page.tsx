import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Hash } from "lucide-react";
import { Composer, PostCard } from "@/components/Feed";
import { listPosts, TOPICS } from "@/lib/feed";
import { hackathons, events, dateRange, formatDate } from "@/lib/data";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ topic: string }>; searchParams: Promise<{ sort?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { topic } = await params;
  return { title: TOPICS[topic] ? `# ${TOPICS[topic].name}` : "Topic" };
}

export default async function TopicPage({ params, searchParams }: Props) {
  const { topic } = await params;
  const { sort } = await searchParams;
  const t = TOPICS[topic];
  if (!t) notFound();
  const mode = sort === "top" ? "top" : "latest";
  const posts = await listPosts(topic, mode);

  return (
    <div className="feed-layout">
      <section className="feed-col">
        <header className="feed-head">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="module-num"><Hash size={22} /></div>
            <div>
              <h1 style={{ fontSize: 24 }}>{t.name}</h1>
              <p className="muted small">{posts.length} posts</p>
            </div>
          </div>
          <nav className="tabs" style={{ marginBottom: 0, marginTop: 12 }}>
            <Link href={`/topics/${topic}`} className={`tab ${mode === "latest" ? "active" : ""}`}>Latest</Link>
            <Link href={`/topics/${topic}?sort=top`} className={`tab ${mode === "top" ? "active" : ""}`}>Top</Link>
          </nav>
        </header>

        <Composer topic={topic} placeholder={`What's happening in ${t.name.toLowerCase()}?`} />

        <div>
          {posts.map((p) => <PostCard key={p.id} post={p} topic={topic} />)}
        </div>
      </section>

      <aside className="feed-side">
        <div className="panel">
          <h3>About # {t.name}</h3>
          <p className="muted">{t.about}</p>
          <p className="muted small" style={{ marginTop: 10 }}>Be kind, stay on topic, no spam. Posts are public.</p>
        </div>
        <div className="panel">
          <h3>Open hackathons</h3>
          <div style={{ display: "grid", gap: 14 }}>
            {hackathons.filter((h) => h.status === "open").map((h) => (
              <Link key={h.slug} href={`/hackathons/${h.slug}`}>
                <div style={{ fontWeight: 600 }}>{h.title}</div>
                <div className="muted small">{dateRange(h.start, h.end)} · {h.prize}</div>
              </Link>
            ))}
          </div>
        </div>
        <div className="panel">
          <h3>Coming up</h3>
          <div style={{ display: "grid", gap: 14 }}>
            {events.slice(0, 3).map((e) => (
              <Link key={e.title} href="/events">
                <div style={{ fontWeight: 600 }}>{e.title}</div>
                <div className="muted small">{formatDate(e.date)} · {e.location}</div>
              </Link>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
