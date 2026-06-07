"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/i18n/i18n-provider";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useSupabaseBrowserRuntimeConfig } from "@/lib/supabase/browser-config-context";
import { cn } from "@/lib/utils";
import { glassSurface } from "@/lib/premium-ui";

const CONFIRM_PHRASE = "DELETE";

export function DeleteAccountPanel() {
  const { t } = useI18n();
  const router = useRouter();
  const runtime = useSupabaseBrowserRuntimeConfig();
  const [open, setOpen] = React.useState(false);
  const [confirm, setConfirm] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  async function handleDelete() {
    if (confirm.trim() !== CONFIRM_PHRASE || busy) return;

    setBusy(true);
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: CONFIRM_PHRASE }),
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error ?? t("account.deleteAccountError"));
      }

      const supabase = createSupabaseBrowserClient(runtime);
      if (supabase) {
        await supabase.auth.signOut();
      }

      toast.success(t("account.deleteAccountSuccess"));
      router.push("/");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("account.deleteAccountError"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-10 border-t border-rose-500/20 pt-8">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-rose-300">
        {t("account.dangerZone")}
      </h2>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-300">
        {t("account.deleteAccountDescription")}
      </p>
      {!open ? (
        <Button
          type="button"
          variant="outline"
          className="mt-4 border-rose-500/40 text-rose-200 hover:bg-rose-500/10 hover:text-rose-100"
          onClick={() => setOpen(true)}
        >
          {t("account.deleteAccountButton")}
        </Button>
      ) : (
        <div className={cn("mt-4 max-w-xl rounded-xl p-4", glassSurface)}>
          <p className="text-sm font-medium text-white">{t("account.deleteAccountTitle")}</p>
          <p className="mt-2 text-sm text-slate-400">{t("account.deleteAccountConfirmLabel")}</p>
          <Input
            className="mt-3 bg-slate-950/50"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder={t("account.deleteAccountConfirmPlaceholder")}
            autoComplete="off"
            disabled={busy}
          />
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              className="border border-rose-600/60 bg-rose-600/90 text-white hover:bg-rose-600"
              disabled={busy || confirm.trim() !== CONFIRM_PHRASE}
              onClick={() => void handleDelete()}
            >
              {busy ? t("account.deleteAccountDeleting") : t("account.deleteAccountButton")}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => {
                setOpen(false);
                setConfirm("");
              }}
            >
              {t("account.deleteAccountCancel")}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
