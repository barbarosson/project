import type { SupabaseClient } from "@supabase/supabase-js";

import { createSupabaseAdminClientOrNull } from "@/lib/supabase/admin";

export type ContactInquiryInput = {
  name: string;
  email: string;
  subject?: string | null;
  message: string;
  userId?: string | null;
  locale?: string | null;
  sourcePath?: string | null;
};

const MAX_NAME = 120;
const MAX_EMAIL = 254;
const MAX_SUBJECT = 200;
const MAX_MESSAGE = 4000;

function clip(value: string, max: number): string {
  const t = value.trim();
  return t.length <= max ? t : t.slice(0, max);
}

async function insertWithAdmin(
  admin: SupabaseClient,
  row: Record<string, unknown>
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const { data, error } = await admin
    .schema("isendai")
    .from("contact_inquiries")
    .insert(row)
    .select("id")
    .single();

  if (error) {
    return { ok: false, error: error.message };
  }

  const id = typeof data?.id === "string" ? data.id : "";
  return { ok: true, id };
}

export async function saveContactInquiry(
  input: ContactInquiryInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const row = {
    name: clip(input.name, MAX_NAME),
    email: clip(input.email, MAX_EMAIL),
    subject: input.subject ? clip(input.subject, MAX_SUBJECT) : null,
    message: clip(input.message, MAX_MESSAGE),
    user_id: input.userId ?? null,
    locale: input.locale ? clip(input.locale, 8) : null,
    source_path: input.sourcePath ? clip(input.sourcePath, 256) : null,
  };

  if (!row.name || !row.email || !row.message) {
    return { ok: false, error: "Missing required fields." };
  }

  const admin = createSupabaseAdminClientOrNull();
  if (admin) {
    const result = await insertWithAdmin(admin, row);
    if (result.ok) return { ok: true };
    if (process.env.NODE_ENV === "development") {
      console.warn("[contact] Supabase insert failed:", result.error);
    }
  }

  console.info("[contact] inquiry (db unavailable)", {
    email: row.email,
    name: row.name,
    subject: row.subject,
    messageLength: row.message.length,
  });
  return { ok: true };
}
