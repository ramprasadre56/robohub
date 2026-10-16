"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/** Polls for posts newer than the rendered feed and offers "Show N posts", like X. */
export default function NewPostsBanner({ tab, since }: { tab: string; since: number }) {
  const [count, setCount] = useState(0);
  const router = useRouter();
  useEffect(() => {
    setCount(0);
    const tick = async () => {
      if (document.hidden) return;
      try {
        const r = await fetch(`/api/posts/feed?tab=${tab}&after=${since}`).then((r) => r.json());
        setCount(r.count ?? 0);
      } catch {}
    };
    const t = setInterval(tick, 20_000);
    return () => clearInterval(t);
  }, [tab, since]);
  if (!count) return null;
  return (
    <button className="new-posts" onClick={() => { setCount(0); router.refresh(); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
      Show {count} post{count === 1 ? "" : "s"}
    </button>
  );
}
