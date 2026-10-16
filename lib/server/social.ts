// Public API used by pages and routes. Validates input, then delegates to the active store
// (SQLite locally, Firestore in production).
import { store } from "./store";
import type { ProfilePatch, Tab } from "./types";

export type { Author, NotificationView, PostView, ProfileView, UserCard } from "./types";
export const MAX_POST = 500;
export const MAX_IMAGES = 4;

export const forYou = async (v: string | null, page = 0) => (await store()).forYou(v, page);
export const following = async (v: string, before?: number) => (await store()).following(v, before);
export const countNewer = async (t: "for-you" | "following", v: string | null, after: number) => (await store()).countNewer(t, v, after);
export const thread = async (id: string, v: string | null) => (await store()).thread(id, v);
export const profile = async (h: string, v: string | null) => (await store()).profile(h, v);
export const userPosts = async (uid: string, tab: Tab, v: string | null) => (await store()).userPosts(uid, tab, v);
export const bookmarks = async (v: string) => (await store()).bookmarks(v);
export const searchPosts = async (term: string, v: string | null) => (await store()).searchPosts(term.slice(0, 100), v);
export const searchUsers = async (term: string, v: string | null) => (await store()).searchUsers(term.replace(/^@/, "").slice(0, 50), v);
export const hashtagPosts = async (tag: string, v: string | null) => (await store()).hashtagPosts(tag.toLowerCase().slice(0, 40), v);
export const trending = async (n = 6) => (await store()).trending(n);
export const whoToFollow = async (v: string | null, n = 3) => (await store()).whoToFollow(v, n);
export const notifications = async (uid: string) => (await store()).notifications(uid);
export const unreadCount = async (uid: string) => (await store()).unreadCount(uid);
export const markAllRead = async (uid: string) => (await store()).markAllRead(uid);
export const deletePost = async (uid: string, id: string) => (await store()).deletePost(uid, id);
export const setReaction = async (k: "like" | "repost" | "bookmark", uid: string, id: string, on: boolean) => (await store()).setReaction(k, uid, id, on);
export const setFollow = async (uid: string, handle: string, on: boolean) => (await store()).setFollow(uid, handle, on);

export const extractTags = (text: string) => [...new Set([...text.matchAll(/(^|[^\w&])#(\w{2,40})/g)].map((m) => m[2].toLowerCase()))].slice(0, 10);
export const extractMentions = (text: string) => [...new Set([...text.matchAll(/(^|[^\w])@(\w{3,15})/g)].map((m) => m[2]))].slice(0, 10);

export async function createPost(userId: string, input: { text: string; images?: string[]; replyTo?: string | null; quoteOf?: string | null }) {
  const text = (input.text ?? "").trim();
  const images = [...new Set(input.images ?? [])].slice(0, MAX_IMAGES);
  if (!text && !images.length) throw new Error("Write something or add a photo");
  if (text.length > MAX_POST) throw new Error(`Posts are limited to ${MAX_POST} characters`);
  return (await store()).createPost(userId, {
    text, images, replyTo: input.replyTo ?? null, quoteOf: input.quoteOf ?? null,
    tags: extractTags(text), mentions: extractMentions(text),
  });
}

export async function updateProfile(userId: string, p: { name?: string; bio?: string; location?: string; website?: string; handle?: string; avatar?: string | null; banner?: string | null }) {
  const patch: ProfilePatch = {};
  if (p.name !== undefined) { const n = String(p.name).trim(); if (!n || n.length > 50) throw new Error("Name must be 1–50 characters"); patch.name = n; }
  if (p.bio !== undefined) { const b = String(p.bio).trim(); if (b.length > 160) throw new Error("Bio is limited to 160 characters"); patch.bio = b; }
  if (p.location !== undefined) patch.location = String(p.location).trim().slice(0, 30);
  if (p.website !== undefined) {
    const w = String(p.website).trim();
    if (w && !/^https?:\/\/[^\s]+$/i.test(w)) throw new Error("Website must start with http:// or https://");
    patch.website = w.slice(0, 100);
  }
  if (p.handle !== undefined) patch.handle = p.handle;
  const s = await store();
  for (const key of ["avatar", "banner"] as const) {
    const mid = p[key];
    if (mid === undefined) continue;
    if (mid === null) { patch[key] = null; continue; }
    const file = (await s.mediaFiles(userId, [String(mid)])).get(String(mid));
    if (!file) throw new Error("Image upload not found");
    patch[key] = `/media/${file}`;
  }
  await s.updateProfile(userId, patch);
}
