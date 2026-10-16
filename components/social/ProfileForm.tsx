"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";
import Avatar from "./Avatar";
import { api } from "@/lib/format";

type P = { handle: string; name: string; bio: string; location: string; website: string; avatar: string | null; banner: string | null };

export default function ProfileForm({ user }: { user: P }) {
  const router = useRouter();
  const [f, setF] = useState(user);
  const [media, setMedia] = useState<{ avatar?: string | null; banner?: string | null }>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const av = useRef<HTMLInputElement>(null);
  const bn = useRef<HTMLInputElement>(null);

  async function upload(kind: "avatar" | "banner", file?: File) {
    if (!file) return;
    const fd = new FormData(); fd.append("file", file);
    const res = await fetch("/api/media", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) { setMsg({ ok: false, text: data.error }); return; }
    setMedia((m) => ({ ...m, [kind]: data.id }));
    setF((x) => ({ ...x, [kind]: data.url }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg(null);
    try {
      await api("/api/profile", { method: "PATCH", body: { name: f.name, handle: f.handle, bio: f.bio, location: f.location, website: f.website, ...media } });
      setMsg({ ok: true, text: "Profile saved" });
      router.push(`/u/${f.handle}`); router.refresh();
    } catch (e) { setMsg({ ok: false, text: (e as Error).message }); }
    finally { setBusy(false); }
  }
  const set = (k: keyof P) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  return (
    <form className="form" onSubmit={save} style={{ maxWidth: "none" }}>
      <div className="profile-banner editable" style={f.banner ? { backgroundImage: `url(${f.banner})` } : undefined} onClick={() => bn.current?.click()}>
        <span className="cam"><Camera size={20} /> Change banner</span>
      </div>
      <input ref={bn} type="file" accept="image/*" hidden onChange={(e) => upload("banner", e.target.files?.[0])} />
      <button type="button" className="avatar-edit" onClick={() => av.current?.click()} aria-label="Change photo">
        <Avatar name={f.name} src={f.avatar} size={96} /><span className="cam"><Camera size={20} /></span>
      </button>
      <input ref={av} type="file" accept="image/*" hidden onChange={(e) => upload("avatar", e.target.files?.[0])} />

      <div className="field"><label htmlFor="pname">Name</label><input id="pname" value={f.name} onChange={set("name")} maxLength={50} required /></div>
      <div className="field"><label htmlFor="phandle">Username</label><div className="handle-input"><span>@</span><input id="phandle" value={f.handle} onChange={set("handle")} pattern="[A-Za-z0-9_]{3,15}" required /></div></div>
      <div className="field"><label htmlFor="pbio">Bio</label><textarea id="pbio" value={f.bio} onChange={set("bio")} maxLength={160} rows={3} placeholder="What do you build? e.g. ROS 2 dev, drone racer, robotics student" /><span className="muted small">{160 - f.bio.length} left</span></div>
      <div className="grid grid-2" style={{ gap: 18 }}>
        <div className="field"><label htmlFor="ploc">Location</label><input id="ploc" value={f.location} onChange={set("location")} maxLength={30} /></div>
        <div className="field"><label htmlFor="pweb">Website</label><input id="pweb" value={f.website} onChange={set("website")} placeholder="https://" /></div>
      </div>
      {msg && <p className={msg.ok ? "form-ok" : "form-error"}>{msg.text}</p>}
      <div><button className="btn primary" disabled={busy}>{busy ? "Saving…" : "Save"}</button></div>
    </form>
  );
}
