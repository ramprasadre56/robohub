"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, X, Loader2 } from "lucide-react";
import Avatar from "./Avatar";
import { api } from "@/lib/format";
import type { PostView } from "@/lib/server/social";

export type Viewer = { id: string; handle: string; name: string; avatar: string | null } | null;
const MAX = 500;

export default function Composer({
  viewer, replyTo, quote, placeholder = "What's happening in robotics?", onDone, autoFocus, compact,
}: {
  viewer: Viewer; replyTo?: PostView; quote?: PostView; placeholder?: string; onDone?: () => void; autoFocus?: boolean; compact?: boolean;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [images, setImages] = useState<{ id: string; url: string }[]>([]);
  const [uploading, setUploading] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  if (!viewer) {
    return (
      <div className="composer composer-guest">
        <p><strong>Join the robotics conversation.</strong> Sign up to post, reply and follow builders.</p>
        <div style={{ display: "flex", gap: 10 }}>
          <Link className="btn primary" href="/signup">Create account</Link>
          <Link className="btn" href="/login">Sign in</Link>
        </div>
      </div>
    );
  }

  async function addFiles(files: FileList | null) {
    if (!files) return;
    setErr("");
    const room = 4 - images.length;
    for (const f of [...files].slice(0, room)) {
      setUploading((n) => n + 1);
      try {
        const fd = new FormData(); fd.append("file", f);
        const res = await fetch("/api/media", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setImages((arr) => [...arr, data]);
      } catch (e) { setErr((e as Error).message); }
      finally { setUploading((n) => n - 1); }
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  async function submit() {
    setBusy(true); setErr("");
    try {
      await api("/api/posts", { body: { text, images: images.map((i) => i.id), replyTo: replyTo?.id, quoteOf: quote?.id } });
      setText(""); setImages([]);
      onDone?.();
      router.refresh();
    } catch (e) { setErr((e as Error).message); }
    finally { setBusy(false); }
  }

  const left = MAX - text.length;
  const pct = Math.min(1, text.length / MAX);
  const canPost = (text.trim() || images.length) && left >= 0 && !uploading && !busy;

  return (
    <div className={`composer ${compact ? "compact" : ""}`}>
      <Avatar name={viewer.name} src={viewer.avatar} size={42} />
      <div style={{ flex: 1, minWidth: 0 }}>
        {replyTo && <div className="muted small" style={{ marginBottom: 4 }}>Replying to <Link className="rt-link" href={`/u/${replyTo.author.handle}`}>@{replyTo.author.handle}</Link></div>}
        <textarea
          className="composer-text"
          placeholder={placeholder}
          value={text}
          autoFocus={autoFocus}
          rows={compact ? 2 : 3}
          onChange={(e) => { setText(e.target.value); e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }}
          onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && canPost) submit(); }}
          aria-label="Post text"
        />
        {images.length > 0 && (
          <div className={`media-grid n${images.length}`}>
            {images.map((im) => (
              <div key={im.id} className="media-cell">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={im.url} alt="" />
                <button className="media-remove" aria-label="Remove image" onClick={() => setImages((a) => a.filter((x) => x.id !== im.id))}><X size={16} /></button>
              </div>
            ))}
          </div>
        )}
        {quote && (
          <div className="quote-embed static">
            <div className="post-head"><Avatar name={quote.author.name} src={quote.author.avatar} size={20} /><strong>{quote.author.name}</strong><span className="muted">@{quote.author.handle}</span></div>
            <div className="quote-text">{quote.text}</div>
          </div>
        )}
        {err && <p className="form-error">{err}</p>}
        <div className="composer-foot">
          <div style={{ display: "flex", gap: 4, marginRight: "auto" }}>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" multiple hidden onChange={(e) => addFiles(e.target.files)} />
            <button className="tool-btn" onClick={() => fileRef.current?.click()} disabled={images.length >= 4 || uploading > 0} aria-label="Add photos" title="Add photos (up to 4)">
              {uploading ? <Loader2 size={20} className="spin" /> : <ImagePlus size={20} />}
            </button>
          </div>
          {text.length > 0 && (
            <span className={`ring ${left < 0 ? "over" : left < 30 ? "warn" : ""}`} style={{ ["--p" as string]: `${pct * 360}deg` }} title={`${left} characters left`}>
              {left < 30 ? left : ""}
            </span>
          )}
          <button className="btn primary" disabled={!canPost} onClick={submit}>
            {busy ? "Posting…" : replyTo ? "Reply" : "Post"}
          </button>
        </div>
      </div>
    </div>
  );
}
