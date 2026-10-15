"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Heart, MessageCircle, Share, BadgeCheck, ExternalLink } from "lucide-react";
import type { Post } from "@/lib/feed";

const NAME_KEY = "robohub-name";
const LIKED_KEY = "robohub-liked";

function readLocal(key: string) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function writeLocal(key: string, v: string) {
  try { localStorage.setItem(key, v); } catch {}
}

function timeAgo(ms: number) {
  const s = Math.max(1, Math.floor((Date.now() - ms) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60); if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24); if (d < 7) return `${d}d`;
  return new Date(ms).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("") || "?";
}
function hue(name: string) {
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360; return h;
}

export function Avatar({ name, official }: { name: string; official?: boolean }) {
  return (
    <div
      className="post-avatar"
      style={official ? undefined : { background: `hsl(${hue(name)} 55% 88%)`, color: `hsl(${hue(name)} 50% 28%)` }}
      aria-hidden
    >
      {official ? "R" : initials(name)}
    </div>
  );
}

function Linkified({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g);
  return (
    <>
      {parts.map((p, i) =>
        /^https?:\/\//.test(p) ? <a key={i} href={p} target="_blank" rel="noreferrer nofollow" className="link">{p}</a> : p
      )}
    </>
  );
}

export function Composer({ topic, parentId, placeholder, compact }: { topic: string; parentId?: string; placeholder: string; compact?: boolean }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [savedName, setSavedName] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const MAX = 500;

  useEffect(() => { const n = readLocal(NAME_KEY); if (n) { setSavedName(n); setName(n); } }, []);

  async function submit() {
    setErr("");
    const author = (savedName ?? name).trim();
    if (!author) { setErr("Add your name first"); return; }
    setBusy(true);
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ topic, author, text, parentId }),
    });
    setBusy(false);
    if (!res.ok) { setErr((await res.json()).error ?? "Something went wrong"); return; }
    if (!savedName) { writeLocal(NAME_KEY, author); setSavedName(author); }
    setText("");
    router.refresh();
  }

  const left = MAX - text.length;
  return (
    <div className={`composer ${compact ? "compact" : ""}`}>
      <Avatar name={savedName || name || "?"} />
      <div style={{ flex: 1, minWidth: 0 }}>
        {!savedName && (
          <input
            className="composer-name"
            placeholder="Your name"
            value={name}
            maxLength={40}
            onChange={(e) => setName(e.target.value)}
            aria-label="Your name"
          />
        )}
        {savedName && (
          <div className="muted small" style={{ marginBottom: 4 }}>
            Posting as <strong>{savedName}</strong> ·{" "}
            <button className="text-btn" onClick={() => { setSavedName(null); }}>change</button>
          </div>
        )}
        <textarea
          className="composer-text"
          placeholder={placeholder}
          value={text}
          rows={compact ? 2 : 3}
          maxLength={MAX}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && text.trim()) submit(); }}
        />
        <div className="composer-foot">
          <span className={`small ${left < 40 ? "warn" : "muted"}`}>{text.length ? `${left} left` : ""}</span>
          {err && <span className="small warn">{err}</span>}
          <button className="btn primary" disabled={busy || !text.trim()} onClick={submit}>
            {busy ? "Posting…" : parentId ? "Reply" : "Post"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function PostCard({ post, topic, asThread, children }: { post: Post; topic: string; asThread?: boolean; children?: ReactNode }) {
  const [likes, setLikes] = useState(post.likes);
  const [liked, setLiked] = useState(false);
  const [copied, setCopied] = useState(false);
  const href = `/topics/${topic}/post/${post.id}`;

  useEffect(() => {
    const set: string[] = JSON.parse(readLocal(LIKED_KEY) || "[]");
    setLiked(set.includes(post.id));
  }, [post.id]);

  async function toggleLike() {
    const delta = liked ? -1 : 1;
    setLiked(!liked); setLikes((n) => Math.max(0, n + delta));
    const set = new Set<string>(JSON.parse(readLocal(LIKED_KEY) || "[]"));
    delta === 1 ? set.add(post.id) : set.delete(post.id);
    writeLocal(LIKED_KEY, JSON.stringify([...set]));
    await fetch(`/api/posts/${post.id}/like`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ delta }) });
  }

  async function share() {
    try { await navigator.clipboard.writeText(location.origin + href); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  }

  const external = post.link?.startsWith("http");
  return (
    <article className={`post ${asThread ? "post-thread" : ""}`}>
      <Avatar name={post.author} official={post.official} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="post-head">
          <strong>{post.author}</strong>
          {post.official && <BadgeCheck size={16} color="var(--accent)" aria-label="Official" />}
          <span className="muted">· {timeAgo(post.createdAt)}</span>
        </div>
        {asThread ? (
          <p className="post-text big"><Linkified text={post.text} /></p>
        ) : (
          <Link href={href} className="post-text"><Linkified text={post.text} /></Link>
        )}
        {post.link && (
          external ? (
            <a href={post.link} target="_blank" rel="noreferrer" className="post-link">
              <ExternalLink size={14} /> {new URL(post.link).hostname.replace("www.", "")}
            </a>
          ) : (
            <Link href={post.link} className="post-link">Open on RoboHub →</Link>
          )
        )}
        <div className="post-actions">
          <Link href={href} className="post-action" aria-label="Replies"><MessageCircle size={18} /> {post.replyCount || ""}</Link>
          <button className={`post-action like ${liked ? "on" : ""}`} onClick={toggleLike} aria-pressed={liked} aria-label="Like">
            <Heart size={18} fill={liked ? "currentColor" : "none"} /> {likes || ""}
          </button>
          <button className="post-action" onClick={share} aria-label="Copy link"><Share size={18} /> {copied ? "Copied" : ""}</button>
        </div>
        {children}
      </div>
    </article>
  );
}
