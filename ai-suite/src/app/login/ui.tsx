"use client";

import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/i18n/i18n-provider";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useSupabaseBrowserRuntimeConfig } from "@/lib/supabase/browser-config-context";
import { authCallbackRedirectUrl } from "@/lib/auth/oauth-callback-url";
import { resolvePostLoginDestination } from "@/lib/auth/resolve-post-login-destination";
import { readReferralCookieClient } from "@/lib/referrals/ref-cookie";
import { isPlausibleAuthEmail, prepareEmailForAuth } from "@/lib/auth/normalize-email";

const MIN_PASSWORD_LEN = 6;

function mapAuthEmailErrorToMessage(
  t: (key: string) => string,
  e: unknown,
  fallbackKey: string = "login.sendFailed"
): string {
  const msg = e instanceof Error ? e.message : "";
  const lower = msg.toLowerCase();
  if (
    lower.includes("rate limit") ||
    lower.includes("over_request") ||
    lower.includes("email rate") ||
    lower.includes("too many requests") ||
    lower.includes("too many emails")
  ) {
    return t("login.emailRateLimit");
  }
  if (lower.includes("unable to validate email address")) {
    return t("login.emailInvalid");
  }
  if (lower.includes("email address") && lower.includes("invalid")) {
    if (msg.includes("modulsutech")) {
      return t("login.emailTypoModulus");
    }
    return t("login.emailDomainInvalid");
  }
  return msg || t(fallbackKey);
}

type LoginClientProps = {
  authCallbackUrl: string;
  nextAfterAuth: string;
};

export function LoginClient({ authCallbackUrl, nextAfterAuth }: LoginClientProps) {
  const { t } = useI18n();
  const runtime = useSupabaseBrowserRuntimeConfig();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState<
    null | "register" | "signin" | "resend" | "reset" | "magic"
  >(null);

  function validateEmail(): string | null {
    const value = prepareEmailForAuth(email);
    if (!isPlausibleAuthEmail(value)) {
      toast.error(t("login.emailInvalid"));
      return null;
    }
    return value;
  }

  async function navigateAfterSession(supabase: NonNullable<ReturnType<typeof createSupabaseBrowserClient>>) {
    const { data: sessionWrap } = await supabase.auth.getSession();
    const { data: userWrap } = await supabase.auth.getUser();
    const user = userWrap.user ?? sessionWrap.session?.user ?? null;
    if (!user) {
      toast.error(t("login.authFailed"));
      return;
    }
    try {
      await fetch("/api/auth/bootstrap", { method: "POST", credentials: "same-origin" });
    } catch {
      // non-fatal
    }
    window.location.assign(resolvePostLoginDestination(user, nextAfterAuth));
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
      const referredBy = readReferralCookieClient();
      const { data, error } = await supabase.auth.signUp({
        email: value,
        password,
        options: {
          emailRedirectTo: authCallbackRedirectUrl(authCallbackUrl, nextAfterAuth),
          data: referredBy ? { referred_by: referredBy } : undefined,
        },
      });
      if (error) throw error;
      if (data.session) {
        await navigateAfterSession(supabase);
        return;
      }
      // Supabase hides duplicate-email signup errors; empty identities ⇒ account likely exists → no mail sent.
      const identities = data.user?.identities;
      if (Array.isArray(identities) && identities.length === 0) {
        toast.warning(t("login.signUpExistingEmail"));
        return;
      }
      toast.success(t("login.confirmEmailSent"));
    } catch (e) {
      toast.error(mapAuthEmailErrorToMessage(t, e, "login.authFailed"));
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
      const msg = e instanceof Error ? e.message : "";
      const norm = msg.toLowerCase();
      if (
        norm.includes("invalid login credentials") ||
        norm.includes("invalid_credentials") ||
        norm.includes("email not confirmed")
      ) {
        toast.error(t("login.invalidCredentialsHint"));
      } else {
        toast.error(msg || t("login.authFailed"));
      }
    } finally {
      setBusy(null);
    }
  }

  async function resendConfirmation() {
    const value = validateEmail();
    if (!value) return;
    setBusy("resend");
    try {
      const supabase = createSupabaseBrowserClient(runtime);
      if (!supabase) {
        toast.error(t("login.missingSupabase"));
        return;
      }
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: value,
        options: {
          emailRedirectTo: authCallbackRedirectUrl(authCallbackUrl, nextAfterAuth),
        },
      });
      if (error) throw error;
      toast.success(t("login.resendConfirmToast"));
    } catch (e) {
      toast.error(mapAuthEmailErrorToMessage(t, e));
    } finally {
      setBusy(null);
    }
  }

  async function sendMagicLink() {
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
          emailRedirectTo: authCallbackRedirectUrl(authCallbackUrl, nextAfterAuth),
        },
      });
      if (error) throw error;
      toast.success(t("login.emailSent"));
    } catch (e) {
      toast.error(mapAuthEmailErrorToMessage(t, e));
    } finally {
      setBusy(null);
    }
  }

  async function sendPasswordReset() {
    const value = validateEmail();
    if (!value) return;
    setBusy("reset");
    try {
      const supabase = createSupabaseBrowserClient(runtime);
      if (!supabase) {
        toast.error(t("login.missingSupabase"));
        return;
      }
      const { error } = await supabase.auth.resetPasswordForEmail(value, {
        redirectTo: authCallbackRedirectUrl(authCallbackUrl, "/auth/update-password"),
      });
      if (error) throw error;
      toast.success(t("login.resetEmailSent"));
    } catch (e) {
      toast.error(mapAuthEmailErrorToMessage(t, e));
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
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-center text-xs">
        <button
          type="button"
          className="cursor-pointer text-violet-300 underline-offset-2 transition-all duration-200 hover:text-violet-200 hover:underline active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => void resendConfirmation()}
          disabled={loading}
        >
          {busy === "resend" ? t("login.sending") : t("login.resendConfirmButton")}
        </button>
        <span className="hidden text-slate-600 sm:inline" aria-hidden="true">
          ·
        </span>
        <button
          type="button"
          className="cursor-pointer text-violet-300 underline-offset-2 transition-all duration-200 hover:text-violet-200 hover:underline active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => void sendPasswordReset()}
          disabled={loading}
        >
          {busy === "reset" ? t("login.sending") : t("login.forgotPasswordButton")}
        </button>
      </div>
      <div className="relative mt-4 flex items-center gap-3">
        <span className="h-px flex-1 bg-white/[0.08] light:bg-slate-300/70" aria-hidden />
        <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-slate-400 light:text-slate-600">
          {t("login.magicLinkDivider")}
        </span>
        <span className="h-px flex-1 bg-white/[0.08] light:bg-slate-300/70" aria-hidden />
      </div>
      <Button
        type="button"
        variant="outline"
        className="mt-3 w-full border-violet-400/30 bg-violet-500/5 text-violet-100 hover:bg-violet-500/15 light:border-violet-400/50 light:text-violet-900"
        onClick={() => void sendMagicLink()}
        disabled={loading}
      >
        {busy === "magic" ? t("login.sending") : t("login.magicLinkButton")}
      </Button>
    </div>
  );
}

