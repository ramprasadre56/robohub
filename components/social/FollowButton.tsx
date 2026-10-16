"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/format";

export default function FollowButton({ handle, initial, signedIn, small }: { handle: string; initial: boolean; signedIn: boolean; small?: boolean }) {
  const [on, setOn] = useState(initial);
  const [hover, setHover] = useState(false);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function toggle(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation();
    if (!signedIn) { router.push("/login"); return; }
    setBusy(true); const next = !on; setOn(next);
    try { await api(`/api/users/${handle}/follow`, { body: { on: next } }); router.refresh(); }
    catch { setOn(!next); }
    finally { setBusy(false); }
  }
  return (
    <button
      className={`btn ${on ? "following" : "primary"} ${small ? "btn-sm" : ""}`}
      onClick={toggle} disabled={busy}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      aria-pressed={on}
    >
      {on ? (hover ? "Unfollow" : "Following") : "Follow"}
    </button>
  );
}
