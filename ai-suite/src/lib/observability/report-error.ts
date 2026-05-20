/** Lightweight error reporting (console + optional webhook). No Sentry package required. */

export type ErrorReport = {
  message: string;
  digest?: string;
  scope?: string;
  path?: string;
  stack?: string;
};

export async function reportServerError(report: ErrorReport): Promise<void> {
  const payload = { ...report, at: new Date().toISOString(), runtime: "server" as const };
  console.error("[isendai:error]", payload);
  await postWebhook(payload);
}

export async function reportClientError(report: ErrorReport): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    await fetch("/api/client-error", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(report),
      keepalive: true,
    });
  } catch {
    // ignore beacon failures
  }
}

async function postWebhook(payload: Record<string, unknown>): Promise<void> {
  const url = process.env.ERROR_WEBHOOK_URL?.trim();
  if (!url) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    // optional integration (Slack/Discord custom webhook)
  }
}
