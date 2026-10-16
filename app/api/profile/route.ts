import { validateHandle } from "@/lib/server/auth";
import { updateProfile } from "@/lib/server/social";
import { fail, json, mutate } from "@/lib/server/http";

export async function PATCH(req: Request) {
  return mutate("profile", [20, 60_000], async (user) => {
    const b = await req.json();
    if (b.handle !== undefined && String(b.handle).toLowerCase() !== user.handle.toLowerCase()) {
      const err = await validateHandle(String(b.handle));
      if (err) return fail(err);
    }
    await updateProfile(user.id, {
      name: b.name, bio: b.bio, location: b.location, website: b.website,
      handle: b.handle !== undefined ? String(b.handle) : undefined,
      avatar: b.avatar, banner: b.banner,
    });
    return json({ ok: true });
  });
}
