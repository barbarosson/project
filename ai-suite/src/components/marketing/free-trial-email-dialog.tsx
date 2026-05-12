"use client";

import * as React from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { glassSurface } from "@/lib/premium-ui";

type Props = {
  open: boolean;
  title: string;
  description: string;
  placeholder: string;
  submitLabel: string;
  cancelLabel: string;
  onClose: () => void;
  onSubmit: (email: string) => void | Promise<void>;
};

export function FreeTrialEmailDialog({
  open,
  title,
  description,
  placeholder,
  submitLabel,
  cancelLabel,
  onClose,
  onSubmit,
}: Props) {
  const [email, setEmail] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setEmail("");
      setBusy(false);
    }
  }, [open]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    try {
      await onSubmit(trimmed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="presentation"
      aria-modal="true"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative z-[101] w-full max-w-md rounded-2xl p-6 shadow-2xl transition-opacity duration-200",
          glassSurface
        )}
      >
        <button
          type="button"
          className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white"
          onClick={onClose}
          aria-label="Close"
        >
          <X className="size-4" strokeWidth={1.5} />
        </button>
        <h2 className="pr-8 text-lg font-semibold tracking-tight text-white">{title}</h2>
        <p className="mt-2 text-sm text-slate-400">{description}</p>
        <form onSubmit={handleSubmit} className="mt-5 grid gap-3">
          <Input
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder={placeholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={busy}
            required
          />
          <div className="flex flex-wrap justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
              {cancelLabel}
            </Button>
            <Button type="submit" disabled={busy || !email.trim()}>
              {submitLabel}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
