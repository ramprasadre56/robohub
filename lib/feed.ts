import { Firestore, FieldValue } from "@google-cloud/firestore";
import { news, hackathons } from "@/lib/data";

export type Post = {
  id: string;
  topic: string;
  parentId: string | null;
  author: string;
  text: string;
  link?: string | null;
  likes: number;
  replyCount: number;
  createdAt: number; // epoch ms
  official?: boolean;
};

export const TOPICS: Record<string, { name: string; about: string }> = {
  robotics: {
    name: "Robotics",
    about: "Humanoids, drones, robot learning, ROS 2, hardware builds and hackathon chatter.",
  },
};

export const MAX_LEN = 500;
const COLLECTION = "robohub_posts";

// ---------- storage backends ----------
interface Store {
  list(topic: string): Promise<Post[]>;
  replies(parentId: string): Promise<Post[]>;
  get(id: string): Promise<Post | null>;
  create(p: Omit<Post, "id" | "likes" | "replyCount" | "createdAt">): Promise<Post>;
  like(id: string, delta: 1 | -1): Promise<void>;
  seed(posts: Post[]): Promise<void>;
}

class MemoryStore implements Store {
  private posts = new Map<string, Post>();
  async list(topic: string) { return [...this.posts.values()].filter((p) => p.topic === topic); }
  async replies(parentId: string) { return [...this.posts.values()].filter((p) => p.parentId === parentId); }
  async get(id: string) { return this.posts.get(id) ?? null; }
  async create(p: Omit<Post, "id" | "likes" | "replyCount" | "createdAt">) {
    const post: Post = { ...p, id: crypto.randomUUID(), likes: 0, replyCount: 0, createdAt: Date.now() };
    this.posts.set(post.id, post);
    if (p.parentId) { const parent = this.posts.get(p.parentId); if (parent) parent.replyCount++; }
    return post;
  }
  async like(id: string, delta: 1 | -1) { const p = this.posts.get(id); if (p) p.likes = Math.max(0, p.likes + delta); }
  async seed(posts: Post[]) { for (const p of posts) if (!this.posts.has(p.id)) this.posts.set(p.id, p); }
}

class FirestoreStore implements Store {
  private db = new Firestore({
    projectId: process.env.GOOGLE_CLOUD_PROJECT || "gen-lang-client-0582070671",
    ignoreUndefinedProperties: true,
  });
  private col = this.db.collection(COLLECTION);
  private toPost(id: string, d: FirebaseFirestore.DocumentData): Post {
    return { id, ...(d as Omit<Post, "id">) };
  }
  // Equality-only queries: no composite index needed; sorting happens in memory.
  async list(topic: string) {
    const snap = await this.col.where("topic", "==", topic).limit(1000).get();
    return snap.docs.map((d) => this.toPost(d.id, d.data()));
  }
  async replies(parentId: string) {
    const snap = await this.col.where("parentId", "==", parentId).limit(500).get();
    return snap.docs.map((d) => this.toPost(d.id, d.data()));
  }
  async get(id: string) {
    const d = await this.col.doc(id).get();
    return d.exists ? this.toPost(d.id, d.data()!) : null;
  }
  async create(p: Omit<Post, "id" | "likes" | "replyCount" | "createdAt">) {
    const data = { ...p, likes: 0, replyCount: 0, createdAt: Date.now() };
    const ref = this.col.doc();
    const batch = this.db.batch();
    batch.set(ref, data);
    if (p.parentId) batch.update(this.col.doc(p.parentId), { replyCount: FieldValue.increment(1) });
    await batch.commit();
    return { id: ref.id, ...data };
  }
  async like(id: string, delta: 1 | -1) {
    await this.col.doc(id).update({ likes: FieldValue.increment(delta) });
  }
  async seed(posts: Post[]) {
    const batch = this.db.batch();
    for (const { id, ...rest } of posts) batch.create(this.col.doc(id), rest);
    await batch.commit().catch(() => {}); // already seeded by a concurrent request
  }
}

// One shared instance per server process (route handlers and pages are bundled separately).
const g = globalThis as unknown as { __robohubStore?: Store };
function getStore(): Store {
  if (g.__robohubStore) return g.__robohubStore;
  const useMemory = process.env.FEED_STORE === "memory" || (process.env.NODE_ENV !== "production" && process.env.FEED_STORE !== "firestore");
  g.__robohubStore = useMemory ? new MemoryStore() : new FirestoreStore();
  return g.__robohubStore;
}

// ---------- seed content (official RoboHub posts, no invented people) ----------
function seedPosts(topic: string): Post[] {
  const base = Date.parse("2026-10-15T06:00:00Z");
  const fromNews: Post[] = news.slice(0, 8).map((n, i) => ({
    id: `seed-news-${n.slug}`,
    topic, parentId: null, author: "RoboHub News", official: true,
    text: `${n.title}. What do you make of it?`,
    link: n.url, likes: 0, replyCount: 0, createdAt: base - i * 3_600_000,
  }));
  const fromHacks: Post[] = hackathons.filter((h) => h.status === "open").map((h, i) => ({
    id: `seed-hack-${h.slug}`,
    topic, parentId: null, author: "RoboHub", official: true,
    text: `Registration is open for ${h.title}: ${h.tagline} Looking for teammates? Reply here with your skills.`,
    link: `/hackathons/${h.slug}`, likes: 0, replyCount: 0, createdAt: base + (i + 1) * 1_800_000,
  }));
  return [...fromHacks, ...fromNews];
}

// ---------- public API ----------
export async function listPosts(topic: string, sort: "latest" | "top" = "latest") {
  const s = getStore();
  let all = await s.list(topic);
  if (!all.length) { await s.seed(seedPosts(topic)); all = await s.list(topic); }
  const roots = all.filter((p) => !p.parentId);
  return sort === "top"
    ? roots.sort((a, b) => b.likes + b.replyCount * 2 - (a.likes + a.replyCount * 2) || b.createdAt - a.createdAt)
    : roots.sort((a, b) => b.createdAt - a.createdAt);
}

export async function getThread(id: string) {
  const s = getStore();
  const post = await s.get(id);
  if (!post) return null;
  const replies = (await s.replies(id)).sort((a, b) => a.createdAt - b.createdAt);
  return { post, replies };
}

export async function createPost(input: { topic: string; author: string; text: string; parentId?: string | null }) {
  const author = input.author.trim().slice(0, 40);
  const text = input.text.trim();
  if (!TOPICS[input.topic]) throw new Error("Unknown topic");
  if (!author) throw new Error("Please enter your name");
  if (!text) throw new Error("Post can't be empty");
  if (text.length > MAX_LEN) throw new Error(`Keep it under ${MAX_LEN} characters`);
  if (input.parentId && !(await getStore().get(input.parentId))) throw new Error("Post not found");
  return getStore().create({ topic: input.topic, author, text, parentId: input.parentId ?? null, link: null });
}

export async function likePost(id: string, delta: 1 | -1) {
  await getStore().like(id, delta);
}
