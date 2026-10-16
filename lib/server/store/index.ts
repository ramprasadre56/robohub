import type { Store } from "../types";

// STORE=firestore in production (Cloud Run); SQLite file in ./data for local development.
const g = globalThis as unknown as { __rhStore?: Promise<Store> };

export function store(): Promise<Store> {
  if (!g.__rhStore) {
    g.__rhStore = process.env.STORE === "firestore"
      ? import("./firestore").then((m) => m.createFirestoreStore())
      : import("./sqlite").then((m) => m.sqliteStore);
  }
  return g.__rhStore;
}
