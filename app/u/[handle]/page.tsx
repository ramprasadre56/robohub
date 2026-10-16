import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, BadgeCheck, CalendarDays, Link2, MapPin } from "lucide-react";
import SocialLayout from "@/components/social/SocialLayout";
import Avatar from "@/components/social/Avatar";
import FollowButton from "@/components/social/FollowButton";
import PostList from "@/components/social/PostList";
import RichText from "@/components/social/RichText";
import { profile, userPosts } from "@/lib/server/social";
import { viewer as getViewer } from "@/lib/server/viewer";
import { compact } from "@/lib/format";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ handle: string }>; searchParams: Promise<{ tab?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const p = await profile(handle, null);
  return { title: p ? `${p.name} (@${p.handle})` : "Profile" };
}

const TABS = [["posts", "Posts"], ["replies", "Replies"], ["media", "Media"], ["likes", "Likes"]] as const;

export default async function ProfilePage({ params, searchParams }: Props) {
  const { handle } = await params;
  const { tab: t } = await searchParams;
  const viewer = await getViewer();
  const p = await profile(handle, viewer?.id ?? null);
  if (!p) notFound();
  const tab = (TABS.find(([k]) => k === t)?.[0] ?? "posts") as (typeof TABS)[number][0];
  const posts = await userPosts(p.id, tab, viewer?.id ?? null);
  const self = viewer?.id === p.id;

  return (
    <SocialLayout>
      <header className="feed-head">
        <div className="head-row">
          <Link href="/feed" className="icon-btn" aria-label="Back"><ArrowLeft size={20} /></Link>
          <div><strong style={{ fontSize: 19 }}>{p.name}</strong><div className="muted small">{compact(p.posts)} posts</div></div>
        </div>
      </header>
      <div className="profile-banner" style={p.banner ? { backgroundImage: `url(${p.banner})` } : undefined} />
      <div className="profile-top">
        <div className="profile-av"><Avatar name={p.name} src={p.avatar} size={120} /></div>
        <div style={{ marginLeft: "auto", paddingTop: 12 }}>
          {self ? <Link className="btn" href="/settings/profile">Edit profile</Link>
            : <FollowButton handle={p.handle} initial={!!p.viewer_follows} signedIn={!!viewer} />}
        </div>
      </div>
      <div className="profile-info">
        <h1>{p.name} {p.verified ? <BadgeCheck size={20} className="verified" /> : null}</h1>
        <div className="muted">@{p.handle} {p.follows_viewer && !self ? <span className="pill" style={{ marginLeft: 6 }}>Follows you</span> : null}</div>
        {p.bio && <p className="profile-bio"><RichText text={p.bio} /></p>}
        <div className="row-meta" style={{ marginTop: 10 }}>
          {p.location && <span><MapPin size={15} /> {p.location}</span>}
          {p.website && <a className="rt-link" href={p.website} target="_blank" rel="noreferrer nofollow"><Link2 size={15} /> {p.website.replace(/^https?:\/\//, "")}</a>}
          <span><CalendarDays size={15} /> Joined {new Date(p.created_at).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</span>
        </div>
        <div className="follow-counts">
          <span><strong>{compact(p.following)}</strong> <span className="muted">Following</span></span>
          <span><strong>{compact(p.followers)}</strong> <span className="muted">Followers</span></span>
        </div>
      </div>
      <nav className="tabs x-tabs">
        {TABS.map(([k, label]) => (
          <Link key={k} href={`/u/${p.handle}${k === "posts" ? "" : `?tab=${k}`}`} className={`tab ${tab === k ? "active" : ""}`}>{label}</Link>
        ))}
      </nav>
      <PostList posts={posts} viewer={viewer} empty={self ? "You haven't posted here yet." : `@${p.handle} hasn't posted here yet.`} />
    </SocialLayout>
  );
}
