"use client";

import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trackGaEvent } from "@/lib/analytics/gtag";
import { useI18n } from "@/i18n/i18n-provider";
import { pageSubtitle } from "@/lib/premium-ui";

export function ContactForm() {
  const { t, locale } = useI18n();
  const [busy, setBusy] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") ?? "").trim();
    const email = String(fd.get("email") ?? "").trim();
    const subject = String(fd.get("subject") ?? "").trim();
    const message = String(fd.get("message") ?? "").trim();

    setBusy(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email, subject, message, locale }),
      });
      const json = (await res.json().catch(() => null)) as { error?: string; ok?: boolean } | null;
      if (!res.ok) {
        toast.error(json?.error ?? t("contact.errors.send"));
        return;
      }
      setSent(true);
      trackGaEvent("contact_submit", { method: "form" });
      toast.success(t("contact.successToast"));
      e.currentTarget.reset();
    } catch {
      toast.error(t("contact.errors.send"));
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <p className={pageSubtitle}>
        {t("contact.successBody")}
      </p>
    );
  }

  return (
    <form className="mx-auto flex w-full max-w-lg flex-col gap-4" onSubmit={onSubmit}>
      <div>
        <label htmlFor="contact-name" className="mb-1.5 block text-sm font-medium text-slate-200">
          {t("contact.nameLabel")}
        </label>
        <Input id="contact-name" name="name" required minLength={2} autoComplete="name" />
      </div>
      <div>
        <label htmlFor="contact-email" className="mb-1.5 block text-sm font-medium text-slate-200">
          {t("contact.emailLabel")}
        </label>
        <Input
          id="contact-email"
          name="email"
          type="email"
          required
          autoComplete="email"
        />
      </div>
      <div>
        <label htmlFor="contact-subject" className="mb-1.5 block text-sm font-medium text-slate-200">
          {t("contact.subjectLabel")}
        </label>
        <Input id="contact-subject" name="subject" autoComplete="off" />
      </div>
      <div>
        <label htmlFor="contact-message" className="mb-1.5 block text-sm font-medium text-slate-200">
          {t("contact.messageLabel")}
        </label>
        <Textarea id="contact-message" name="message" required minLength={10} rows={6} />
      </div>
      <Button type="submit" disabled={busy} className="w-full sm:w-auto">
        {busy ? t("contact.sending") : t("contact.submit")}
      </Button>
    </form>
  );
}
