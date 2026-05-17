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
import { isMembershipProfileComplete } from "@/lib/auth/membership-profile";
import { getSortedRegionOptions, legacyCountryToCode } from "@/lib/regions";
import type { Locale } from "@/i18n/dictionaries";

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

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

type RegionOptions = ReturnType<typeof getSortedRegionOptions>;

/** Remounted when locale or server country meta changes so mapping stays in sync without effects. */
function ProfileCountrySelect({
  locale,
  initialCountryMeta,
  regionOptions,
  placeholder,
  countryRef,
}: {
  locale: Locale;
  initialCountryMeta: unknown;
  regionOptions: RegionOptions;
  placeholder: string;
  countryRef: React.MutableRefObject<string>;
}) {
  const [countryCode, setCountryCode] = React.useState(() =>
    legacyCountryToCode(str(initialCountryMeta), locale)
  );

  React.useLayoutEffect(() => {
    countryRef.current = countryCode;
  }, [countryCode, countryRef]);

  return (
    <select
      id="country"
      className="flex h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-slate-300 shadow-inner backdrop-blur-xl ring-offset-[#09090b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090b] disabled:cursor-not-allowed disabled:opacity-50"
      style={{ colorScheme: "dark" }}
      value={countryCode}
      onChange={(e) => {
        const v = e.target.value;
        setCountryCode(v);
      }}
      autoComplete="country"
      required
    >
      <option value="">{placeholder}</option>
      {regionOptions.map(({ code, label }) => (
        <option key={code} value={code}>
          {label}
        </option>
      ))}
    </select>
  );
}

export function ProfileForm({ nextPath, email, initialMeta }: Props) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const runtime = useSupabaseBrowserRuntimeConfig();
  const [busy, setBusy] = React.useState(false);

  const hasAccountEmail = Boolean(email.trim());
  const [accountEmail, setAccountEmail] = React.useState(email);

  const [fullName, setFullName] = React.useState(str(initialMeta.full_name));
  const [phone, setPhone] = React.useState(str(initialMeta.phone));
  const countryCodeRef = React.useRef(legacyCountryToCode(str(initialMeta.country), locale));
  const [organization, setOrganization] = React.useState(str(initialMeta.organization));
  const [addressLine, setAddressLine] = React.useState(str(initialMeta.address_line));
  const [city, setCity] = React.useState(str(initialMeta.city));
  const [jobTitle, setJobTitle] = React.useState(str(initialMeta.job_title));
  const [useCase, setUseCase] = React.useState<UseCase>(
    (str(initialMeta.primary_use_case) as UseCase) || ""
  );
  const [notes, setNotes] = React.useState(str(initialMeta.profile_notes));
  const [marketing, setMarketing] = React.useState(bool(initialMeta.marketing_opt_in));
  const [terms, setTerms] = React.useState(
    isMembershipProfileComplete(initialMeta) || !!str(initialMeta.terms_accepted_at)
  );

  const regionOptions = React.useMemo(() => getSortedRegionOptions(locale), [locale]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const emailToSave = accountEmail.trim();
    if (!hasAccountEmail) {
      if (!emailToSave) {
        toast.error(t("profile.errors.emailRequired"));
        return;
      }
      if (!isValidEmail(emailToSave)) {
        toast.error(t("profile.errors.emailInvalid"));
        return;
      }
    }
    if (!fullName.trim() || !countryCodeRef.current.trim() || !useCase) {
      toast.error(t("profile.errors.required"));
      return;
    }
    if (!isMembershipProfileComplete(initialMeta) && !terms) {
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
      if (!hasAccountEmail && emailToSave) {
        const { data: emailData, error: emailError } = await supabase.auth.updateUser({
          email: emailToSave,
        });
        if (emailError) throw emailError;
        const confirmed = emailData.user?.email?.trim() === emailToSave;
        if (!confirmed) {
          toast.info(t("profile.emailConfirmSent"));
        }
      }

      const now = new Date().toISOString();
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: fullName.trim(),
          phone: phone.trim() || null,
          country: countryCodeRef.current.trim(),
          address_line: addressLine.trim() || null,
          city: city.trim() || null,
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
        <label className="text-xs font-medium text-slate-300" htmlFor="account_email">
          {t("profile.emailLabel")}
          {!hasAccountEmail ? <span className="text-rose-400"> *</span> : null}
        </label>
        {hasAccountEmail ? (
          <Input value={accountEmail} readOnly disabled className="bg-slate-950/50" />
        ) : (
          <>
            <Input
              id="account_email"
              type="email"
              value={accountEmail}
              onChange={(e) => setAccountEmail(e.target.value)}
              placeholder={t("profile.emailPlaceholder")}
              autoComplete="email"
              required
            />
            <p className="text-xs text-slate-500">{t("profile.emailHintOAuth")}</p>
          </>
        )}
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
          <ProfileCountrySelect
            key={`${locale}:${String(initialMeta.country)}`}
            locale={locale}
            initialCountryMeta={initialMeta.country}
            regionOptions={regionOptions}
            placeholder={t("profile.countryPlaceholder")}
            countryRef={countryCodeRef}
          />
        </div>
      </div>

      <div className="grid gap-1.5">
        <label className="text-xs font-medium text-slate-300" htmlFor="address_line">
          {t("profile.addressLabel")}
        </label>
        <Textarea
          id="address_line"
          value={addressLine}
          onChange={(e) => setAddressLine(e.target.value)}
          placeholder={t("profile.addressPlaceholder")}
          autoComplete="street-address"
          rows={2}
        />
      </div>

      <div className="grid gap-1.5 sm:max-w-md">
        <label className="text-xs font-medium text-slate-300" htmlFor="city">
          {t("profile.cityLabel")}
        </label>
        <Input
          id="city"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          autoComplete="address-level2"
        />
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
          className="flex h-10 w-full rounded-md border border-input bg-zinc-950/95 px-3 py-2 text-sm text-zinc-100 shadow-inner ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
