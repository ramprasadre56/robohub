import { deletePost, setReaction } from "@/lib/server/social";
import { fail, json, mutate } from "@/lib/server/http";

type Ctx = { params: Promise<{ id: string; action: string }> };

export async function POST(req: Request, { params }: Ctx) {
  const { id, action } = await params;
  if (!["like", "repost", "bookmark"].includes(action)) return fail("Unknown action", 404);
  return mutate("react", [120, 60_000], async (user) => {
    const { on } = await req.json().catch(() => ({ on: true }));
    await setReaction(action as "like" | "repost" | "bookmark", user.id, id, on !== false);
    return json({ ok: true });
  });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id, action } = await params;
  if (action !== "delete") return fail("Unknown action", 404);
  return mutate("delete", [30, 60_000], async (user) => {
    await deletePost(user.id, id);
    return json({ ok: true });
  });
}
