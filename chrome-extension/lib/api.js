import { apiOrigin, apiUrl, DEFAULT_TOOL } from "./config.js";

async function cookieHeaderForOrigin(origin) {
  const cookies = await chrome.cookies.getAll({ url: origin });
  if (!cookies.length) return "";
  return cookies.map((c) => `${c.name}=${c.value}`).join("; ");
}

/**
 * Authenticated fetch to isendai.com APIs from the extension service worker.
 * Extensions with host_permissions are not subject to page CORS.
 */
export async function apiFetch(path, init = {}) {
  const origin = apiOrigin();
  const url = apiUrl(path);
  const cookie = await cookieHeaderForOrigin(origin);

  const headers = new Headers(init.headers ?? {});
  if (cookie) headers.set("Cookie", cookie);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  headers.set("Accept", "application/json");

  const res = await fetch(url, {
    ...init,
    headers,
    credentials: "omit",
    cache: "no-store",
  });

  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  return { res, json, text };
}

export async function fetchWallet() {
  const { res, json } = await apiFetch("/api/me/wallet", { method: "GET" });
  if (!res.ok) {
    const err = json?.error ?? `Wallet request failed (${res.status})`;
    throw new Error(err);
  }
  return json;
}

/**
 * @param {{ text: string; model: string; locale?: string; tool?: string }} params
 */
export async function generateMessage(params) {
  const { text, model, locale = "en", tool = DEFAULT_TOOL } = params;
  const payload = {
    tool,
    text: text.trim(),
    model,
    locale,
  };

  const { res, json } = await apiFetch("/api/generate", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (res.status === 401 || json?.code === "auth_required") {
    return { ok: false, authRequired: true, error: json?.error ?? "Sign in required." };
  }

  if (res.status === 402 || json?.code === "insufficient_credits") {
    return {
      ok: false,
      insufficientCredits: true,
      error: json?.error ?? "Insufficient credits.",
      creditsBalance: json?.credits_balance,
      creditsRequired: json?.credits_required,
    };
  }

  if (!res.ok) {
    return {
      ok: false,
      error: json?.error ?? `Generation failed (${res.status})`,
      code: json?.code,
    };
  }

  return {
    ok: true,
    result: json?.result ?? "",
    requestId: json?.request_id,
  };
}
