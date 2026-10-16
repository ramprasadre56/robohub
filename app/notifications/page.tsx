import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Heart, Repeat2, UserPlus, MessageCircle, AtSign, Quote } from "lucide-react";
import SocialLayout from "@/components/social/SocialLayout";
import Avatar from "@/components/social/Avatar";
import PostCard from "@/components/social/PostCard";
import MarkRead from "@/components/social/MarkRead";
import { notifications, unreadCount } from "@/lib/server/social";
import { viewer as getViewer } from "@/lib/server/viewer";
import { timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Notifications" };

const META: Record<string, { icon: typeof Heart; cls: string; text: string }> = {
  like: { icon: Heart, cls: "like", text: "liked your post" },
  repost: { icon: Repeat2, cls: "repost", text: "reposted your post" },
  follow: { icon: UserPlus, cls: "follow", text: "followed you" },
  reply: { icon: MessageCircle, cls: "", text: "replied" },
  mention: { icon: AtSign, cls: "", text: "mentioned you" },
  quote: { icon: Quote, cls: "", text: "quoted your post" },
};

export default async function NotificationsPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  const [items, unread] = await Promise.all([notifications(viewer.id), unreadCount(viewer.id)]);
  return (
    <SocialLayout>
      <MarkRead unread={unread} />
      <header className="feed-head"><div className="head-row"><strong style={{ fontSize: 20 }}>Notifications</strong></div></header>
      {!items.length && <p className="empty muted">Nothing yet. When people like, repost, reply to or follow you, you&apos;ll see it here.</p>}
      {items.map((n) => {
        const m = META[n.type] ?? META.reply;
        if ((n.type === "reply" || n.type === "mention" || n.type === "quote") && n.post) {
          return <div key={n.id} className={n.read ? "" : "unread"}><PostCard post={n.post} viewer={viewer} /></div>;
        }
        const Icon = m.icon;
        return (
          <div key={n.id} className={`notif ${n.read ? "" : "unread"}`}>
            <Icon size={26} className={`notif-icon ${m.cls}`} fill={m.cls === "like" ? "currentColor" : "none"} />
            <div style={{ minWidth: 0 }}>
              <Link href={`/u/${n.actor.handle}`}><Avatar name={n.actor.name} src={n.actor.avatar} size={32} /></Link>
              <p style={{ marginTop: 6 }}>
                <Link href={`/u/${n.actor.handle}`}><strong>{n.actor.name}</strong></Link> {m.text} <span className="muted small">· {timeAgo(n.createdAt)}</span>
              </p>
              {n.post && <Link href={`/u/${viewer.handle}/status/${n.post.id}`} className="muted notif-snippet">{n.post.text || "(photo)"}</Link>}
            </div>
          </div>
        );
      })}
    </SocialLayout>
  );
}
