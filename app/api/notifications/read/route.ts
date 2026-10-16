import { markAllRead } from "@/lib/server/social";
import { json, mutate } from "@/lib/server/http";

export async function POST() {
  return mutate("notif", [60, 60_000], async (user) => {
    await markAllRead(user.id);
    return json({ ok: true });
  });
}
