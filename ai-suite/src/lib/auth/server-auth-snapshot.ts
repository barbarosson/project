import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ServerAuthSnapshot = {
  signedIn: boolean;
  /** Email if present, else name from metadata, else null. */
  label: string | null;
  userId: string | null;
};

function readNameFromMetadata(meta: Record<string, unknown> | null | undefined): string | null {
  if (!meta || typeof meta !== "object") return null;
  const fullName = typeof meta.full_name === "string" ? meta.full_name.trim() : "";
  if (fullName) return fullName;
  const name = typeof meta.name === "string" ? meta.name.trim() : "";
  if (name) return name;
  return null;
}

/**
 * Reads the current user on the server so client components can pre-render
 * the signed-in UI (eliminates the "Login" flash after OAuth redirects).
 */
export async function readServerAuthSnapshot(): Promise<ServerAuthSnapshot> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) return { signedIn: false, label: null, userId: null };
    const email = user.email?.trim() || null;
    const name = readNameFromMetadata(
      (user.user_metadata ?? null) as Record<string, unknown> | null
    );
    return {
      signedIn: true,
      label: email ?? name,
      userId: user.id,
    };
  } catch {
    return { signedIn: false, label: null, userId: null };
  }
}
