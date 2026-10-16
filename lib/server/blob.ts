// Image file storage: local ./data/uploads in development, Google Cloud Storage in production (BLOB=gcs).
import fs from "node:fs";
import path from "node:path";
import { UPLOAD_DIR } from "./paths";

type Blob = { save(name: string, data: Buffer, mime: string): Promise<void>; read(name: string): Promise<Buffer | null> };

const local: Blob = {
  async save(name, data) { fs.mkdirSync(UPLOAD_DIR, { recursive: true }); fs.writeFileSync(path.join(UPLOAD_DIR, name), data); },
  async read(name) { const p = path.join(UPLOAD_DIR, name); return fs.existsSync(p) ? fs.readFileSync(p) : null; },
};

let gcs: Promise<Blob> | null = null;
function cloud(): Promise<Blob> {
  gcs ??= import("@google-cloud/storage").then(({ Storage }) => {
    const bucket = new Storage().bucket(process.env.MEDIA_BUCKET!);
    return {
      async save(name, data, mime) {
        await bucket.file(`uploads/${name}`).save(data, { contentType: mime, resumable: false, metadata: { cacheControl: "public, max-age=31536000, immutable" } });
      },
      async read(name) {
        try { const [buf] = await bucket.file(`uploads/${name}`).download(); return buf; }
        catch (e) { if ((e as { code?: number }).code === 404) return null; throw e; }
      },
    };
  });
  return gcs;
}

export const blob = (): Promise<Blob> => (process.env.BLOB === "gcs" ? cloud() : Promise.resolve(local));
