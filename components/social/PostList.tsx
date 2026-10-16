import PostCard from "./PostCard";
import type { Viewer } from "./Composer";
import type { PostView } from "@/lib/server/social";

export default function PostList({ posts, viewer, empty }: { posts: PostView[]; viewer: Viewer; empty?: string }) {
  if (!posts.length) return <p className="empty muted">{empty ?? "Nothing here yet."}</p>;
  return <>{posts.map((p) => <PostCard key={(p.repostedBy?.handle ?? "") + p.id} post={p} viewer={viewer} />)}</>;
}
