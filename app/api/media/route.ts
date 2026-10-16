import { saveUpload } from "@/lib/server/media";
import { fail, json, mutate } from "@/lib/server/http";

export async function POST(req: Request) {
  return mutate("upload", [40, 10 * 60_000], async (user) => {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return fail("No file uploaded");
    return json(await saveUpload(user.id, file), 201);
  });
}
