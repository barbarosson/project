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

export function UpdatePasswordForm({ email }: { email: string | null }) {
  const { t } = useI18n();
  const router = useRouter();
  const runtime = useSupabaseBrowserRuntimeConfig();
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < MIN_PASSWORD_LEN) {
      toast.error(t("login.passwordTooShort"));
      return;
    }
    if (password !== confirm) {
      toast.error(t("login.passwordMismatch"));
      return;
    }
    setBusy(true);
    try {
      const supabase = createSupabaseBrowserClient(runtime);
      if (!supabase) {
        toast.error(t("login.missingSupabase"));
        return;
      }
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success(t("login.passwordUpdated"));
      router.push("/account");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("login.authFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="grid gap-3">
      {email ? <p className="text-sm text-slate-400">{email}</p> : null}
      <Input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder={t("login.newPasswordPlaceholder")}
        autoComplete="new-password"
        disabled={busy}
        required
        minLength={MIN_PASSWORD_LEN}
      />
      <Input
        type="password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder={t("login.confirmPasswordPlaceholder")}
        autoComplete="new-password"
        disabled={busy}
        required
        minLength={MIN_PASSWORD_LEN}
      />
      <Button type="submit" disabled={busy}>
        {busy ? t("login.sending") : t("login.updatePasswordSubmit")}
      </Button>
    </form>
  );
}
