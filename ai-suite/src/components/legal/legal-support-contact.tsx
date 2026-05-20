"use client";

import Link from "next/link";

import { useI18n } from "@/i18n/i18n-provider";
import { getPublicSupportEmail } from "@/lib/support-email";

const linkClass =
  "font-medium text-violet-200 underline-offset-2 hover:text-white hover:underline";

export function LegalSupportContact() {
  const { t } = useI18n();
  const email = getPublicSupportEmail();

  return (
    <p>
      {t("legal.contact.lead")}{" "}
      <a href={`mailto:${email}`} className={linkClass}>
        {email}
      </a>
      {" · "}
      <Link href="/contact" className={linkClass}>
        {t("nav.contact")}
      </Link>
    </p>
  );
}
