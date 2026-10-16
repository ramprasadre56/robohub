"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  Menu, Plus, Home, Trophy, CalendarDays, GraduationCap, Newspaper, BarChart3,
  Search, Cpu, BookOpen, Users, Hash, Bell, Bookmark, User as UserIcon, Compass, Feather, LogIn,
} from "lucide-react";
import Avatar from "@/components/social/Avatar";
import LogoutButton from "@/components/social/LogoutButton";

export type ShellUser = { handle: string; name: string; avatar: string | null } | null;

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

export default function Shell({ children, user, unread }: { children: ReactNode; user: ShellUser; unread: number }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false); // mobile drawer
  const [collapsed, setCollapsed] = useState(false); // desktop mini rail
  const [q, setQ] = useState("");

  useEffect(() => {
    try { setCollapsed(localStorage.getItem("robohub-collapsed") === "1"); } catch {}
  }, []);

  function toggleMenu() {
    if (window.matchMedia("(max-width: 860px)").matches) { setOpen(false); return; }
    setCollapsed((c) => {
      try { localStorage.setItem("robohub-collapsed", c ? "0" : "1"); } catch {}
      return !c;
    });
  }

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  const item = (href: string, label: string, Icon?: typeof Home, sub = false, badge = 0) => (
    <Link
      key={href}
      href={href}
      onClick={() => setOpen(false)}
      title={label}
      className={`nav-item ${sub ? "nav-sub" : ""} ${(sub ? pathname === href : isActive(href)) ? "active" : ""}`}
    >
      {Icon && (
        <span className="nav-icon">
          <Icon size={22} strokeWidth={1.75} />
          {badge > 0 && <span className="badge">{badge > 99 ? "99+" : badge}</span>}
        </span>
      )}
      <span className="nav-text">{label}</span>
    </Link>
  );

  return (
    <div className="shell">
      {open && <div className="scrim" onClick={() => setOpen(false)} />}
      <aside className={`sidebar ${open ? "open" : ""} ${collapsed ? "collapsed" : ""}`} aria-label="Main navigation">
        <div className="brand">
          <button className="icon-btn" aria-label={collapsed ? "Expand menu" : "Collapse menu"} aria-expanded={!collapsed} onClick={toggleMenu}>
            <Menu size={24} />
          </button>
          <Link href="/" className="brand-logo" onClick={() => setOpen(false)}>
            robo<span>hub</span>
          </Link>
        </div>
        <Link href="/register" className="create-btn" title="Register" onClick={() => setOpen(false)}>
          <Plus size={20} /> <span className="nav-text">Register</span>
        </Link>
        {NAV.map((n) => item(n.href, n.label, n.icon))}
        {SUB.map((n) => item(n.href, n.label, undefined, true))}
        <div className="nav-sep" />
        <div className="nav-label">Community</div>
        {item("/feed", "# Robotics", Hash)}
        {item("/explore", "Explore", Compass)}
        {user && item("/notifications", "Notifications", Bell, false, unread)}
        {user && item("/bookmarks", "Bookmarks", Bookmark)}
        {user ? item(`/u/${user.handle}`, "Profile", UserIcon) : item("/login", "Sign in", LogIn)}
        <Link href={user ? "/feed" : "/signup"} className="post-cta" title="Post" onClick={() => setOpen(false)}>
          <Feather size={20} /> <span className="nav-text">{user ? "Post" : "Join RoboHub"}</span>
        </Link>
        <div className="nav-sep" />
        {MORE.map((n) => item(n.href, n.label, n.icon))}
        <div className="nav-sep" />
        <a className="nav-item" href="https://irom-lab.princeton.edu/intro-to-robotics/" target="_blank" rel="noreferrer" title="Course reference">
          <BookOpen size={22} strokeWidth={1.75} /> <span className="nav-text">Course reference</span>
        </a>
        <a className="nav-item" href="https://huggingface.co/lerobot" target="_blank" rel="noreferrer" title="LeRobot on HF">
          <Cpu size={22} strokeWidth={1.75} /> <span className="nav-text">LeRobot on HF</span>
        </a>
        {user && <LogoutButton />}
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
              const social = /^\/(feed|explore|u\/|hashtag|notifications|bookmarks)/.test(pathname);
              router.push(social ? `/explore?q=${encodeURIComponent(q)}` : `/hackathons?q=${encodeURIComponent(q)}`);
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
          {user ? (
            <Link href={`/u/${user.handle}`} title={`@${user.handle}`} className="top-av"><Avatar name={user.name} src={user.avatar} size={40} /></Link>
          ) : (
            <Link href="/login" className="btn btn-sm">Sign in</Link>
          )}
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
