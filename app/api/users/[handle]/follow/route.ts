import { setFollow } from "@/lib/server/social";
import { json, mutate } from "@/lib/server/http";

export async function POST(req: Request, { params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  return mutate("follow", [60, 60_000], async (user) => {
    const { on } = await req.json().catch(() => ({ on: true }));
    await setFollow(user.id, handle, on !== false);
    return json({ ok: true });
  });
}
