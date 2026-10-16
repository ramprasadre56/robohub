// Production store on Cloud Firestore (dedicated database, default "robohub").
// Counters (likes/reposts/replies/followers/...) are denormalised and kept in sync inside transactions.
import { Firestore, FieldValue, type DocumentData, type Transaction } from "@google-cloud/firestore";
import type { Author, NotificationView, PostView, ProfileView, Store, User, UserCard, Tab } from "../types";
import { newId, PAGE, score } from "../types";
import { seedPosts, SEED_USER } from "../seed-data";

type D = DocumentData;

export function createFirestoreStore(): Store {
  const db = new Firestore({
    projectId: process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || "gen-lang-client-0582070671",
    databaseId: process.env.FIRESTORE_DB || "robohub",
    ignoreUndefinedProperties: true,
  });
  const users = db.collection("users");
  const handles = db.collection("handles");
  const emails = db.collection("emails");
  const sessions = db.collection("sessions");
  const posts = db.collection("posts");
  const likes = db.collection("likes");
  const reposts = db.collection("reposts");
  const bookmarksCol = db.collection("bookmarks");
  const follows = db.collection("follows");
  const notifs = db.collection("notifications");
  const media = db.collection("media");
  const reactionCol = { like: likes, repost: reposts, bookmark: bookmarksCol } as const;
  const counterOf = { like: "likes", repost: "reposts" } as const;

  const pairId = (a: string, b: string) => `${a}_${b}`;
  const lower = (s: string) => s.toLowerCase();

  async function getAll<T = D>(col: FirebaseFirestore.CollectionReference, ids: string[]): Promise<Map<string, T>> {
    const uniq = [...new Set(ids.filter(Boolean))];
    if (!uniq.length) return new Map();
    const snaps = await db.getAll(...uniq.map((id) => col.doc(id)));
    return new Map(snaps.filter((s) => s.exists).map((s) => [s.id, s.data() as T]));
  }
  async function existing(col: FirebaseFirestore.CollectionReference, ids: string[]) {
    return new Set((await getAll(col, ids)).keys());
  }

  // ---------- seed (official account + announcements) ----------
  let seeded: Promise<void> | null = null;
  function ensureSeed() {
    seeded ??= (async () => {
      if ((await users.doc(SEED_USER.id).get()).exists) return;
      const batch = db.batch();
      const items = seedPosts();
      batch.set(users.doc(SEED_USER.id), {
        handle: SEED_USER.handle, handleLower: SEED_USER.handle, name: SEED_USER.name, email: null, passwordHash: null, googleSub: null,
        bio: SEED_USER.bio, location: SEED_USER.location, website: "", avatar: null, banner: null, verified: 1,
        createdAt: SEED_USER.createdAt, followers: 0, following: 0, postCount: items.length,
      });
      batch.set(handles.doc(SEED_USER.handle), { userId: SEED_USER.id });
      for (const p of items) {
        batch.set(posts.doc(p.id), {
          userId: SEED_USER.id, text: p.text, images: [], link: p.link, replyTo: null, quoteOf: null, deleted: false,
          createdAt: p.createdAt, likes: 0, reposts: 0, replies: 0, tags: p.tags, hasMedia: false, isReply: false,
        });
      }
      await batch.commit();
    })().catch((e) => { seeded = null; throw e; });
    return seeded;
  }

  // ---------- user mapping ----------
  const toUser = (id: string, u: D): User => ({
    id, handle: u.handle, name: u.name, email: u.email ?? null, bio: u.bio ?? "", location: u.location ?? "", website: u.website ?? "",
    avatar: u.avatar ?? null, banner: u.banner ?? null, verified: u.verified ?? 0, created_at: u.createdAt,
    google_sub: u.googleSub ?? null, has_password: u.passwordHash ? 1 : 0,
  });
  const toAuthor = (id: string, u: D | undefined): Author =>
    u ? { id, handle: u.handle, name: u.name, avatar: u.avatar ?? null, verified: u.verified ?? 0 }
      : { id, handle: "deleted", name: "Deleted user", avatar: null, verified: 0 };
  async function userIdByHandle(h: string) {
    const s = await handles.doc(lower(h)).get();
    return s.exists ? (s.data()!.userId as string) : null;
  }
  async function followeeIds(uid: string) {
    const snap = await follows.where("followerId", "==", uid).get();
    return snap.docs.map((d) => d.data().followeeId as string);
  }

  // ---------- hydration ----------
  async function hydrateDocs(docs: { id: string; data: D }[], viewerId: string | null, withQuotes = true): Promise<PostView[]> {
    if (!docs.length) return [];
    const parentIds = docs.map((d) => d.data.replyTo).filter(Boolean) as string[];
    const parents = await getAll(posts, parentIds);
    const authorIds = [...docs.map((d) => d.data.userId), ...[...parents.values()].map((p) => p.userId)];
    const ids = docs.map((d) => d.id);
    const [authors, liked, reposted, saved, quotes] = await Promise.all([
      getAll(users, authorIds),
      viewerId ? existing(likes, ids.map((i) => pairId(viewerId, i))) : Promise.resolve(new Set<string>()),
      viewerId ? existing(reposts, ids.map((i) => pairId(viewerId, i))) : Promise.resolve(new Set<string>()),
      viewerId ? existing(bookmarksCol, ids.map((i) => pairId(viewerId, i))) : Promise.resolve(new Set<string>()),
      withQuotes ? hydrate(docs.map((d) => d.data.quoteOf).filter(Boolean), viewerId, false) : Promise.resolve([]),
    ]);
    const quoteMap = new Map(quotes.map((q) => [q.id, q]));
    return docs.map(({ id, data: p }) => {
      const deleted = !!p.deleted;
      const parent = p.replyTo ? parents.get(p.replyTo) : undefined;
      const k = viewerId ? pairId(viewerId, id) : "";
      return {
        id,
        text: deleted ? "" : p.text,
        images: deleted ? [] : (p.images as string[]).map((f) => `/media/${f}`),
        link: deleted ? null : p.link ?? null,
        createdAt: p.createdAt,
        deleted,
        replyTo: p.replyTo ?? null,
        replyToHandle: parent ? authors.get(parent.userId)?.handle ?? null : null,
        author: toAuthor(p.userId, authors.get(p.userId)),
        counts: { replies: p.replies ?? 0, reposts: p.reposts ?? 0, likes: p.likes ?? 0 },
        viewer: { liked: liked.has(k), reposted: reposted.has(k), bookmarked: saved.has(k) },
        quote: p.quoteOf && !deleted ? quoteMap.get(p.quoteOf) ?? null : null,
      };
    });
  }
  async function hydrate(ids: string[], viewerId: string | null, withQuotes = true) {
    const found = await getAll(posts, ids);
    const docs = ids.filter((id) => found.has(id)).map((id) => ({ id, data: found.get(id)! }));
    return hydrateDocs(docs, viewerId, withQuotes);
  }

  async function withReposters(items: { postId: string; t: number; reposter: string | null }[], viewerId: string | null) {
    items.sort((a, b) => b.t - a.t);
    const seen = new Set<string>();
    const top = items.filter((i) => (seen.has(i.postId) ? false : (seen.add(i.postId), true))).slice(0, PAGE);
    const [hydrated, reposters] = await Promise.all([
      hydrate(top.map((i) => i.postId), viewerId),
      getAll(users, top.map((i) => i.reposter).filter(Boolean) as string[]),
    ]);
    const byId = new Map(hydrated.map((p) => [p.id, p]));
    const out: PostView[] = [];
    for (const i of top) {
      const p = byId.get(i.postId);
      if (!p || p.deleted) continue;
      const r = i.reposter ? reposters.get(i.reposter) : undefined;
      out.push({ ...p, repostedBy: r ? { handle: r.handle, name: r.name } : null });
    }
    return out;
  }

  async function notify(tx: Transaction | null, userId: string, actorId: string, type: string, postId: string | null) {
    if (userId === actorId) return;
    const doc = { userId, actorId, type, postId, read: false, createdAt: Date.now() };
    if (tx) tx.set(notifs.doc(), doc); else await notifs.add(doc);
  }
  async function deleteWhere(q: FirebaseFirestore.Query) {
    const snap = await q.limit(400).get();
    if (snap.empty) return;
    const b = db.batch();
    snap.docs.forEach((d) => b.delete(d.ref));
    await b.commit();
  }

  const store: Store = {
    // ---------- accounts ----------
    async handleTaken(h) { return (await handles.doc(lower(h)).get()).exists; },
    async emailTaken(e) { return (await emails.doc(lower(e)).get()).exists; },
    async createUser(u) {
      await ensureSeed();
      const id = newId();
      const now = Date.now();
      await db.runTransaction(async (tx) => {
        const [h, e] = await tx.getAll(handles.doc(lower(u.handle)), emails.doc(lower(u.email)));
        if (h.exists) throw new Error("That handle is taken");
        if (e.exists) throw new Error("An account with this email already exists");
        tx.create(handles.doc(lower(u.handle)), { userId: id });
        tx.create(emails.doc(lower(u.email)), { userId: id });
        tx.create(users.doc(id), {
          handle: u.handle, handleLower: lower(u.handle), name: u.name, email: lower(u.email), passwordHash: u.passwordHash,
          googleSub: u.googleSub ?? null, bio: "", location: "", website: "", avatar: u.avatar ?? null, banner: null, verified: 0,
          createdAt: now, followers: 0, following: 1, postCount: 0,
        });
        // New users follow the official account so Following isn't empty.
        tx.create(follows.doc(pairId(id, SEED_USER.id)), { followerId: id, followeeId: SEED_USER.id, createdAt: now });
        tx.update(users.doc(SEED_USER.id), { followers: FieldValue.increment(1) });
      });
      return id;
    },
    async findLogin(identifier) {
      const idf = lower(identifier);
      const ref = (idf.includes("@") ? emails : handles).doc(idf);
      const s = await ref.get();
      if (!s.exists) return null;
      const u = await users.doc(s.data()!.userId).get();
      if (!u.exists) return null;
      return { id: u.id, handle: u.data()!.handle, password_hash: u.data()!.passwordHash ?? null };
    },
    async findIdByGoogleSub(sub) {
      const s = await users.where("googleSub", "==", sub).limit(1).get();
      return s.empty ? null : s.docs[0].id;
    },
    async findIdByEmail(e) {
      const s = await emails.doc(lower(e)).get();
      return s.exists ? (s.data()!.userId as string) : null;
    },
    async linkGoogle(id, sub) { await users.doc(id).update({ googleSub: sub }); },
    async createSession(h, uid, exp) { await sessions.doc(h).set({ userId: uid, expiresAt: exp }); },
    async deleteSession(h) { await sessions.doc(h).delete(); },
    async sessionUser(h) {
      const s = await sessions.doc(h).get();
      if (!s.exists || s.data()!.expiresAt < Date.now()) return null;
      const u = await users.doc(s.data()!.userId).get();
      return u.exists ? toUser(u.id, u.data()!) : null;
    },

    // ---------- media ----------
    async addMedia(m) { await media.doc(m.id).set({ userId: m.userId, file: m.file, mime: m.mime, createdAt: Date.now() }); },
    async mediaFiles(uid, ids) {
      const found = await getAll(media, ids);
      return new Map([...found].filter(([, m]) => m.userId === uid).map(([id, m]) => [id, m.file as string]));
    },

    // ---------- feeds ----------
    async forYou(viewerId, page) {
      await ensureSeed();
      const snap = await posts.orderBy("createdAt", "desc").limit(400).get();
      const now = Date.now();
      const ranked = snap.docs
        .map((d) => ({ id: d.id, data: d.data() }))
        .filter((d) => !d.data.isReply && !d.data.deleted)
        .map((d) => ({ ...d, s: score((d.data.likes ?? 0) + 2 * (d.data.reposts ?? 0) + (d.data.replies ?? 0), d.data.createdAt, now) }))
        .sort((a, b) => b.s - a.s)
        .slice(page * PAGE, page * PAGE + PAGE);
      return hydrateDocs(ranked, viewerId);
    },
    async following(viewerId, before) {
      const ids = [viewerId, ...(await followeeIds(viewerId))];
      const t = before ?? Date.now() + 1;
      const items: { postId: string; t: number; reposter: string | null }[] = [];
      for (let i = 0; i < ids.length; i += 30) {
        const chunk = ids.slice(i, i + 30);
        const repChunk = chunk.filter((x) => x !== viewerId);
        const [ps, rs] = await Promise.all([
          posts.where("userId", "in", chunk).where("createdAt", "<", t).orderBy("createdAt", "desc").limit(60).get(),
          repChunk.length ? reposts.where("userId", "in", repChunk).where("createdAt", "<", t).orderBy("createdAt", "desc").limit(PAGE).get() : null,
        ]);
        ps.docs.forEach((d) => { const p = d.data(); if (!p.isReply && !p.deleted) items.push({ postId: d.id, t: p.createdAt, reposter: null }); });
        rs?.docs.forEach((d) => items.push({ postId: d.data().postId, t: d.data().createdAt, reposter: d.data().userId }));
      }
      return withReposters(items, viewerId);
    },
    async countNewer(tab, viewerId, after) {
      const snap = await posts.where("createdAt", ">", after).orderBy("createdAt", "desc").limit(100).get();
      const set = tab === "following" && viewerId ? new Set(await followeeIds(viewerId)) : null;
      return snap.docs.filter((d) => { const p = d.data(); return !p.isReply && !p.deleted && p.userId !== viewerId && (!set || set.has(p.userId)); }).length;
    },

    // ---------- threads / profiles ----------
    async thread(id, viewerId) {
      const [post] = await hydrate([id], viewerId);
      if (!post) return null;
      const ancestors: PostView[] = [];
      let parent = post.replyTo;
      for (let i = 0; parent && i < 10; i++) {
        const [p] = await hydrate([parent], viewerId);
        if (!p) break;
        ancestors.unshift(p);
        parent = p.replyTo;
      }
      const rs = await posts.where("replyTo", "==", id).limit(300).get();
      const replies = rs.docs.map((d) => ({ id: d.id, data: d.data() })).filter((d) => !d.data.deleted)
        .sort((a, b) => (b.data.likes ?? 0) - (a.data.likes ?? 0) || a.data.createdAt - b.data.createdAt).slice(0, 200);
      return { post, ancestors, replies: await hydrateDocs(replies, viewerId) };
    },
    async profile(handle, viewerId) {
      await ensureSeed();
      const uid = await userIdByHandle(handle);
      if (!uid) return null;
      const [u, vf, fv] = await Promise.all([
        users.doc(uid).get(),
        viewerId ? follows.doc(pairId(viewerId, uid)).get() : null,
        viewerId ? follows.doc(pairId(uid, viewerId)).get() : null,
      ]);
      if (!u.exists) return null;
      const d = u.data()!;
      return {
        id: uid, handle: d.handle, name: d.name, bio: d.bio ?? "", location: d.location ?? "", website: d.website ?? "",
        avatar: d.avatar ?? null, banner: d.banner ?? null, verified: d.verified ?? 0, created_at: d.createdAt,
        followers: d.followers ?? 0, following: d.following ?? 0, posts: d.postCount ?? 0,
        viewer_follows: vf?.exists ? 1 : 0, follows_viewer: fv?.exists ? 1 : 0,
      } satisfies ProfileView;
    },
    async userPosts(uid, tab: Tab, viewerId) {
      if (tab === "likes") {
        const s = await likes.where("userId", "==", uid).orderBy("createdAt", "desc").limit(60).get();
        return (await hydrate(s.docs.map((d) => d.data().postId), viewerId)).filter((p) => !p.deleted);
      }
      const own = await posts.where("userId", "==", uid).orderBy("createdAt", "desc").limit(100).get();
      const mine = own.docs.map((d) => ({ id: d.id, data: d.data() })).filter((d) => !d.data.deleted);
      if (tab === "replies") return hydrateDocs(mine.filter((d) => d.data.isReply).slice(0, 60), viewerId);
      if (tab === "media") return hydrateDocs(mine.filter((d) => d.data.hasMedia).slice(0, 60), viewerId);
      const rs = await reposts.where("userId", "==", uid).orderBy("createdAt", "desc").limit(PAGE).get();
      return withReposters([
        ...mine.filter((d) => !d.data.isReply).map((d) => ({ postId: d.id, t: d.data.createdAt, reposter: null })),
        ...rs.docs.map((d) => ({ postId: d.data().postId, t: d.data().createdAt, reposter: uid })),
      ], viewerId);
    },
    async bookmarks(viewerId) {
      const s = await bookmarksCol.where("userId", "==", viewerId).orderBy("createdAt", "desc").limit(100).get();
      return (await hydrate(s.docs.map((d) => d.data().postId), viewerId)).filter((p) => !p.deleted);
    },

    // ---------- explore ----------
    async searchPosts(term, viewerId) {
      const t = lower(term);
      const s = await posts.orderBy("createdAt", "desc").limit(1000).get();
      const hits = s.docs.map((d) => ({ id: d.id, data: d.data() }))
        .filter((d) => !d.data.deleted && lower(d.data.text ?? "").includes(t)).slice(0, 60);
      return hydrateDocs(hits, viewerId);
    },
    async searchUsers(term, viewerId) {
      const t = lower(term);
      const s = await users.limit(2000).get();
      const hits = s.docs.filter((d) => d.data().handleLower?.includes(t) || lower(d.data().name ?? "").includes(t)).slice(0, 20);
      const fol = viewerId ? await existing(follows, hits.map((d) => pairId(viewerId, d.id))) : new Set<string>();
      return hits.map((d) => {
        const u = d.data();
        return { id: d.id, handle: u.handle, name: u.name, bio: u.bio ?? "", avatar: u.avatar ?? null, verified: u.verified ?? 0,
          viewer_follows: viewerId && fol.has(pairId(viewerId, d.id)) ? 1 : 0 } satisfies UserCard;
      });
    },
    async hashtagPosts(tag, viewerId) {
      const s = await posts.where("tags", "array-contains", lower(tag)).limit(300).get();
      const hits = s.docs.map((d) => ({ id: d.id, data: d.data() })).filter((d) => !d.data.deleted)
        .sort((a, b) => b.data.createdAt - a.data.createdAt).slice(0, 100);
      return hydrateDocs(hits, viewerId);
    },
    async trending(limit) {
      await ensureSeed();
      const s = await posts.where("createdAt", ">", Date.now() - 14 * 86400_000).orderBy("createdAt", "desc").limit(1000).get();
      const counts = new Map<string, { n: number; last: number }>();
      for (const d of s.docs) {
        const p = d.data();
        if (p.deleted) continue;
        for (const tag of p.tags ?? []) {
          const c = counts.get(tag) ?? { n: 0, last: 0 };
          c.n++; c.last = Math.max(c.last, p.createdAt);
          counts.set(tag, c);
        }
      }
      return [...counts].sort((a, b) => b[1].n - a[1].n || b[1].last - a[1].last).slice(0, limit).map(([tag, c]) => ({ tag, n: c.n }));
    },
    async whoToFollow(viewerId, limit) {
      await ensureSeed();
      const [s, fol] = await Promise.all([
        users.orderBy("followers", "desc").limit(50).get(),
        viewerId ? followeeIds(viewerId) : Promise.resolve([] as string[]),
      ]);
      const skip = new Set([...fol, viewerId ?? ""]);
      return s.docs.filter((d) => !skip.has(d.id)).slice(0, limit).map((d) => {
        const u = d.data();
        return { id: d.id, handle: u.handle, name: u.name, bio: u.bio ?? "", avatar: u.avatar ?? null, verified: u.verified ?? 0, viewer_follows: 0 };
      });
    },

    // ---------- notifications ----------
    async notifications(uid) {
      const s = await notifs.where("userId", "==", uid).orderBy("createdAt", "desc").limit(100).get();
      const rows = s.docs.map((d) => ({ id: d.id, ...d.data() }) as D);
      const [actors, ps] = await Promise.all([
        getAll(users, rows.map((r) => r.actorId)),
        hydrate([...new Set(rows.map((r) => r.postId).filter(Boolean))] as string[], uid),
      ]);
      const pm = new Map(ps.map((p) => [p.id, p]));
      return rows.map((r) => ({
        id: r.id, type: r.type, read: !!r.read, createdAt: r.createdAt,
        actor: toAuthor(r.actorId, actors.get(r.actorId)),
        post: r.postId ? pm.get(r.postId) ?? null : null,
      }) satisfies NotificationView);
    },
    async unreadCount(uid) {
      const s = await notifs.where("userId", "==", uid).where("read", "==", false).count().get();
      return s.data().count;
    },
    async markAllRead(uid) {
      const s = await notifs.where("userId", "==", uid).where("read", "==", false).limit(450).get();
      if (s.empty) return;
      const b = db.batch();
      s.docs.forEach((d) => b.update(d.ref, { read: true }));
      await b.commit();
    },

    // ---------- writes ----------
    async createPost(uid, p) {
      const files = await store.mediaFiles(uid, p.images);
      if (files.size !== p.images.length) throw new Error("Image upload not found");
      const mentionIds = (await Promise.all(p.mentions.map(userIdByHandle))).filter(Boolean) as string[];
      const id = newId();
      const now = Date.now();
      await db.runTransaction(async (tx) => {
        const [parent, quoted] = await Promise.all([
          p.replyTo ? tx.get(posts.doc(p.replyTo)) : null,
          p.quoteOf ? tx.get(posts.doc(p.quoteOf)) : null,
        ]);
        if (p.replyTo && (!parent?.exists || parent.data()!.deleted)) throw new Error("That post no longer exists");
        if (p.quoteOf && (!quoted?.exists || quoted.data()!.deleted)) throw new Error("That post no longer exists");
        tx.create(posts.doc(id), {
          userId: uid, text: p.text, images: p.images.map((m) => files.get(m)), link: null, replyTo: p.replyTo, quoteOf: p.quoteOf,
          deleted: false, createdAt: now, likes: 0, reposts: 0, replies: 0, tags: p.tags, hasMedia: p.images.length > 0, isReply: !!p.replyTo,
        });
        tx.update(users.doc(uid), { postCount: FieldValue.increment(1) });
        const replyOwner = parent?.data()!.userId as string | undefined;
        if (parent) { tx.update(parent.ref, { replies: FieldValue.increment(1) }); await notify(tx, replyOwner!, uid, "reply", id); }
        if (quoted) await notify(tx, quoted.data()!.userId, uid, "quote", id);
        for (const m of new Set(mentionIds)) if (m !== replyOwner) await notify(tx, m, uid, "mention", id);
      });
      return id;
    },
    async deletePost(uid, postId) {
      await db.runTransaction(async (tx) => {
        const s = await tx.get(posts.doc(postId));
        if (!s.exists || s.data()!.deleted || s.data()!.userId !== uid) throw new Error("You can only delete your own posts");
        const p = s.data()!;
        tx.update(s.ref, { deleted: true, text: "", images: [], tags: [], hasMedia: false });
        tx.update(users.doc(uid), { postCount: FieldValue.increment(-1) });
        if (p.replyTo) tx.update(posts.doc(p.replyTo), { replies: FieldValue.increment(-1) });
      });
      await Promise.all([likes, reposts, bookmarksCol, notifs].map((c) => deleteWhere(c.where("postId", "==", postId))));
    },
    async setReaction(kind, uid, postId, on) {
      const ref = reactionCol[kind].doc(pairId(uid, postId));
      let changed = false;
      let owner = "";
      await db.runTransaction(async (tx) => {
        const [p, r] = await tx.getAll(posts.doc(postId), ref);
        if (!p.exists || p.data()!.deleted) throw new Error("Post not found");
        owner = p.data()!.userId;
        changed = on !== r.exists;
        if (!changed) return;
        if (on) tx.create(ref, { userId: uid, postId, createdAt: Date.now() }); else tx.delete(ref);
        if (kind !== "bookmark") {
          tx.update(p.ref, { [counterOf[kind]]: FieldValue.increment(on ? 1 : -1) });
          if (on) await notify(tx, owner, uid, kind, postId);
        }
      });
      if (changed && !on && kind !== "bookmark") {
        await deleteWhere(notifs.where("actorId", "==", uid).where("postId", "==", postId).where("type", "==", kind));
      }
    },
    async setFollow(uid, handle, on) {
      const target = await userIdByHandle(handle);
      if (!target) throw new Error("User not found");
      if (target === uid) throw new Error("You can't follow yourself");
      const ref = follows.doc(pairId(uid, target));
      let changed = false;
      await db.runTransaction(async (tx) => {
        const f = await tx.get(ref);
        changed = on !== f.exists;
        if (!changed) return;
        if (on) tx.create(ref, { followerId: uid, followeeId: target, createdAt: Date.now() }); else tx.delete(ref);
        tx.update(users.doc(uid), { following: FieldValue.increment(on ? 1 : -1) });
        tx.update(users.doc(target), { followers: FieldValue.increment(on ? 1 : -1) });
        if (on) await notify(tx, target, uid, "follow", null);
      });
      if (changed && !on) await deleteWhere(notifs.where("actorId", "==", uid).where("userId", "==", target).where("type", "==", "follow"));
    },
    async updateProfile(uid, p) {
      const patch: D = {};
      for (const k of ["name", "bio", "location", "website", "avatar", "banner"] as const) if (p[k] !== undefined) patch[k] = p[k];
      await db.runTransaction(async (tx) => {
        const u = await tx.get(users.doc(uid));
        if (!u.exists) throw new Error("User not found");
        if (p.handle !== undefined && lower(p.handle) !== u.data()!.handleLower) {
          const h = await tx.get(handles.doc(lower(p.handle)));
          if (h.exists) throw new Error("That handle is taken");
          tx.create(handles.doc(lower(p.handle)), { userId: uid });
          tx.delete(handles.doc(u.data()!.handleLower));
          patch.handle = p.handle;
          patch.handleLower = lower(p.handle);
        } else if (p.handle !== undefined && p.handle !== u.data()!.handle) {
          patch.handle = p.handle; // case-only change
        }
        if (Object.keys(patch).length) tx.update(u.ref, patch);
      });
    },
  };
  return store;
}

