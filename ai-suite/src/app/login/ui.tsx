"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/i18n/i18n-provider";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useSupabaseBrowserRuntimeConfig } from "@/lib/supabase/browser-config-context";

const MIN_PASSWORD_LEN = 6;

export function LoginClient() {
  const { t } = useI18n();
  const router = useRouter();
  const runtime = useSupabaseBrowserRuntimeConfig();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState<null | "magic" | "register" | "signin">(null);

  function validateEmail(): string | null {
    const value = email.trim();
    if (!value || !value.includes("@")) {
      toast.error(t("login.emailInvalid"));
      return null;
    }
    return value;
  }

  async function navigateAfterSession(supabase: NonNullable<ReturnType<typeof createSupabaseBrowserClient>>) {
    const { data } = await supabase.auth.getUser();
    const meta = data.user?.user_metadata as Record<string, unknown> | undefined;
    const completed =
      typeof meta?.profile_completed_at === "string" && meta.profile_completed_at.length > 0;
    const next = "/claim";
    const dest = completed ? next : `/account/profile?next=${encodeURIComponent(next)}`;
    router.push(dest);
    router.refresh();
  }

  async function registerWithPassword() {
    const value = validateEmail();
    if (!value) return;
    if (password.length < MIN_PASSWORD_LEN) {
      toast.error(t("login.passwordTooShort"));
      return;
    }
    setBusy("register");
    try {
      const supabase = createSupabaseBrowserClient(runtime);
      if (!supabase) {
        toast.error(t("login.missingSupabase"));
        return;
      }
      const { data, error } = await supabase.auth.signUp({
        email: value,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/claim`,
        },
      });
      if (error) throw error;
      if (data.session) {
        await navigateAfterSession(supabase);
        return;
      }
      toast.success(t("login.confirmEmailSent"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("login.authFailed"));
    } finally {
      setBusy(null);
    }
  }

  async function signInWithPassword() {
    const value = validateEmail();
    if (!value) return;
    if (!password) {
      toast.error(t("login.passwordRequired"));
      return;
    }
    setBusy("signin");
    try {
      const supabase = createSupabaseBrowserClient(runtime);
      if (!supabase) {
        toast.error(t("login.missingSupabase"));
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({
        email: value,
        password,
      });
      if (error) throw error;
      await navigateAfterSession(supabase);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("login.authFailed"));
    } finally {
      setBusy(null);
    }
  }

  async function sendLink() {
    const value = validateEmail();
    if (!value) return;
    setBusy("magic");
    try {
      const supabase = createSupabaseBrowserClient(runtime);
      if (!supabase) {
        toast.error(t("login.missingSupabase"));
        return;
      }
      const { error } = await supabase.auth.signInWithOtp({
        email: value,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/claim`,
        },
      });
      if (error) throw error;
      toast.success(t("login.emailSent"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("login.sendFailed"));
    } finally {
      setBusy(null);
    }
  }

  const loading = busy !== null;

  return (
    <div className="grid gap-3">
      <Input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t("login.emailPlaceholder")}
        inputMode="email"
        autoComplete="email"
      />
      <Input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder={t("login.passwordPlaceholder")}
        autoComplete="current-password"
      />
      <div className="grid gap-2 sm:grid-cols-2">
        <Button type="button" onClick={() => void registerWithPassword()} disabled={loading}>
          {busy === "register" ? t("login.sending") : t("login.registerButton")}
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="bg-slate-800/80 text-slate-100 hover:bg-slate-800"
          onClick={() => void signInWithPassword()}
          disabled={loading}
        >
          {busy === "signin" ? t("login.sending") : t("login.signInPasswordButton")}
        </Button>
      </div>
      <p className="text-center text-xs text-slate-500">{t("login.magicLinkDivider")}</p>
      <Button type="button" variant="outline" onClick={() => void sendLink()} disabled={loading}>
        {busy === "magic" ? t("login.sending") : t("login.send")}
      </Button>
    </div>
  );
}

