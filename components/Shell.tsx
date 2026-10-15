"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  Menu, Plus, Home, Trophy, CalendarDays, GraduationCap, Newspaper, BarChart3,
  Search, Cpu, BookOpen, Users, Hash,
} from "lucide-react";

const NAV = [
  { href: "/", label: "Home", icon: Home },
  { href: "/hackathons", label: "Hackathons", icon: Trophy },
  { href: "/events", label: "Events", icon: CalendarDays },
  { href: "/training", label: "Training", icon: GraduationCap },
];
const SUB = [
  { href: "/training/foundations", label: "Intro to Robotics" },
  { href: "/training/motion-planning", label: "Motion Planning" },
  { href: "/training/robot-learning", label: "Robot Learning" },
];
const MORE = [
  { href: "/news", label: "Robotics News", icon: Newspaper },
  { href: "/leaderboard", label: "Leaderboard", icon: BarChart3 },
  { href: "/register", label: "Join a Team", icon: Users },
];

export default function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  const item = (href: string, label: string, Icon?: typeof Home, sub = false) => (
    <Link
      key={href}
      href={href}
      onClick={() => setOpen(false)}
      className={`nav-item ${sub ? "nav-sub" : ""} ${(sub ? pathname === href : isActive(href)) ? "active" : ""}`}
    >
      {Icon && <Icon size={22} strokeWidth={1.75} />}
      {label}
    </Link>
  );

  return (
    <div className="shell">
      {open && <div className="scrim" onClick={() => setOpen(false)} />}
      <aside className={`sidebar ${open ? "open" : ""}`} aria-label="Main navigation">
        <div className="brand">
          <button className="icon-btn" aria-label="Close menu" onClick={() => setOpen(false)}>
            <Menu size={24} />
          </button>
          <Link href="/" className="brand-logo" onClick={() => setOpen(false)}>
            robo<span>hub</span>
          </Link>
        </div>
        <Link href="/register" className="create-btn" onClick={() => setOpen(false)}>
          <Plus size={20} /> Register
        </Link>
        {NAV.map((n) => item(n.href, n.label, n.icon))}
        {SUB.map((n) => item(n.href, n.label, undefined, true))}
        <div className="nav-sep" />
        <div className="nav-label">Topics</div>
        {item("/topics/robotics", "Robotics", Hash)}
        <div className="nav-sep" />
        {MORE.map((n) => item(n.href, n.label, n.icon))}
        <div className="nav-sep" />
        <a className="nav-item" href="https://irom-lab.princeton.edu/intro-to-robotics/" target="_blank" rel="noreferrer">
          <BookOpen size={22} strokeWidth={1.75} /> Course reference
        </a>
        <a className="nav-item" href="https://huggingface.co/lerobot" target="_blank" rel="noreferrer">
          <Cpu size={22} strokeWidth={1.75} /> LeRobot on HF
        </a>
      </aside>

      <main className="main">
        <div className="topbar">
          <button className="icon-btn mobile-only" aria-label="Open menu" onClick={() => setOpen(true)}>
            <Menu size={24} />
          </button>
          <form
            className="search"
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              router.push(`/hackathons?q=${encodeURIComponent(q)}`);
            }}
          >
            <Search size={20} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search hackathons, drones, humanoids, ROS 2…"
              aria-label="Search"
            />
          </form>
          <div className="avatar" title="Your profile">R</div>
        </div>
        {children}
        <footer className="footer">
          <span>© {new Date().getFullYear()} RoboHub — hackathons, events & training for robot builders.</span>
          <span>
            News via <a className="link" href="https://www.therundown.ai/articles-category/robotics" target="_blank" rel="noreferrer">The Rundown</a>
          </span>
        </footer>
      </main>
    </div>
  );
}
