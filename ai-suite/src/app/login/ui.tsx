"use client";

import * as React from "react";
import { toast } from "sonner";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginClient() {
  const [email, setEmail] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  async function sendLink() {
    const value = email.trim();
    if (!value || !value.includes("@")) {
      toast.error("Please enter a valid email.");
      return;
    }
    setBusy(true);
    try {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) {
        toast.error("Auth is not configured (missing Supabase env vars).");
        return;
      }
      const { error } = await supabase.auth.signInWithOtp({
        email: value,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/claim`,
        },
      });
      if (error) throw error;
      toast.success("Check your email for the sign-in link.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send link.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-3">
      <Input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@domain.com"
        inputMode="email"
        autoComplete="email"
      />
      <Button onClick={sendLink} disabled={busy}>
        {busy ? "Sending…" : "Send link"}
      </Button>
    </div>
  );
}

