"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/i18n/i18n-provider";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useSupabaseBrowserRuntimeConfig } from "@/lib/supabase/browser-config-context";
import { safeNext } from "@/lib/auth/safe-next";

type UseCase = "work" | "personal" | "creator" | "student" | "agency" | "other" | "";

type Props = {
  nextPath: string;
  email: string;
  initialMeta: Record<string, unknown>;
};

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function bool(v: unknown): boolean {
  return v === true || v === "true";
}

function hasCompletedProfile(meta: Record<string, unknown>): boolean {
  return typeof meta.profile_completed_at === "string" && meta.profile_completed_at.length > 0;
}

export function ProfileForm({ nextPath, email, initialMeta }: Props) {
  const { t } = useI18n();
  const router = useRouter();
  const runtime = useSupabaseBrowserRuntimeConfig();
  const [busy, setBusy] = React.useState(false);

  const [fullName, setFullName] = React.useState(str(initialMeta.full_name));
  const [phone, setPhone] = React.useState(str(initialMeta.phone));
  const [country, setCountry] = React.useState(str(initialMeta.country));
  const [organization, setOrganization] = React.useState(str(initialMeta.organization));
  const [jobTitle, setJobTitle] = React.useState(str(initialMeta.job_title));
  const [useCase, setUseCase] = React.useState<UseCase>(
    (str(initialMeta.primary_use_case) as UseCase) || ""
  );
  const [notes, setNotes] = React.useState(str(initialMeta.profile_notes));
  const [marketing, setMarketing] = React.useState(bool(initialMeta.marketing_opt_in));
  const [terms, setTerms] = React.useState(
    hasCompletedProfile(initialMeta) || !!str(initialMeta.terms_accepted_at)
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim() || !country.trim() || !useCase) {
      toast.error(t("profile.errors.required"));
      return;
    }
    if (!hasCompletedProfile(initialMeta) && !terms) {
      toast.error(t("profile.errors.terms"));
      return;
    }

    const supabase = createSupabaseBrowserClient(runtime);
    if (!supabase) {
      toast.error(t("login.missingSupabase"));
      return;
    }

    setBusy(true);
    try {
      const now = new Date().toISOString();
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: fullName.trim(),
          phone: phone.trim() || null,
          country: country.trim(),
          organization: organization.trim() || null,
          job_title: jobTitle.trim() || null,
          primary_use_case: useCase,
          profile_notes: notes.trim() || null,
          marketing_opt_in: marketing,
          terms_accepted_at: now,
          profile_completed_at: now,
        },
      });
      if (error) throw error;
      toast.success(t("profile.saved"));
      router.push(safeNext(nextPath));
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("profile.errors.save"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 grid max-w-xl gap-4">
      <div className="grid gap-1.5">
        <label className="text-xs font-medium text-slate-300">{t("profile.emailLabel")}</label>
        <Input value={email} readOnly disabled className="bg-slate-950/50" />
      </div>

      <div className="grid gap-1.5">
        <label className="text-xs font-medium text-slate-300" htmlFor="full_name">
          {t("profile.fullName")} <span className="text-rose-400">*</span>
        </label>
        <Input
          id="full_name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          autoComplete="name"
          required
        />
      </div>

      <div className="grid gap-1.5 sm:grid-cols-2 sm:gap-4">
        <div className="grid gap-1.5">
          <label className="text-xs font-medium text-slate-300" htmlFor="phone">
            {t("profile.phone")}
          </label>
          <Input
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
          />
        </div>
        <div className="grid gap-1.5">
          <label className="text-xs font-medium text-slate-300" htmlFor="country">
            {t("profile.country")} <span className="text-rose-400">*</span>
          </label>
          <Input
            id="country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            autoComplete="country-name"
            required
          />
        </div>
      </div>

      <div className="grid gap-1.5 sm:grid-cols-2 sm:gap-4">
        <div className="grid gap-1.5">
          <label className="text-xs font-medium text-slate-300" htmlFor="organization">
            {t("profile.organization")}
          </label>
          <Input id="organization" value={organization} onChange={(e) => setOrganization(e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <label className="text-xs font-medium text-slate-300" htmlFor="job_title">
            {t("profile.jobTitle")}
          </label>
          <Input id="job_title" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
        </div>
      </div>

      <div className="grid gap-1.5">
        <label className="text-xs font-medium text-slate-300" htmlFor="use_case">
          {t("profile.useCase")} <span className="text-rose-400">*</span>
        </label>
        <select
          id="use_case"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={useCase}
          onChange={(e) => setUseCase(e.target.value as UseCase)}
          required
        >
          <option value="">{t("profile.useCasePlaceholder")}</option>
          <option value="work">{t("profile.useCaseWork")}</option>
          <option value="personal">{t("profile.useCasePersonal")}</option>
          <option value="creator">{t("profile.useCaseCreator")}</option>
          <option value="student">{t("profile.useCaseStudent")}</option>
          <option value="agency">{t("profile.useCaseAgency")}</option>
          <option value="other">{t("profile.useCaseOther")}</option>
        </select>
      </div>

      <div className="grid gap-1.5">
        <label className="text-xs font-medium text-slate-300" htmlFor="notes">
          {t("profile.notes")}
        </label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t("profile.notesPlaceholder")}
        />
      </div>

      <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-300">
        <input
          type="checkbox"
          className="mt-1"
          checked={marketing}
          onChange={(e) => setMarketing(e.target.checked)}
        />
        {t("profile.marketingOptIn")}
      </label>

      <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-300">
        <input type="checkbox" className="mt-1" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
        <span>
          {t("profile.acceptTerms")} <span className="text-rose-400">*</span>
        </span>
      </label>

      <Button type="submit" disabled={busy} className="w-full sm:w-auto">
        {busy ? t("profile.saving") : t("profile.save")}
      </Button>
    </form>
  );
}
