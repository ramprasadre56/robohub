import Link from "next/link";
import { Bot, CalendarDays, MapPin, Users } from "lucide-react";
import { dateRange, type Hackathon } from "@/lib/data";

export const statusLabel: Record<Hackathon["status"], string> = {
  open: "Registration open",
  upcoming: "Coming soon",
  live: "Live now",
  completed: "Completed",
};

export default function HackathonRow({ h }: { h: Hackathon }) {
  return (
    <Link href={`/hackathons/${h.slug}`} className="row">
      <div className="row-thumb"><Bot size={30} strokeWidth={1.6} /></div>
      <div>
        <div className="row-title">{h.title}</div>
        <div className="muted">{h.tagline}</div>
        <div className="row-meta">
          <span><CalendarDays size={14} /> {dateRange(h.start, h.end)}</span>
          <span><MapPin size={14} /> {h.location}</span>
          <span><Users size={14} /> {h.participants.toLocaleString("en-IN")} registered</span>
        </div>
      </div>
      <div className="row-right">
        <div className="row-prize">{h.prize}</div>
        <span className={`pill ${h.status}`}>{statusLabel[h.status]}</span>
      </div>
    </Link>
  );
}
