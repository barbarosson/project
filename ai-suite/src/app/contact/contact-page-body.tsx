"use client";

import { ContactForm } from "@/app/contact/contact-form";
import { useI18n } from "@/i18n/i18n-provider";
import {
  SitePageBackNav,
  SitePageChrome,
  SitePageHeader,
  SitePageMain,
  SitePageTitleBlock,
} from "@/components/site-page-layout";
import { pageSubtitle } from "@/lib/premium-ui";
import { getPublicSupportEmail } from "@/lib/support-email";

export function ContactPageBody() {
  const { t } = useI18n();
  const supportEmail = getPublicSupportEmail();

  return (
    <SitePageChrome>
      <SitePageHeader />
      <SitePageMain width="auth">
        <SitePageBackNav>{t("nav.backToHome")}</SitePageBackNav>
        <SitePageTitleBlock title={t("contact.title")} />
        <p className={pageSubtitle}>
          {t("contact.lead")}{" "}
          <a
            href={`mailto:${supportEmail}`}
            className="font-medium text-violet-200 underline-offset-2 hover:text-white hover:underline"
          >
            {supportEmail}
          </a>
        </p>
        <div className="mt-8">
          <ContactForm />
        </div>
      </SitePageMain>
    </SitePageChrome>
  );
}
