import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, CalendarDays, MapPin, GraduationCap } from "lucide-react";
import { hackathons, dateRange, formatDate } from "@/lib/data";
import { statusLabel } from "@/components/HackathonRow";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return hackathons.map((h) => ({ slug: h.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const h = hackathons.find((x) => x.slug === slug);
  return { title: h?.title ?? "Hackathon", description: h?.tagline };
}

export default async function HackathonDetail({ params }: Props) {
  const { slug } = await params;
  const h = hackathons.find((x) => x.slug === slug);
  if (!h) notFound();

  const closed = h.status === "completed";

  return (
    <>
      <Link href="/hackathons" className="link" style={{ marginTop: 8 }}><ArrowLeft size={16} /> All hackathons</Link>

      <section className="detail-hero">
        <div className="pills" style={{ marginBottom: 14 }}>
          <span className={`pill ${h.status}`}>{statusLabel[h.status]}</span>
          <span className="pill">{h.mode}</span>
          {h.tags.map((t) => <span key={t} className="pill">{t}</span>)}
        </div>
        <h1>{h.title}</h1>
        <p>{h.tagline}</p>
        <div className="row-meta" style={{ marginTop: 14, fontSize: 15, color: "inherit" }}>
          <span><CalendarDays size={16} /> {dateRange(h.start, h.end)}</span>
          <span><MapPin size={16} /> {h.location}</span>
        </div>
        <div className="detail-actions">
          {closed ? (
            <span className="btn">Event completed</span>
          ) : (
            <Link href={`/register?event=${h.slug}`} className="btn primary">Register your team</Link>
          )}
          <Link href="/training" className="btn"><GraduationCap size={16} /> Prep with training</Link>
        </div>
      </section>

      <div className="detail-grid">
        <article className="prose">
          <h2>Overview</h2>
          <p>{h.description}</p>

          <h2>Tracks</h2>
          <div className="grid grid-2" style={{ gap: 14 }}>
            {h.tracks.map((t) => (
              <div key={t.name} className="panel">
                <h3 style={{ marginBottom: 6 }}>{t.name}</h3>
                <p className="muted">{t.detail}</p>
              </div>
            ))}
          </div>

          <h2>Hardware & tools</h2>
          <ul>{h.hardware.map((x) => <li key={x}>{x}</li>)}</ul>

          <h2>Rules</h2>
          <ul>{h.rules.map((r) => <li key={r}>{r}</li>)}</ul>

          <h2>Judging</h2>
          <div style={{ display: "grid", gap: 14 }}>
            {h.judging.map((j) => (
              <div key={j.criterion}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span>{j.criterion}</span><strong>{j.weight}%</strong>
                </div>
                <div className="bar"><div style={{ width: `${j.weight}%` }} /></div>
              </div>
            ))}
          </div>
        </article>

        <aside style={{ display: "grid", gap: 20, alignContent: "start" }}>
          <div className="panel">
            <h3>At a glance</h3>
            <dl className="kv">
              <dt>Prize pool</dt><dd>{h.prize}</dd>
              <dt>Team size</dt><dd>{h.teamSize}</dd>
              <dt>Format</dt><dd>{h.mode}</dd>
              <dt>Registered</dt><dd>{h.participants.toLocaleString("en-IN")}</dd>
            </dl>
          </div>
          <div className="panel">
            <h3>Timeline</h3>
            <ol className="timeline">
              {h.timeline.map((t) => (
                <li key={t.label}>
                  <div className="t-date">{formatDate(t.date)}</div>
                  <div>{t.label}</div>
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </div>
    </>
  );
}
