import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, ExternalLink, Plane } from "lucide-react";
import { course, tracks } from "@/lib/data";

export const metadata: Metadata = { title: "Training" };

export default function TrainingPage() {
  return (
    <>
      <header className="page-head">
        <h1>Training</h1>
        <p>Structured courses with hands-on labs. Every module ends with something you can run on a real robot or in simulation.</p>
      </header>

      <section className="detail-hero" style={{ marginTop: 0 }}>
        <div className="pills" style={{ marginBottom: 14 }}>
          <span className="pill open">Flagship course</span>
          <span className="pill">{course.modules.length} weeks</span>
          <span className="pill">Nano drones</span>
        </div>
        <h1>{course.title}</h1>
        <p>{course.subtitle}</p>
        <div className="detail-actions">
          <Link href={`/training/${course.modules[0].slug}`} className="btn primary">Start week 1 <ArrowRight size={18} /></Link>
          <a href={course.reference} target="_blank" rel="noreferrer" className="btn">
            <Plane size={16} /> Princeton IROM course reference <ExternalLink size={14} />
          </a>
        </div>
      </section>

      <section className="section">
        <div className="section-head"><h2>Syllabus</h2></div>
        <div className="row-list">
          {course.modules.map((m) => (
            <Link key={m.slug} href={`/training/${m.slug}`} className="row" style={{ gridTemplateColumns: "44px 1fr auto" }}>
              <div className="module-num">{m.week}</div>
              <div>
                <div className="row-title">{m.title}</div>
                <div className="muted">{m.summary}</div>
                <div className="pills" style={{ marginTop: 8 }}>
                  {m.topics.map((t) => <span key={t} className="pill">{t}</span>)}
                </div>
              </div>
              <ArrowRight size={20} className="muted" />
            </Link>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head"><h2>More tracks</h2></div>
        <div className="grid grid-4">
          {tracks.map((t, i) => (
            <Link key={t.title} href={t.href} className="card">
              <div className={`card-banner ${["", "v2", "v3", ""][i]}`} style={{ height: 88 }} />
              <div className="card-body">
                <span className="pill" style={{ alignSelf: "flex-start" }}>{t.level}</span>
                <h3 style={{ fontSize: 18 }}>{t.title}</h3>
                <p className="muted small">{t.lessons} lessons · ~{t.hours} hours</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
