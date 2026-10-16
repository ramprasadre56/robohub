"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MessageCircle, Repeat2, Heart, Bookmark, Share, MoreHorizontal, BadgeCheck, Trash2, Link2, PenLine, ExternalLink,
} from "lucide-react";
import Avatar from "./Avatar";
import RichText from "./RichText";
import Modal from "./Modal";
import Composer, { type Viewer } from "./Composer";
import { api, compact, fullTime, timeAgo } from "@/lib/format";
import type { PostView } from "@/lib/server/social";

export default function PostCard({ post, viewer, focus }: { post: PostView; viewer: Viewer; focus?: boolean }) {
  const router = useRouter();
  const [liked, setLiked] = useState(post.viewer.liked);
  const [likes, setLikes] = useState(post.counts.likes);
  const [reposted, setReposted] = useState(post.viewer.reposted);
  const [reposts, setReposts] = useState(post.counts.reposts);
  const [saved, setSaved] = useState(post.viewer.bookmarked);
  const [menu, setMenu] = useState<null | "more" | "repost">(null);
  const [modal, setModal] = useState<null | "reply" | "quote">(null);
  const [toast, setToast] = useState("");
  const href = `/u/${post.author.handle}/status/${post.id}`;
  const mine = viewer?.id === post.author.id;

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(""), 1600); };
  const needAuth = () => { if (!viewer) { router.push("/login"); return true; } return false; };

  async function react(kind: "like" | "repost" | "bookmark", on: boolean, undo: () => void) {
    try { await api(`/api/posts/${post.id}/${kind}`, { body: { on } }); }
    catch (e) { undo(); flash((e as Error).message); }
  }
  const toggleLike = () => {
    if (needAuth()) return;
    const on = !liked; setLiked(on); setLikes((n) => n + (on ? 1 : -1));
    react("like", on, () => { setLiked(!on); setLikes((n) => n + (on ? -1 : 1)); });
  };
  const toggleRepost = () => {
    setMenu(null);
    const on = !reposted; setReposted(on); setReposts((n) => n + (on ? 1 : -1));
    react("repost", on, () => { setReposted(!on); setReposts((n) => n + (on ? -1 : 1)); });
  };
  const toggleSave = () => {
    if (needAuth()) return;
    const on = !saved; setSaved(on); flash(on ? "Added to bookmarks" : "Removed from bookmarks");
    react("bookmark", on, () => setSaved(!on));
  };
  async function copyLink() {
    setMenu(null);
    try { await navigator.clipboard.writeText(location.origin + href); flash("Link copied"); } catch { flash("Couldn't copy"); }
  }
  async function remove() {
    setMenu(null);
    if (!confirmDelete()) return;
    try { await api(`/api/posts/${post.id}/delete`, { method: "DELETE" }); flash("Post deleted"); router.refresh(); }
    catch (e) { flash((e as Error).message); }
  }
  // Inline confirm without blocking dialogs: second click within 3s confirms.
  const [armed, setArmed] = useState(false);
  function confirmDelete() {
    if (armed) return true;
    setArmed(true); setMenu("more"); setTimeout(() => setArmed(false), 3000);
    return false;
  }

  function openPost(e: React.MouseEvent) {
    if (focus) return;
    const t = e.target as HTMLElement;
    if (t.closest("a,button,img.zoomable,.menu,.modal-scrim")) return;
    if (window.getSelection()?.toString()) return;
    router.push(href);
  }

  if (post.deleted) {
    return <div className="post deleted muted">This post was deleted by its author.</div>;
  }

  return (
    <article className={`post ${focus ? "post-focus" : ""}`} onClick={openPost}>
      {post.repostedBy && (
        <div className="post-context"><Repeat2 size={14} /> <Link href={`/u/${post.repostedBy.handle}`}>{post.repostedBy.name} reposted</Link></div>
      )}
      <div className="post-row">
        <Link href={`/u/${post.author.handle}`} className="post-av"><Avatar name={post.author.name} src={post.author.avatar} size={focus ? 48 : 42} /></Link>
        <div className="post-main">
          <div className="post-head">
            <Link href={`/u/${post.author.handle}`} className="post-name">{post.author.name}</Link>
            {post.author.verified ? <BadgeCheck size={16} className="verified" aria-label="Verified" /> : null}
            <Link href={`/u/${post.author.handle}`} className="muted">@{post.author.handle}</Link>
            {!focus && <><span className="muted">·</span><Link href={href} className="muted" title={fullTime(post.createdAt)} suppressHydrationWarning>{timeAgo(post.createdAt)}</Link></>}
            <div className="menu-wrap">
              <button className="icon-btn sm" aria-label="More" onClick={() => setMenu(menu === "more" ? null : "more")}><MoreHorizontal size={18} /></button>
              {menu === "more" && (
                <div className="menu" onMouseLeave={() => setMenu(null)}>
                  {mine && <button className="danger" onClick={remove}><Trash2 size={16} /> {armed ? "Click again to delete" : "Delete"}</button>}
                  <button onClick={copyLink}><Link2 size={16} /> Copy link</button>
                  {!mine && <Link href={`/u/${post.author.handle}`}><PenLine size={16} /> View @{post.author.handle}</Link>}
                </div>
              )}
            </div>
          </div>

          {post.replyTo && post.replyToHandle && !focus && (
            <div className="muted small">Replying to <Link className="rt-link" href={`/u/${post.replyToHandle}`}>@{post.replyToHandle}</Link></div>
          )}

          {post.text && <div className={`post-text ${focus ? "big" : ""}`}><RichText text={post.text} /></div>}

          {post.images.length > 0 && (
            <div className={`media-grid n${post.images.length}`}>
              {post.images.map((src) => (
                <a key={src} href={src} target="_blank" rel="noreferrer" className="media-cell">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" loading="lazy" className="zoomable" />
                </a>
              ))}
            </div>
          )}

          {post.link && (
            post.link.startsWith("http")
              ? <a className="post-link" href={post.link} target="_blank" rel="noreferrer"><ExternalLink size={14} /> {new URL(post.link).hostname.replace("www.", "")}</a>
              : <Link className="post-link" href={post.link}>Open on RoboHub →</Link>
          )}

          {post.quote && (
            <Link href={`/u/${post.quote.author.handle}/status/${post.quote.id}`} className="quote-embed">
              {post.quote.deleted ? <span className="muted">This post is unavailable.</span> : (
                <>
                  <div className="post-head"><Avatar name={post.quote.author.name} src={post.quote.author.avatar} size={20} /><strong>{post.quote.author.name}</strong><span className="muted" suppressHydrationWarning>@{post.quote.author.handle} · {timeAgo(post.quote.createdAt)}</span></div>
                  {post.quote.text && <div className="quote-text">{post.quote.text}</div>}
                  {post.quote.images[0] && /* eslint-disable-next-line @next/next/no-img-element */ <img src={post.quote.images[0]} alt="" className="quote-img" />}
                </>
              )}
            </Link>
          )}

          {focus && <div className="post-time muted" suppressHydrationWarning>{fullTime(post.createdAt)}</div>}

          <div className={`post-actions ${focus ? "focus" : ""}`}>
            <button className="pa reply" aria-label="Reply" onClick={() => { if (!needAuth()) setModal("reply"); }}>
              <MessageCircle size={18} /> <span>{post.counts.replies ? compact(post.counts.replies) : ""}</span>
            </button>
            <div className="menu-wrap">
              <button className={`pa repost ${reposted ? "on" : ""}`} aria-label="Repost" onClick={() => { if (!needAuth()) setMenu(menu === "repost" ? null : "repost"); }}>
                <Repeat2 size={18} /> <span>{reposts ? compact(reposts) : ""}</span>
              </button>
              {menu === "repost" && (
                <div className="menu" onMouseLeave={() => setMenu(null)}>
                  <button onClick={toggleRepost}><Repeat2 size={16} /> {reposted ? "Undo repost" : "Repost"}</button>
                  <button onClick={() => { setMenu(null); setModal("quote"); }}><PenLine size={16} /> Quote</button>
                </div>
              )}
            </div>
            <button className={`pa like ${liked ? "on" : ""}`} aria-label="Like" aria-pressed={liked} onClick={toggleLike}>
              <Heart size={18} fill={liked ? "currentColor" : "none"} /> <span>{likes ? compact(likes) : ""}</span>
            </button>
            <button className={`pa save ${saved ? "on" : ""}`} aria-label="Bookmark" aria-pressed={saved} onClick={toggleSave}>
              <Bookmark size={18} fill={saved ? "currentColor" : "none"} />
            </button>
            <button className="pa" aria-label="Share" onClick={copyLink}><Share size={18} /></button>
          </div>
        </div>
      </div>

      {toast && <div className="toast" role="status">{toast}</div>}

      {modal && (
        <Modal onClose={() => setModal(null)} title={modal === "reply" ? "Reply" : "Quote"}>
          {modal === "reply" && (
            <div className="modal-parent">
              <Avatar name={post.author.name} src={post.author.avatar} size={40} />
              <div><strong>{post.author.name}</strong> <span className="muted">@{post.author.handle}</span><div className="quote-text">{post.text}</div></div>
            </div>
          )}
          <Composer
            viewer={viewer}
            replyTo={modal === "reply" ? post : undefined}
            quote={modal === "quote" ? post : undefined}
            placeholder={modal === "reply" ? "Post your reply" : "Add a comment"}
            autoFocus
            onDone={() => { setModal(null); flash(modal === "reply" ? "Reply sent" : "Quote posted"); }}
          />
        </Modal>
      )}
    </article>
  );
}
