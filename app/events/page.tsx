import Link from "next/link";
import type { Metadata } from "next";
import { CalendarDays, MapPin, User } from "lucide-react";
import { events, formatDate } from "@/lib/data";

export const metadata: Metadata = { title: "Events" };

export default function EventsPage() {
  return (
    <>
      <header className="page-head">
        <h1>Events</h1>
        <p>Workshops, bootcamps, talks and meetups — in person across India and online.</p>
      </header>

      <div className="grid grid-2">
        {events.map((e, i) => (
          <div key={e.title} className="card">
            <div className={`card-banner ${["", "v2", "v3"][i % 3]}`} style={{ height: 110, justifyContent: "space-between" }}>
              <div className="banner-icon" style={{ width: 72, height: 72, flexDirection: "column" }}>
                <strong style={{ fontSize: 24, lineHeight: 1 }}>{formatDate(e.date, { day: "numeric" })}</strong>
                <span className="small">{formatDate(e.date, { month: "short" })}</span>
              </div>
              <span className="pill" style={{ background: "var(--surface)" }}>{e.kind}</span>
            </div>
            <div className="card-body">
              <h3 style={{ fontSize: 20 }}>{e.title}</h3>
              <p className="muted">{e.summary}</p>
              <div className="row-meta">
                <span><CalendarDays size={14} /> {formatDate(e.date, { weekday: "short", day: "numeric", month: "short" })}, {e.time}</span>
                <span><MapPin size={14} /> {e.location}</span>
                <span><User size={14} /> {e.host}</span>
              </div>
            </div>
            <div className="card-foot">
              <Link href={`/register?event=${encodeURIComponent(e.title)}`} className="btn primary">RSVP</Link>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
