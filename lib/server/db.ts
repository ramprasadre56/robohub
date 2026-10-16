// Local SQLite database using Node's built-in `node:sqlite` (Node 22+, no native deps).
// Used for local development only; production uses Firestore (see store/firestore.ts).
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { seed } from "./seed";

import { DATA_DIR, UPLOAD_DIR } from "./paths";
export { DATA_DIR, UPLOAD_DIR };

const SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  handle TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name TEXT NOT NULL,
  email TEXT UNIQUE COLLATE NOCASE,
  password_hash TEXT,
  google_sub TEXT UNIQUE,
  bio TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  website TEXT NOT NULL DEFAULT '',
  avatar TEXT,
  banner TEXT,
  verified INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL DEFAULT '',
  images TEXT NOT NULL DEFAULT '[]',
  link TEXT,
  reply_to TEXT,
  quote_of TEXT,
  deleted INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS posts_user ON posts(user_id, created_at);
CREATE INDEX IF NOT EXISTS posts_reply ON posts(reply_to);
CREATE INDEX IF NOT EXISTS posts_time ON posts(created_at);
CREATE TABLE IF NOT EXISTS likes (user_id TEXT NOT NULL, post_id TEXT NOT NULL, created_at INTEGER NOT NULL, PRIMARY KEY (user_id, post_id));
CREATE INDEX IF NOT EXISTS likes_post ON likes(post_id);
CREATE TABLE IF NOT EXISTS reposts (user_id TEXT NOT NULL, post_id TEXT NOT NULL, created_at INTEGER NOT NULL, PRIMARY KEY (user_id, post_id));
CREATE INDEX IF NOT EXISTS reposts_post ON reposts(post_id);
CREATE TABLE IF NOT EXISTS bookmarks (user_id TEXT NOT NULL, post_id TEXT NOT NULL, created_at INTEGER NOT NULL, PRIMARY KEY (user_id, post_id));
CREATE TABLE IF NOT EXISTS follows (follower_id TEXT NOT NULL, followee_id TEXT NOT NULL, created_at INTEGER NOT NULL, PRIMARY KEY (follower_id, followee_id));
CREATE INDEX IF NOT EXISTS follows_followee ON follows(followee_id);
CREATE TABLE IF NOT EXISTS hashtags (post_id TEXT NOT NULL, tag TEXT NOT NULL COLLATE NOCASE, created_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS hashtags_tag ON hashtags(tag, created_at);
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  type TEXT NOT NULL,
  post_id TEXT,
  read INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS notif_user ON notifications(user_id, created_at);
CREATE TABLE IF NOT EXISTS media (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, file TEXT NOT NULL, mime TEXT NOT NULL, created_at INTEGER NOT NULL);
`;

const g = globalThis as unknown as { __robohubDb?: DatabaseSync };

export function db(): DatabaseSync {
  if (g.__robohubDb) return g.__robohubDb;
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const d = new DatabaseSync(path.join(DATA_DIR, "robohub.db"));
  d.exec(SCHEMA);
  g.__robohubDb = d;
  seed(d);
  return d;
}

export function tx<T>(fn: () => T): T {
  const d = db();
  d.exec("BEGIN");
  try {
    const r = fn();
    d.exec("COMMIT");
    return r;
  } catch (e) {
    d.exec("ROLLBACK");
    throw e;
  }
}

/** Time-sortable unique id. */
export function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}
