import { NextResponse } from "next/server";
import { likePost } from "@/lib/feed";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { delta } = await req.json().catch(() => ({ delta: 1 }));
  try {
    await likePost(id, delta === -1 ? -1 : 1);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }
}
