"use client";

import Link from "next/link";
import type { ReactNode } from "react";

const TOKEN = /(https?:\/\/[^\s]+)|(^|[^\w&])#(\w{2,40})|(^|[^\w])@(\w{3,15})/g;

/** Renders post text with links for URLs, #hashtags and @mentions. React escapes everything else. */
export default function RichText({ text }: { text: string }) {
  const out: ReactNode[] = [];
  let last = 0;
  let k = 0;
  for (const m of text.matchAll(TOKEN)) {
    const start = m.index!;
    if (m[1]) {
      out.push(text.slice(last, start));
      const url = m[1].replace(/[),.!?]+$/, "");
      out.push(<a key={k++} href={url} target="_blank" rel="noreferrer nofollow ugc" className="rt-link" onClick={(e) => e.stopPropagation()}>{url.replace(/^https?:\/\//, "").slice(0, 40)}{url.length > 48 ? "…" : ""}</a>);
      last = start + url.length;
    } else if (m[3]) {
      out.push(text.slice(last, start) + m[2]);
      out.push(<Link key={k++} href={`/hashtag/${m[3].toLowerCase()}`} className="rt-link" onClick={(e) => e.stopPropagation()}>#{m[3]}</Link>);
      last = start + m[0].length;
    } else if (m[5]) {
      out.push(text.slice(last, start) + m[4]);
      out.push(<Link key={k++} href={`/u/${m[5]}`} className="rt-link" onClick={(e) => e.stopPropagation()}>@{m[5]}</Link>);
      last = start + m[0].length;
    }
  }
  out.push(text.slice(last));
  return <>{out}</>;
}
