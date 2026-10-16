// Shared types + the storage interface implemented by SQLite (local dev) and Firestore (production).

export type Author = { id: string; handle: string; name: string; avatar: string | null; verified: number };
export type PostView = {
  id: string; text: string; images: string[]; link: string | null; createdAt: number; deleted: boolean;
  replyTo: string | null; replyToHandle: string | null; author: Author;
  counts: { replies: number; reposts: number; likes: number };
  viewer: { liked: boolean; reposted: boolean; bookmarked: boolean };
  quote: PostView | null;
  repostedBy?: { handle: string; name: string } | null;
};
export type ProfileView = {
  id: string; handle: string; name: string; bio: string; location: string; website: string; avatar: string | null;
  banner: string | null; verified: number; created_at: number; followers: number; following: number; posts: number;
  viewer_follows: number; follows_viewer: number;
};
export type UserCard = { id: string; handle: string; name: string; bio: string; avatar: string | null; verified: number; viewer_follows: number };
export type NotificationView = { id: string | number; type: string; read: boolean; createdAt: number; actor: Author; post: PostView | null };
export type User = {
  id: string; handle: string; name: string; email: string | null; bio: string; location: string;
  website: string; avatar: string | null; banner: string | null; verified: number; created_at: number;
  google_sub: string | null; has_password: number;
};
export type ProfilePatch = { name?: string; bio?: string; location?: string; website?: string; handle?: string; avatar?: string | null; banner?: string | null };
export type NewPost = { text: string; images: string[]; replyTo: string | null; quoteOf: string | null; tags: string[]; mentions: string[] };
export type Tab = "posts" | "replies" | "media" | "likes";

export interface Store {
  // accounts & sessions
  handleTaken(handle: string): Promise<boolean>;
  emailTaken(email: string): Promise<boolean>;
  createUser(u: { handle: string; name: string; email: string; passwordHash: string | null; googleSub?: string | null; avatar?: string | null }): Promise<string>;
  findLogin(identifier: string): Promise<{ id: string; handle: string; password_hash: string | null } | null>;
  findIdByGoogleSub(sub: string): Promise<string | null>;
  findIdByEmail(email: string): Promise<string | null>;
  linkGoogle(userId: string, sub: string): Promise<void>;
  createSession(tokenHash: string, userId: string, expiresAt: number): Promise<void>;
  deleteSession(tokenHash: string): Promise<void>;
  sessionUser(tokenHash: string): Promise<User | null>;
  // media
  addMedia(m: { id: string; userId: string; file: string; mime: string }): Promise<void>;
  mediaFiles(userId: string, ids: string[]): Promise<Map<string, string>>; // id -> file (owned by user)
  // social reads
  forYou(viewerId: string | null, page: number): Promise<PostView[]>;
  following(viewerId: string, before?: number): Promise<PostView[]>;
  countNewer(tab: "for-you" | "following", viewerId: string | null, after: number): Promise<number>;
  thread(id: string, viewerId: string | null): Promise<{ post: PostView; ancestors: PostView[]; replies: PostView[] } | null>;
  profile(handle: string, viewerId: string | null): Promise<ProfileView | null>;
  userPosts(userId: string, tab: Tab, viewerId: string | null): Promise<PostView[]>;
  bookmarks(viewerId: string): Promise<PostView[]>;
  searchPosts(term: string, viewerId: string | null): Promise<PostView[]>;
  searchUsers(term: string, viewerId: string | null): Promise<UserCard[]>;
  hashtagPosts(tag: string, viewerId: string | null): Promise<PostView[]>;
  trending(limit: number): Promise<{ tag: string; n: number }[]>;
  whoToFollow(viewerId: string | null, limit: number): Promise<UserCard[]>;
  notifications(userId: string): Promise<NotificationView[]>;
  unreadCount(userId: string): Promise<number>;
  // social writes
  createPost(userId: string, p: NewPost): Promise<string>;
  deletePost(userId: string, postId: string): Promise<void>;
  setReaction(kind: "like" | "repost" | "bookmark", userId: string, postId: string, on: boolean): Promise<void>;
  setFollow(userId: string, handle: string, on: boolean): Promise<void>;
  markAllRead(userId: string): Promise<void>;
  updateProfile(userId: string, p: ProfilePatch): Promise<void>; // avatar/banner are already URLs here
}

export const PAGE = 20;
export function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}
export function score(eng: number, createdAt: number, now = Date.now()) {
  return (eng + 1) / Math.pow((now - createdAt) / 3600_000 + 2, 1.3);
}
