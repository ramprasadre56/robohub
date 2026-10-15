import { NextResponse } from "next/server";
import { createPost, listPosts } from "@/lib/feed";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const topic = url.searchParams.get("topic") ?? "robotics";
  const sort = url.searchParams.get("sort") === "top" ? "top" : "latest";
  return NextResponse.json(await listPosts(topic, sort));
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const post = await createPost({
      topic: String(body.topic ?? "robotics"),
      author: String(body.author ?? ""),
      text: String(body.text ?? ""),
      parentId: body.parentId ? String(body.parentId) : null,
    });
    return NextResponse.json(post, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
