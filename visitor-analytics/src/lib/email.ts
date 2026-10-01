/**
 * Optional outbound email. Min-budget: no provider day-1.
 * Set RESEND_API_KEY or SMTP_* to send; otherwise log + return stub.
 */

export type MailPayload = {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
};

export type MailResult =
  | { ok: true; channel: "resend" | "smtp" | "stub"; id?: string }
  | { ok: false; channel: "none"; error: string };

function recipients(to: string | string[]): string[] {
  return (Array.isArray(to) ? to : [to]).map((e) => e.trim()).filter(Boolean);
}

async function sendViaResend(
  apiKey: string,
  payload: MailPayload
): Promise<MailResult> {
  const from =
    process.env.RESEND_FROM || "SitePulse <onboarding@resend.dev>";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: recipients(payload.to),
      subject: payload.subject,
      text: payload.text,
      html: payload.html ?? undefined,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return {
      ok: false,
      channel: "none",
      error: `Resend ${res.status}: ${body.slice(0, 200)}`,
    };
  }
  const data = (await res.json().catch(() => ({}))) as { id?: string };
  return { ok: true, channel: "resend", id: data.id };
}

/**
 * Minimal SMTP via raw TCP is not available without nodemailer.
 * When SMTP_HOST is set without a transport lib, we stub-log with the intent
 * so ops can wire a provider later. Prefer RESEND_API_KEY for day-1 outbound.
 */
async function sendViaSmtpStub(payload: MailPayload): Promise<MailResult> {
  const host = process.env.SMTP_HOST;
  console.info("[sitepulse:email:smtp-stub]", {
    host,
    to: recipients(payload.to),
    subject: payload.subject,
    note: "SMTP_* set but no SMTP client bundled — logged only. Use RESEND_API_KEY for real send.",
  });
  return { ok: true, channel: "stub" };
}

export async function sendMail(payload: MailPayload): Promise<MailResult> {
  const to = recipients(payload.to);
  if (to.length === 0) {
    return { ok: false, channel: "none", error: "No recipients" };
  }

  const resendKey = process.env.RESEND_API_KEY?.trim();
  if (resendKey) {
    try {
      return await sendViaResend(resendKey, payload);
    } catch (err) {
      console.error("[sitepulse:email:resend]", err);
      return {
        ok: false,
        channel: "none",
        error: err instanceof Error ? err.message : "Resend failed",
      };
    }
  }

  if (process.env.SMTP_HOST?.trim()) {
    return sendViaSmtpStub(payload);
  }

  console.info("[sitepulse:email:stub]", {
    to,
    subject: payload.subject,
    textPreview: payload.text.slice(0, 240),
  });
  return { ok: true, channel: "stub" };
}

export function emailConfigured(): boolean {
  return Boolean(
    process.env.RESEND_API_KEY?.trim() || process.env.SMTP_HOST?.trim()
  );
}
