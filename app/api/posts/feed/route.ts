import { currentUser } from "@/lib/server/auth";
import { countNewer } from "@/lib/server/social";
import { json } from "@/lib/server/http";

export const dynamic = "force-dynamic";

// Lightweight poll used for the "Show N posts" banner.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const tab = url.searchParams.get("tab") === "following" ? "following" : "for-you";
  const after = Number(url.searchParams.get("after")) || Date.now();
  const user = await currentUser();
  return json({ count: await countNewer(tab, user?.id ?? null, after) });
}
