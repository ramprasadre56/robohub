import { db, newId, tx } from "../db";
import type { Author, NotificationView, PostView, ProfileView, Store, User, UserCard } from "../types";

const MAX_POST = 500;
const MAX_IMAGES = 4;
const PAGE = 20;

type Row = Record<string, unknown>;
const q = (sql: string) => db().prepare(sql);
const marks = (n: number) => Array(n).fill("?").join(",");

// ---------- hydration ----------
export function hydrate(ids: string[], viewerId: string | null, withQuotes = true): PostView[] {
  if (!ids.length) return [];
  const v = viewerId ?? "";
  const rows = q(`
    SELECT p.*, u.handle, u.name, u.avatar, u.verified,
      (SELECT COUNT(*) FROM posts r WHERE r.reply_to = p.id AND r.deleted = 0) AS c_replies,
      (SELECT COUNT(*) FROM likes WHERE post_id = p.id) AS c_likes,
      (SELECT COUNT(*) FROM reposts WHERE post_id = p.id) AS c_reposts,
      EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = ?) AS v_liked,
      EXISTS(SELECT 1 FROM reposts WHERE post_id = p.id AND user_id = ?) AS v_reposted,
      EXISTS(SELECT 1 FROM bookmarks WHERE post_id = p.id AND user_id = ?) AS v_bookmarked,
      (SELECT pu.handle FROM posts pp JOIN users pu ON pu.id = pp.user_id WHERE pp.id = p.reply_to) AS reply_handle
    FROM posts p JOIN users u ON u.id = p.user_id
    WHERE p.id IN (${marks(ids.length)})`).all(v, v, v, ...ids) as Row[];

  const quoteIds = withQuotes ? rows.map((r) => r.quote_of as string).filter(Boolean) : [];
  const quotes = new Map(hydrate(quoteIds, viewerId, false).map((p) => [p.id, p]));

  const byId = new Map(rows.map((r) => {
    const deleted = !!r.deleted;
    const view: PostView = {
      id: r.id as string,
      text: deleted ? "" : (r.text as string),
      images: deleted ? [] : (JSON.parse(r.images as string) as string[]).map((f) => `/media/${f}`),
      link: deleted ? null : (r.link as string | null),
      createdAt: r.created_at as number,
      deleted,
      replyTo: r.reply_to as string | null,
      replyToHandle: r.reply_handle as string | null,
      author: { id: r.user_id as string, handle: r.handle as string, name: r.name as string, avatar: r.avatar as string | null, verified: r.verified as number },
      counts: { replies: r.c_replies as number, reposts: r.c_reposts as number, likes: r.c_likes as number },
      viewer: { liked: !!r.v_liked, reposted: !!r.v_reposted, bookmarked: !!r.v_bookmarked },
      quote: r.quote_of && !deleted ? quotes.get(r.quote_of as string) ?? null : null,
    };
    return [view.id, view];
  }));
  return ids.map((id) => byId.get(id)).filter((p): p is PostView => !!p);
}

// ---------- feeds ----------
export function forYou(viewerId: string | null, page = 0): PostView[] {
  const now = Date.now();
  const rows = q(`
    SELECT p.id, p.created_at,
      (SELECT COUNT(*) FROM likes WHERE post_id = p.id) + 2 * (SELECT COUNT(*) FROM reposts WHERE post_id = p.id)
      + (SELECT COUNT(*) FROM posts r WHERE r.reply_to = p.id AND r.deleted = 0) AS eng
    FROM posts p WHERE p.reply_to IS NULL AND p.deleted = 0
    ORDER BY p.created_at DESC LIMIT 400`).all() as { id: string; created_at: number; eng: number }[];
  const scored = rows
    .map((r) => ({ id: r.id, s: (r.eng + 1) / Math.pow((now - r.created_at) / 3600_000 + 2, 1.3) }))
    .sort((a, b) => b.s - a.s)
    .slice(page * PAGE, page * PAGE + PAGE);
  return hydrate(scored.map((r) => r.id), viewerId);
}

export function following(viewerId: string, before?: number): PostView[] {
  const rows = q(`
    SELECT post_id, t, reposter FROM (
      SELECT p.id AS post_id, p.created_at AS t, NULL AS reposter FROM posts p
        WHERE p.deleted = 0 AND p.reply_to IS NULL
          AND (p.user_id = ? OR p.user_id IN (SELECT followee_id FROM follows WHERE follower_id = ?))
      UNION ALL
      SELECT r.post_id, r.created_at AS t, r.user_id AS reposter FROM reposts r
        WHERE r.user_id IN (SELECT followee_id FROM follows WHERE follower_id = ?)
    ) WHERE t < ? ORDER BY t DESC LIMIT ?`).all(viewerId, viewerId, viewerId, before ?? Date.now() + 1, PAGE * 2) as { post_id: string; t: number; reposter: string | null }[];
  return withReposters(rows, viewerId);
}

function withReposters(rows: { post_id: string; reposter: string | null }[], viewerId: string | null) {
  const seen = new Set<string>();
  const items = rows.filter((r) => (seen.has(r.post_id) ? false : (seen.add(r.post_id), true))).slice(0, PAGE);
  const posts = new Map(hydrate(items.map((i) => i.post_id), viewerId).map((p) => [p.id, p]));
  const reposterIds = [...new Set(items.map((i) => i.reposter).filter(Boolean))] as string[];
  const reposters = new Map(
    (reposterIds.length ? q(`SELECT id, handle, name FROM users WHERE id IN (${marks(reposterIds.length)})`).all(...reposterIds) : [])
      .map((u) => [(u as Row).id as string, { handle: (u as Row).handle as string, name: (u as Row).name as string }])
  );
  const out: PostView[] = [];
  for (const i of items) {
    const p = posts.get(i.post_id);
    if (!p || p.deleted) continue;
    out.push({ ...p, repostedBy: i.reposter ? reposters.get(i.reposter) ?? null : null });
  }
  return out;
}

export function countNewer(tab: "for-you" | "following", viewerId: string | null, after: number) {
  if (tab === "following" && viewerId) {
    return (q(`SELECT COUNT(*) AS n FROM posts WHERE deleted = 0 AND reply_to IS NULL AND created_at > ? AND user_id != ?
               AND user_id IN (SELECT followee_id FROM follows WHERE follower_id = ?)`).get(after, viewerId, viewerId) as Row).n as number;
  }
  return (q(`SELECT COUNT(*) AS n FROM posts WHERE deleted = 0 AND reply_to IS NULL AND created_at > ? AND user_id != ?`)
    .get(after, viewerId ?? "") as Row).n as number;
}

// ---------- threads ----------
export function thread(id: string, viewerId: string | null) {
  const [post] = hydrate([id], viewerId);
  if (!post) return null;
  const ancestors: PostView[] = [];
  let parent = post.replyTo;
  for (let i = 0; parent && i < 10; i++) {
    const [p] = hydrate([parent], viewerId);
    if (!p) break;
    ancestors.unshift(p);
    parent = p.replyTo;
  }
  const replyIds = (q(`SELECT p.id FROM posts p WHERE p.reply_to = ? AND p.deleted = 0
      ORDER BY (SELECT COUNT(*) FROM likes WHERE post_id = p.id) DESC, p.created_at ASC LIMIT 200`).all(id) as Row[]).map((r) => r.id as string);
  return { post, ancestors, replies: hydrate(replyIds, viewerId) };
}

// ---------- profiles ----------
export function profile(handle: string, viewerId: string | null) {
  const u = q(`SELECT id, handle, name, bio, location, website, avatar, banner, verified, created_at,
      (SELECT COUNT(*) FROM follows WHERE followee_id = users.id) AS followers,
      (SELECT COUNT(*) FROM follows WHERE follower_id = users.id) AS following,
      (SELECT COUNT(*) FROM posts WHERE user_id = users.id AND deleted = 0) AS posts,
      EXISTS(SELECT 1 FROM follows WHERE follower_id = ? AND followee_id = users.id) AS viewer_follows,
      EXISTS(SELECT 1 FROM follows WHERE follower_id = users.id AND followee_id = ?) AS follows_viewer
    FROM users WHERE handle = ?`).get(viewerId ?? "", viewerId ?? "", handle) as Row | undefined;
  return u ? (u as unknown as ProfileView) : null;
}


export function userPosts(userId: string, tab: "posts" | "replies" | "media" | "likes", viewerId: string | null): PostView[] {
  if (tab === "posts") {
    const rows = q(`SELECT post_id, t, reposter FROM (
        SELECT id AS post_id, created_at AS t, NULL AS reposter FROM posts WHERE user_id = ? AND deleted = 0 AND reply_to IS NULL
        UNION ALL SELECT post_id, created_at AS t, user_id AS reposter FROM reposts WHERE user_id = ?
      ) ORDER BY t DESC LIMIT 60`).all(userId, userId) as { post_id: string; reposter: string | null }[];
    return withReposters(rows, viewerId);
  }
  const sql = {
    replies: `SELECT id FROM posts WHERE user_id = ? AND deleted = 0 AND reply_to IS NOT NULL ORDER BY created_at DESC LIMIT 60`,
    media: `SELECT id FROM posts WHERE user_id = ? AND deleted = 0 AND images != '[]' ORDER BY created_at DESC LIMIT 60`,
    likes: `SELECT l.post_id AS id FROM likes l JOIN posts p ON p.id = l.post_id WHERE l.user_id = ? AND p.deleted = 0 ORDER BY l.created_at DESC LIMIT 60`,
  }[tab];
  return hydrate((q(sql).all(userId) as Row[]).map((r) => r.id as string), viewerId);
}

export function bookmarks(viewerId: string) {
  const ids = (q(`SELECT b.post_id AS id FROM bookmarks b JOIN posts p ON p.id = b.post_id WHERE b.user_id = ? AND p.deleted = 0
                  ORDER BY b.created_at DESC LIMIT 100`).all(viewerId) as Row[]).map((r) => r.id as string);
  return hydrate(ids, viewerId);
}

// ---------- explore ----------
export function searchPosts(term: string, viewerId: string | null) {
  const like = `%${term.replace(/[%_]/g, (m) => "\\" + m)}%`;
  const ids = (q(`SELECT id FROM posts WHERE deleted = 0 AND text LIKE ? ESCAPE '\\' ORDER BY created_at DESC LIMIT 60`).all(like) as Row[]).map((r) => r.id as string);
  return hydrate(ids, viewerId);
}
export function searchUsers(term: string, viewerId: string | null) {
  const like = `%${term.replace(/[%_@]/g, (m) => (m === "@" ? "" : "\\" + m))}%`;
  return q(`SELECT id, handle, name, bio, avatar, verified,
      EXISTS(SELECT 1 FROM follows WHERE follower_id = ? AND followee_id = users.id) AS viewer_follows
    FROM users WHERE handle LIKE ? ESCAPE '\\' OR name LIKE ? ESCAPE '\\' LIMIT 20`).all(viewerId ?? "", like, like) as unknown as UserCard[];
}

export function hashtagPosts(tag: string, viewerId: string | null) {
  const ids = (q(`SELECT DISTINCT h.post_id AS id, h.created_at FROM hashtags h JOIN posts p ON p.id = h.post_id
                  WHERE h.tag = ? AND p.deleted = 0 ORDER BY h.created_at DESC LIMIT 100`).all(tag.toLowerCase()) as Row[]).map((r) => r.id as string);
  return hydrate(ids, viewerId);
}
export function trending(limit = 6) {
  return q(`SELECT tag, COUNT(*) AS n FROM hashtags WHERE created_at > ? GROUP BY tag ORDER BY n DESC, MAX(created_at) DESC LIMIT ?`)
    .all(Date.now() - 14 * 86400_000, limit) as { tag: string; n: number }[];
}
export function whoToFollow(viewerId: string | null, limit = 3) {
  return q(`SELECT id, handle, name, bio, avatar, verified, 0 AS viewer_follows,
      (SELECT COUNT(*) FROM follows WHERE followee_id = users.id) AS f
    FROM users WHERE id != ? AND id NOT IN (SELECT followee_id FROM follows WHERE follower_id = ?)
    ORDER BY f DESC, created_at DESC LIMIT ?`).all(viewerId ?? "", viewerId ?? "", limit) as unknown as UserCard[];
}

// ---------- mutations ----------
function notify(userId: string, actorId: string, type: string, postId: string | null) {
  if (userId === actorId) return;
  q(`INSERT INTO notifications (user_id, actor_id, type, post_id, created_at) VALUES (?, ?, ?, ?, ?)`).run(userId, actorId, type, postId, Date.now());
}
const ownerOf = (postId: string) => (q(`SELECT user_id FROM posts WHERE id = ? AND deleted = 0`).get(postId) as Row | undefined)?.user_id as string | undefined;

export function createPost(userId: string, input: { text: string; images?: string[]; replyTo?: string | null; quoteOf?: string | null }) {
  const text = (input.text ?? "").trim();
  const images = (input.images ?? []).slice(0, MAX_IMAGES);
  if (!text && !images.length) throw new Error("Write something or add a photo");
  if (text.length > MAX_POST) throw new Error(`Posts are limited to ${MAX_POST} characters`);
  // Only allow the author's own uploaded media.
  const files = images.length
    ? (q(`SELECT id, file FROM media WHERE user_id = ? AND id IN (${marks(images.length)})`).all(userId, ...images) as Row[])
    : [];
  if (files.length !== images.length) throw new Error("Image upload not found");
  const fileById = new Map(files.map((f) => [f.id as string, f.file as string]));

  const replyOwner = input.replyTo ? ownerOf(input.replyTo) : null;
  if (input.replyTo && !replyOwner) throw new Error("That post no longer exists");
  const quoteOwner = input.quoteOf ? ownerOf(input.quoteOf) : null;
  if (input.quoteOf && !quoteOwner) throw new Error("That post no longer exists");

  const id = newId();
  const now = Date.now();
  tx(() => {
    q(`INSERT INTO posts (id, user_id, text, images, reply_to, quote_of, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run(id, userId, text, JSON.stringify(images.map((i) => fileById.get(i))), input.replyTo ?? null, input.quoteOf ?? null, now);
    const tags = new Set([...text.matchAll(/(^|[^\w&])#(\w{2,40})/g)].map((m) => m[2].toLowerCase()));
    for (const t of tags) q(`INSERT INTO hashtags (post_id, tag, created_at) VALUES (?, ?, ?)`).run(id, t, now);
    if (replyOwner) notify(replyOwner, userId, "reply", id);
    if (quoteOwner) notify(quoteOwner, userId, "quote", id);
    const handles = new Set([...text.matchAll(/(^|[^\w])@(\w{3,15})/g)].map((m) => m[2]));
    for (const h of handles) {
      const u = q(`SELECT id FROM users WHERE handle = ?`).get(h) as Row | undefined;
      if (u && u.id !== replyOwner) notify(u.id as string, userId, "mention", id);
    }
  });
  return id;
}

export function deletePost(userId: string, postId: string) {
  const owner = ownerOf(postId);
  if (owner !== userId) throw new Error("You can only delete your own posts");
  tx(() => {
    q(`UPDATE posts SET deleted = 1, text = '', images = '[]' WHERE id = ?`).run(postId);
    for (const t of ["hashtags", "likes", "reposts", "bookmarks"]) q(`DELETE FROM ${t} WHERE post_id = ?`).run(postId);
    q(`DELETE FROM notifications WHERE post_id = ?`).run(postId);
  });
}

export function setReaction(kind: "like" | "repost" | "bookmark", userId: string, postId: string, on: boolean) {
  const owner = ownerOf(postId);
  if (!owner) throw new Error("Post not found");
  const table = { like: "likes", repost: "reposts", bookmark: "bookmarks" }[kind];
  if (on) {
    const r = q(`INSERT OR IGNORE INTO ${table} (user_id, post_id, created_at) VALUES (?, ?, ?)`).run(userId, postId, Date.now());
    if (r.changes && kind !== "bookmark") notify(owner, userId, kind, postId);
  } else {
    q(`DELETE FROM ${table} WHERE user_id = ? AND post_id = ?`).run(userId, postId);
    if (kind !== "bookmark") q(`DELETE FROM notifications WHERE actor_id = ? AND post_id = ? AND type = ?`).run(userId, postId, kind);
  }
}

export function setFollow(userId: string, handle: string, on: boolean) {
  const target = q(`SELECT id FROM users WHERE handle = ?`).get(handle) as Row | undefined;
  if (!target) throw new Error("User not found");
  if (target.id === userId) throw new Error("You can't follow yourself");
  if (on) {
    const r = q(`INSERT OR IGNORE INTO follows (follower_id, followee_id, created_at) VALUES (?, ?, ?)`).run(userId, target.id as string, Date.now());
    if (r.changes) notify(target.id as string, userId, "follow", null);
  } else {
    q(`DELETE FROM follows WHERE follower_id = ? AND followee_id = ?`).run(userId, target.id as string);
    q(`DELETE FROM notifications WHERE actor_id = ? AND user_id = ? AND type = 'follow'`).run(userId, target.id as string);
  }
}

// ---------- notifications ----------

export function notifications(userId: string): NotificationView[] {
  const rows = q(`SELECT n.*, u.handle, u.name, u.avatar, u.verified FROM notifications n JOIN users u ON u.id = n.actor_id
                  WHERE n.user_id = ? ORDER BY n.created_at DESC LIMIT 100`).all(userId) as Row[];
  const posts = new Map(hydrate([...new Set(rows.map((r) => r.post_id as string).filter(Boolean))], userId).map((p) => [p.id, p]));
  return rows.map((r) => ({
    id: r.id as number, type: r.type as string, read: !!r.read, createdAt: r.created_at as number,
    actor: { id: r.actor_id as string, handle: r.handle as string, name: r.name as string, avatar: r.avatar as string | null, verified: r.verified as number },
    post: r.post_id ? posts.get(r.post_id as string) ?? null : null,
  }));
}
export const unreadCount = (userId: string) =>
  (q(`SELECT COUNT(*) AS n FROM notifications WHERE user_id = ? AND read = 0`).get(userId) as Row).n as number;
export const markAllRead = (userId: string) => q(`UPDATE notifications SET read = 1 WHERE user_id = ?`).run(userId);

// ---------- profile edit / media ----------
export function updateProfile(userId: string, p: { name?: string; bio?: string; location?: string; website?: string; handle?: string; avatar?: string | null; banner?: string | null }) {
  const sets: string[] = [];
  const vals: (string | null)[] = [];
  const put = (col: string, v: string | null) => { sets.push(`${col} = ?`); vals.push(v); };
  if (p.name !== undefined) { const n = p.name.trim(); if (!n || n.length > 50) throw new Error("Name must be 1–50 characters"); put("name", n); }
  if (p.bio !== undefined) { if (p.bio.length > 160) throw new Error("Bio is limited to 160 characters"); put("bio", p.bio.trim()); }
  if (p.location !== undefined) put("location", p.location.trim().slice(0, 30));
  if (p.website !== undefined) {
    const w = p.website.trim();
    if (w && !/^https?:\/\/[^\s]+$/i.test(w)) throw new Error("Website must start with http:// or https://");
    put("website", w.slice(0, 100));
  }
  if (p.handle !== undefined) put("handle", p.handle);
  for (const key of ["avatar", "banner"] as const) {
    const mid = p[key];
    if (mid === undefined) continue;
    if (mid === null) { put(key, null); continue; }
    put(key, mid);
  }
  if (!sets.length) return;
  q(`UPDATE users SET ${sets.join(", ")} WHERE id = ?`).run(...vals, userId);
}

// ---------- accounts / sessions / media ----------
const USER_COLS = `id, handle, name, email, bio, location, website, avatar, banner, verified, created_at, google_sub,
  (password_hash IS NOT NULL) AS has_password`;

export const sqliteStore: Store = {
  handleTaken: async (h) => !!q("SELECT 1 FROM users WHERE handle = ?").get(h),
  emailTaken: async (e) => !!q("SELECT 1 FROM users WHERE email = ?").get(e),
  createUser: async (u) => {
    const id = newId();
    q(`INSERT INTO users (id, handle, name, email, password_hash, google_sub, avatar, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(id, u.handle, u.name, u.email, u.passwordHash, u.googleSub ?? null, u.avatar ?? null, Date.now());
    q("INSERT OR IGNORE INTO follows (follower_id, followee_id, created_at) VALUES (?, 'robohub', ?)").run(id, Date.now());
    return id;
  },
  findLogin: async (idf) =>
    (q("SELECT id, handle, password_hash FROM users WHERE email = ? OR handle = ?").get(idf, idf) as { id: string; handle: string; password_hash: string | null } | undefined) ?? null,
  findIdByGoogleSub: async (sub) => ((q("SELECT id FROM users WHERE google_sub = ?").get(sub) as Row | undefined)?.id as string) ?? null,
  findIdByEmail: async (e) => ((q("SELECT id FROM users WHERE email = ?").get(e) as Row | undefined)?.id as string) ?? null,
  linkGoogle: async (id, sub) => { q("UPDATE users SET google_sub = ? WHERE id = ?").run(sub, id); },
  createSession: async (h, uid, exp) => { q("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)").run(h, uid, exp); },
  deleteSession: async (h) => { q("DELETE FROM sessions WHERE token_hash = ?").run(h); },
  sessionUser: async (h) =>
    (q(`SELECT ${USER_COLS} FROM users WHERE id = (SELECT user_id FROM sessions WHERE token_hash = ? AND expires_at > ?)`).get(h, Date.now()) as User | undefined) ?? null,
  addMedia: async (m) => { q("INSERT INTO media (id, user_id, file, mime, created_at) VALUES (?, ?, ?, ?, ?)").run(m.id, m.userId, m.file, m.mime, Date.now()); },
  mediaFiles: async (uid, ids) => new Map(ids.length
    ? (q(`SELECT id, file FROM media WHERE user_id = ? AND id IN (${marks(ids.length)})`).all(uid, ...ids) as Row[]).map((r) => [r.id as string, r.file as string])
    : []),
  forYou: async (v, page) => forYou(v, page),
  following: async (v, before) => following(v, before),
  countNewer: async (t, v, a) => countNewer(t, v, a),
  thread: async (id, v) => thread(id, v),
  profile: async (h, v) => profile(h, v),
  userPosts: async (u, t, v) => userPosts(u, t, v),
  bookmarks: async (v) => bookmarks(v),
  searchPosts: async (t, v) => searchPosts(t, v),
  searchUsers: async (t, v) => searchUsers(t, v),
  hashtagPosts: async (t, v) => hashtagPosts(t, v),
  trending: async (n) => trending(n),
  whoToFollow: async (v, n) => whoToFollow(v, n),
  notifications: async (u) => notifications(u),
  unreadCount: async (u) => unreadCount(u),
  createPost: async (u, p) => createPost(u, p),
  deletePost: async (u, id) => deletePost(u, id),
  setReaction: async (k, u, id, on) => setReaction(k, u, id, on),
  setFollow: async (u, h, on) => setFollow(u, h, on),
  markAllRead: async (u) => { markAllRead(u); },
  updateProfile: async (u, p) => updateProfile(u, p),
};
