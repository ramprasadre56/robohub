import type { Metadata } from "next";
import { ExternalLink, Newspaper } from "lucide-react";
import { news, NEWS_SOURCE } from "@/lib/data";

export const metadata: Metadata = { title: "Robotics News" };

export default function NewsPage() {
  return (
    <>
      <header className="page-head">
        <h1>Robotics news</h1>
        <p>
          What&apos;s happening in humanoids, drones and home robots. Headlines link to{" "}
          <a href={NEWS_SOURCE} target="_blank" rel="noreferrer" className="link">The Rundown&apos;s robotics coverage</a>.
        </p>
      </header>

      <div className="grid grid-3">
        {news.map((n, i) => (
          <a key={n.slug} href={n.url} target="_blank" rel="noreferrer" className="card">
            <div className={`card-banner ${["", "v2", "v3"][i % 3]}`} style={{ height: 96, padding: "0 24px" }}>
              <div className="banner-icon" style={{ width: 56, height: 56 }}><Newspaper size={24} /></div>
            </div>
            <div className="card-body">
              <h3 style={{ fontSize: 18 }}>{n.title}</h3>
            </div>
            <div className="card-foot" style={{ fontSize: 14, fontWeight: 500 }}>
              <span className="muted">{n.read} min read</span>
              <ExternalLink size={16} />
            </div>
          </a>
        ))}
      </div>
    </>
  );
}
