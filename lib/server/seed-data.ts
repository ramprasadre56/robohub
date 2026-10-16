import { hackathons, news, events } from "@/lib/data";

// Official account + announcement posts used to seed an empty database (no invented people).
export const SEED_USER = {
  id: "robohub", handle: "robohub", name: "RoboHub", location: "Hyderabad, India",
  bio: "Hackathons, events and training for robot builders. Post your builds with #robotics.",
  createdAt: Date.parse("2026-09-15T00:00:00Z"),
};

export function seedPosts() {
  const out: { id: string; text: string; link: string | null; createdAt: number; tags: string[] }[] = [];
  let t = Date.now() - 3600_000 * 20;
  const add = (id: string, text: string, link: string | null) => {
    t += 3600_000;
    out.push({ id, text, link, createdAt: t, tags: [...new Set([...text.matchAll(/#(\w{2,40})/g)].map((m) => m[1].toLowerCase()))] });
  };
  news.slice(0, 6).forEach((n) => add(`seed-${n.slug}`.slice(0, 40), `${n.title}. What do you think — hype or real progress? #robotics #news`, n.url));
  events.slice(0, 2).forEach((e, i) => add(`seed-event-${i}`, `${e.kind}: ${e.title} — ${e.summary} #robotics #${e.kind.toLowerCase()}`, "/events"));
  hackathons.filter((h) => h.status === "open").forEach((h) =>
    add(`seed-hack-${h.slug}`.slice(0, 40), `Registration is open for ${h.title}! ${h.tagline} Looking for teammates? Reply with your skills 👇 #hackathon #robotics`, `/hackathons/${h.slug}`));
  add("seed-welcome", "Welcome to RoboHub Social 🤖 Share what you're building, ask questions, find teammates. Use #ros2 #drones #humanoids #robotlearning so others can find your posts.", null);
  return out;
}
