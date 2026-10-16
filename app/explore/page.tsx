import Link from "next/link";
import type { Metadata } from "next";
import { Search } from "lucide-react";
import SocialLayout from "@/components/social/SocialLayout";
import PostList from "@/components/social/PostList";
import UserRow from "@/components/social/UserRow";
import { searchPosts, searchUsers, trending, whoToFollow } from "@/lib/server/social";
import { viewer as getViewer } from "@/lib/server/viewer";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Explore" };

export default async function ExplorePage({ searchParams }: { searchParams: Promise<{ q?: string; f?: string }> }) {
  const { q = "", f } = await searchParams;
  const term = q.trim().slice(0, 100);
  const viewer = await getViewer();
  const people = f === "people";
  const enc = encodeURIComponent(term);
  const [tags, suggest, users, posts] = await Promise.all([
    term ? [] : trending(15),
    term ? [] : whoToFollow(viewer?.id ?? null, 10),
    term && people ? searchUsers(term, viewer?.id ?? null) : [],
    term && !people ? searchPosts(term, viewer?.id ?? null) : [],
  ]);

  return (
    <SocialLayout hideSearch>
      <header className="feed-head">
        <form className="search" action="/explore" role="search" style={{ margin: "4px 0 8px" }}>
          <Search size={18} /><input name="q" defaultValue={term} placeholder="Search posts, #hashtags, @people" aria-label="Search" autoFocus={!term} />
        </form>
        {term && (
          <nav className="tabs x-tabs">
            <Link href={`/explore?q=${enc}`} className={`tab ${!people ? "active" : ""}`}>Posts</Link>
            <Link href={`/explore?q=${enc}&f=people`} className={`tab ${people ? "active" : ""}`}>People</Link>
          </nav>
        )}
      </header>
      {!term ? (
        <>
          <h2 className="section-title">Trending in Robotics</h2>
          {tags.map((t, i) => (
            <Link key={t.tag} href={`/hashtag/${t.tag}`} className="trend big">
              <span className="muted small">{i + 1} · Trending</span><strong>#{t.tag}</strong><span className="muted small">{t.n} posts</span>
            </Link>
          ))}
          <h2 className="section-title">Builders to follow</h2>
          {suggest.map((u) => <UserRow key={u.id} user={u} signedIn={!!viewer} />)}
        </>
      ) : people ? (
        (users.length ? users.map((u) => <UserRow key={u.id} user={u} signedIn={!!viewer} isSelf={u.id === viewer?.id} />) : <p className="empty muted">No people match “{term}”.</p>)
      ) : (
        <PostList posts={posts} viewer={viewer} empty={`No posts match “${term}”.`} />
      )}
    </SocialLayout>
  );
}
