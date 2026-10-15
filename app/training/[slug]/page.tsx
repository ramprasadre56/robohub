import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, FlaskConical } from "lucide-react";
import { course } from "@/lib/data";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return course.modules.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const m = course.modules.find((x) => x.slug === slug);
  return { title: m ? `Week ${m.week}: ${m.title}` : "Module" };
}

export default async function ModulePage({ params }: Props) {
  const { slug } = await params;
  const idx = course.modules.findIndex((x) => x.slug === slug);
  if (idx < 0) notFound();
  const m = course.modules[idx];
  const prev = course.modules[idx - 1];
  const next = course.modules[idx + 1];
  const progress = Math.round(((idx + 1) / course.modules.length) * 100);

  return (
    <>
      <Link href="/training" className="link" style={{ marginTop: 8 }}><ArrowLeft size={16} /> {course.title}</Link>

      <section className="detail-hero">
        <span className="pill" style={{ background: "var(--surface)" }}>Week {m.week} of {course.modules.length}</span>
        <h1 style={{ marginTop: 14 }}>{m.title}</h1>
        <p>{m.summary}</p>
        <div style={{ maxWidth: 360, marginTop: 20 }}>
          <div className="bar" style={{ background: "var(--surface)" }}><div style={{ width: `${progress}%` }} /></div>
          <p className="small" style={{ marginTop: 6, fontSize: 13 }}>{progress}% through the course</p>
        </div>
      </section>

      <div className="detail-grid">
        <article className="prose">
          <h2>What you&apos;ll learn</h2>
          <ul>{m.topics.map((t) => <li key={t}>{t}</li>)}</ul>

          <h2>Lab</h2>
          <div className="panel" style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
            <div className="module-num"><FlaskConical size={22} /></div>
            <div>
              <p>{m.lab}</p>
              <p className="muted small" style={{ marginTop: 6 }}>Runs in simulation; hardware sessions run at RoboHub events.</p>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 40, flexWrap: "wrap" }}>
            {prev ? <Link href={`/training/${prev.slug}`} className="btn"><ArrowLeft size={16} /> {prev.title}</Link> : <span />}
            {next && <Link href={`/training/${next.slug}`} className="btn primary">{next.title} <ArrowRight size={16} /></Link>}
          </div>
        </article>

        <aside className="panel" style={{ alignSelf: "start" }}>
          <h3>All modules</h3>
          <div style={{ display: "grid", gap: 2 }}>
            {course.modules.map((x) => (
              <Link key={x.slug} href={`/training/${x.slug}`} className={`nav-item ${x.slug === m.slug ? "active" : ""}`} style={{ fontSize: 14, gap: 12, padding: "8px 10px" }}>
                <span className="muted" style={{ width: 18 }}>{x.week}</span> {x.title}
              </Link>
            ))}
          </div>
        </aside>
      </div>
    </>
  );
}
