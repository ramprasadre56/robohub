import Link from "next/link";
import { ArrowRight, Trophy, GraduationCap, Compass, CalendarDays, MapPin, ExternalLink } from "lucide-react";
import HackathonRow from "@/components/HackathonRow";
import { hackathons, events, course, tracks, news, NEWS_SOURCE, formatDate } from "@/lib/data";

export default function HomePage() {
  const active = hackathons.filter((h) => h.status !== "completed");
  const builders = hackathons.reduce((s, h) => s + h.participants, 0);

  const focus = [
    { title: "Join a hackathon", sub: "Build real robots against the clock", href: "/hackathons", icon: Trophy, v: "" },
    { title: "Take a training course", sub: "From PID control to autonomous flight", href: "/training", icon: GraduationCap, v: "v2" },
    { title: "Explore robotics news", sub: "Humanoids, drones and home robots", href: "/news", icon: Compass, v: "v3" },
  ];

  return (
    <>
      <section className="hero">
        <div>
          <h1>Build robots that work in the real world.</h1>
          <p>Hackathons, hands-on events and a full robotics curriculum — for students, makers and engineers.</p>
          <div className="detail-actions">
            <Link href="/hackathons" className="btn primary">Browse hackathons <ArrowRight size={18} /></Link>
            <Link href="/training" className="btn">Start learning</Link>
          </div>
        </div>
        <div className="stats">
          <div className="stat">
            <div className="stat-label">Open hackathons</div>
            <div className="stat-ring accent"><div><div className="stat-num">{active.length}</div><div className="stat-cap">this season</div></div></div>
          </div>
          <div className="stat">
            <div className="stat-label">Builders</div>
            <div className="stat-ring"><div><div className="stat-num">{(builders / 1000).toFixed(1)}k</div><div className="stat-cap">registered</div></div></div>
          </div>
          <div className="stat">
            <div className="stat-label">Training</div>
            <div className="stat-ring"><div><div className="stat-num">{course.modules.length}</div><div className="stat-cap">modules</div></div></div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <h2>How to start: choose a focus</h2>
            <p className="sub muted">Pick a path — you can switch any time.</p>
          </div>
        </div>
        <div className="grid grid-3">
          {focus.map(({ title, sub, href, icon: Icon, v }) => (
            <Link key={href} href={href} className="card">
              <div className={`card-banner ${v}`}><div className="banner-icon"><Icon size={36} strokeWidth={1.6} /></div></div>
              <div className="card-body">
                <h3>{title}</h3>
                <p className="muted">{sub}</p>
              </div>
              <div className="card-foot">Get started <ArrowRight size={20} /></div>
            </Link>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div><h2>Featured hackathons</h2><p className="sub muted">Registration is open now.</p></div>
          <Link href="/hackathons" className="link">See all <ArrowRight size={16} /></Link>
        </div>
        <div className="row-list">
          {active.slice(0, 3).map((h) => <HackathonRow key={h.slug} h={h} />)}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div><h2>Learning tracks</h2><p className="sub muted">Self-paced, with labs that map directly onto our hackathons.</p></div>
          <Link href="/training" className="link">All training <ArrowRight size={16} /></Link>
        </div>
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

      <section className="section grid grid-2" style={{ alignItems: "start" }}>
        <div>
          <div className="section-head">
            <h2>Upcoming events</h2>
            <Link href="/events" className="link">Calendar <ArrowRight size={16} /></Link>
          </div>
          <div className="row-list">
            {events.slice(0, 3).map((e) => (
              <div key={e.title} className="row" style={{ gridTemplateColumns: "56px 1fr" }}>
                <div className="row-thumb" style={{ width: 56, height: 56, flexDirection: "column", gap: 0 }}>
                  <strong style={{ fontSize: 18, lineHeight: 1 }}>{formatDate(e.date, { day: "numeric" })}</strong>
                  <span className="small">{formatDate(e.date, { month: "short" })}</span>
                </div>
                <div>
                  <div className="row-title" style={{ fontSize: 16 }}>{e.title}</div>
                  <div className="row-meta">
                    <span className="pill">{e.kind}</span>
                    <span><MapPin size={14} /> {e.location}</span>
                    <span><CalendarDays size={14} /> {e.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="section-head">
            <h2>Robotics news</h2>
            <a href={NEWS_SOURCE} target="_blank" rel="noreferrer" className="link">The Rundown <ExternalLink size={14} /></a>
          </div>
          <div className="row-list">
            {news.slice(0, 5).map((n) => (
              <a key={n.slug} href={n.url} target="_blank" rel="noreferrer" className="row" style={{ gridTemplateColumns: "1fr auto" }}>
                <div className="row-title" style={{ fontSize: 15.5 }}>{n.title}</div>
                <span className="muted small">{n.read} min</span>
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
