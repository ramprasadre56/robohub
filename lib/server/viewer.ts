import { currentUser } from "./auth";
import type { Viewer } from "@/components/social/Composer";

export async function viewer(): Promise<Viewer> {
  const u = await currentUser();
  return u ? { id: u.id, handle: u.handle, name: u.name, avatar: u.avatar } : null;
}
