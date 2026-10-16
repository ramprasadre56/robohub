import Link from "next/link";
import type { ReactNode } from "react";
import { Search } from "lucide-react";
import { currentUser } from "@/lib/server/auth";
import { trending, whoToFollow } from "@/lib/server/social";
import { hackathons, dateRange } from "@/lib/data";
import UserRow from "./UserRow";

export default async function SocialLayout({ children, hideSearch }: { children: ReactNode; hideSearch?: boolean }) {
  const viewer = await currentUser();
  const [tags, suggest] = await Promise.all([trending(6), whoToFollow(viewer?.id ?? null, 3)]);
  return (
    <div className="feed-layout">
      <section className="feed-col">{children}</section>
      <aside className="feed-side">
        {!hideSearch && (
          <form action="/explore" className="search rail-search" role="search">
            <Search size={18} /><input name="q" placeholder="Search RoboHub" aria-label="Search posts and people" />
          </form>
        )}
        {!viewer && (
          <div className="panel">
            <h3>New to RoboHub?</h3>
            <p className="muted">Sign up to post your builds, follow robot makers and join hackathon teams.</p>
            <Link className="btn primary block" href="/signup" style={{ marginTop: 12 }}>Create account</Link>
          </div>
        )}
        <div className="panel rail-panel">
          <h3>What&apos;s happening</h3>
          {tags.length === 0 && <p className="muted small">No trending tags yet — start one!</p>}
          {tags.map((t, i) => (
            <Link key={t.tag} href={`/hashtag/${t.tag}`} className="trend">
              <span className="muted small">{i + 1} · Trending in Robotics</span>
              <strong>#{t.tag}</strong>
              <span className="muted small">{t.n} post{t.n === 1 ? "" : "s"}</span>
            </Link>
          ))}
          <Link href="/explore" className="link small" style={{ display: "block", marginTop: 10 }}>Show more</Link>
        </div>
        {suggest.length > 0 && (
          <div className="panel rail-panel">
            <h3>Who to follow</h3>
            {suggest.map((u) => <UserRow key={u.id} user={u} signedIn={!!viewer} compact />)}
          </div>
        )}
        <div className="panel rail-panel">
          <h3>Open hackathons</h3>
          {hackathons.filter((h) => h.status === "open").map((h) => (
            <Link key={h.slug} href={`/hackathons/${h.slug}`} className="trend">
              <strong>{h.title}</strong>
              <span className="muted small">{dateRange(h.start, h.end)} · {h.prize}</span>
            </Link>
          ))}
        </div>
      </aside>
    </div>
  );
}
