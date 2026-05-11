import { cookies } from "next/headers";
import crypto from "crypto";

export const ANON_COOKIE = "isendai_anon_id";

export type Owner =
  | { owner_type: "user"; owner_id: string; email?: string | null }
  | { owner_type: "anon"; owner_id: string; email?: string | null };

function uuid() {
  // Node 18+ supports crypto.randomUUID; keep a fallback.
  return typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (crypto.randomBytes(1)[0] ?? 0) % 16;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
}

export async function getOrCreateAnonId(): Promise<string> {
  const store = await cookies();
  const existing = store.get(ANON_COOKIE)?.value;
  if (existing && existing.length > 10) return existing;
  const id = uuid();
  store.set(ANON_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return id;
}

