"use client";

import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/i18n/i18n-provider";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useSupabaseBrowserRuntimeConfig } from "@/lib/supabase/browser-config-context";

export function LoginClient() {
  const { t } = useI18n();
  const runtime = useSupabaseBrowserRuntimeConfig();
  const [email, setEmail] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  async function sendLink() {
    const value = email.trim();
    if (!value || !value.includes("@")) {
      toast.error(t("login.emailInvalid"));
      return;
    }
    setBusy(true);
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
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-3">
      <Input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t("login.emailPlaceholder")}
        inputMode="email"
        autoComplete="email"
      />
      <Button onClick={sendLink} disabled={busy}>
        {busy ? t("login.sending") : t("login.send")}
      </Button>
    </div>
  );
}

