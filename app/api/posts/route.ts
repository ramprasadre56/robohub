import { createPost } from "@/lib/server/social";
import { json, mutate } from "@/lib/server/http";

export async function POST(req: Request) {
  return mutate("post", [30, 10 * 60_000], async (user) => {
    const b = await req.json();
    const id = await createPost(user.id, {
      text: String(b.text ?? ""),
      images: Array.isArray(b.images) ? b.images.map(String) : [],
      replyTo: b.replyTo ? String(b.replyTo) : null,
      quoteOf: b.quoteOf ? String(b.quoteOf) : null,
    });
    return json({ id }, 201);
  });
}
