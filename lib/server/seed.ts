import type { DatabaseSync } from "node:sqlite";
import { seedPosts, SEED_USER } from "./seed-data";

export function seed(d: DatabaseSync) {
  if (d.prepare("SELECT 1 FROM users WHERE handle = ?").get(SEED_USER.handle)) return;
  d.prepare(`INSERT INTO users (id, handle, name, bio, location, website, verified, created_at) VALUES (?, ?, ?, ?, ?, '', 1, ?)`)
    .run(SEED_USER.id, SEED_USER.handle, SEED_USER.name, SEED_USER.bio, SEED_USER.location, SEED_USER.createdAt);
  const ins = d.prepare("INSERT INTO posts (id, user_id, text, link, created_at) VALUES (?, ?, ?, ?, ?)");
  const tag = d.prepare("INSERT INTO hashtags (post_id, tag, created_at) VALUES (?, ?, ?)");
  for (const p of seedPosts()) {
    ins.run(p.id, SEED_USER.id, p.text, p.link, p.createdAt);
    for (const t of p.tags) tag.run(p.id, t, p.createdAt);
  }
}
