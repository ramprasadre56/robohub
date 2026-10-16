import crypto from "node:crypto";
import { blob } from "./blob";
import { store } from "./store";
import { newId } from "./types";

export const MAX_BYTES = 5 * 1024 * 1024;

const SIGS: { mime: string; ext: string; test: (b: Buffer) => boolean }[] = [
  { mime: "image/jpeg", ext: "jpg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: "image/png", ext: "png", test: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { mime: "image/gif", ext: "gif", test: (b) => b.subarray(0, 4).toString("ascii") === "GIF8" },
  { mime: "image/webp", ext: "webp", test: (b) => b.subarray(0, 4).toString("ascii") === "RIFF" && b.subarray(8, 12).toString("ascii") === "WEBP" },
];
const MIME: Record<string, string> = { jpg: "image/jpeg", png: "image/png", gif: "image/gif", webp: "image/webp" };

/** Validates by file signature (not the client-supplied type) and stores the image. */
export async function saveUpload(userId: string, file: File) {
  if (file.size > MAX_BYTES) throw new Error("Images must be under 5 MB");
  const buf = Buffer.from(await file.arrayBuffer());
  const kind = SIGS.find((s) => s.test(buf));
  if (!kind) throw new Error("Only JPEG, PNG, GIF or WebP images are allowed");
  const id = newId();
  const name = `${crypto.randomBytes(12).toString("hex")}.${kind.ext}`;
  await (await blob()).save(name, buf, kind.mime);
  await (await store()).addMedia({ id, userId, file: name, mime: kind.mime });
  return { id, url: `/media/${name}` };
}

export async function readMedia(file: string) {
  if (!/^[a-f0-9]{24}\.(jpg|png|gif|webp)$/.test(file)) return null;
  const data = await (await blob()).read(file);
  return data ? { data, mime: MIME[file.split(".").pop()!] } : null;
}
