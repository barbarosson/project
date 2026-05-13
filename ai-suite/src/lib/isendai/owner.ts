import { cookies, headers } from "next/headers";
import crypto from "crypto";

import { ANON_COOKIE, ANON_ID_REQUEST_HEADER } from "@/lib/isendai/anon-cookie";

export type Owner =
  | { owner_type: "user"; owner_id: string; email?: string | null }
  | { owner_type: "anon"; owner_id: string; email?: string | null };

function uuid() {
  return typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (crypto.randomBytes(1)[0] ?? 0) % 16;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
}

/**
 * Anonymous owner id for this request.
 * Middleware sets {@link ANON_ID_REQUEST_HEADER} and the {@link ANON_COOKIE} when missing
 * (Server Components must not call `cookies().set` — it breaks on Netlify / Next App Router).
 */
export async function getOrCreateAnonId(): Promise<string> {
  const h = await headers();
  const fromMiddleware = h.get(ANON_ID_REQUEST_HEADER)?.trim();
  if (fromMiddleware && fromMiddleware.length > 10) {
    return fromMiddleware;
  }

  const store = await cookies();
  const existing = store.get(ANON_COOKIE)?.value?.trim();
  if (existing && existing.length > 10) {
    return existing;
  }

  return uuid();
}

export { ANON_COOKIE } from "@/lib/isendai/anon-cookie";
