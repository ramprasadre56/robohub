import Link from "next/link";
import type { Metadata } from "next";
import HackathonRow from "@/components/HackathonRow";
import { hackathons } from "@/lib/data";

export const metadata: Metadata = { title: "Hackathons" };

const FILTERS = [
  { key: "all", label: "All" },
  { key: "open", label: "Registration open" },
  { key: "upcoming", label: "Coming soon" },
  { key: "completed", label: "Past" },
];

export default async function HackathonsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status = "all", q = "" } = await searchParams;
  const query = q.trim().toLowerCase();

  const list = hackathons.filter((h) => {
    if (status !== "all" && h.status !== status) return false;
    if (!query) return true;
    return [h.title, h.tagline, h.location, ...h.tags].join(" ").toLowerCase().includes(query);
  });

  return (
    <>
      <header className="page-head">
        <h1>Hackathons</h1>
        <p>Compete with real hardware or in simulation. Every event comes with a prep workshop and mentors.</p>
      </header>

      <nav className="tabs" aria-label="Filter hackathons">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={`/hackathons?status=${f.key}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            className={`tab ${status === f.key ? "active" : ""}`}
          >
            {f.label}
          </Link>
        ))}
      </nav>

      {query && (
        <p className="muted" style={{ marginBottom: 16 }}>
          {list.length} result{list.length === 1 ? "" : "s"} for “{q}” · <Link className="link" href="/hackathons">Clear</Link>
        </p>
      )}

      {list.length ? (
        <div className="row-list">{list.map((h) => <HackathonRow key={h.slug} h={h} />)}</div>
      ) : (
        <div className="panel muted">No hackathons match. Try another filter or search term.</div>
      )}
    </>
  );
}
