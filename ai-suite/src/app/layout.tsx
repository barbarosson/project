import type { Metadata } from "next";
import { Geist, Space_Grotesk } from "next/font/google";
import Script from "next/script";
import { cookies } from "next/headers";
import { Toaster } from "sonner";
import "./globals.css";
import { I18nProvider } from "@/i18n/i18n-provider";
import { RouteTransition } from "@/components/route-transition";
import { ModelProvider } from "@/models/model-provider";
import { GlobalBackground } from "@/components/global-background";
import { SocialProof } from "@/components/SocialProof";
import type { Locale } from "@/i18n/dictionaries";
import { resolveLocaleFromCookie } from "@/i18n/resolve-locale";
import { rootMetadataForLocale } from "@/lib/site-metadata";
import { SupabaseBrowserConfigProvider } from "@/lib/supabase/browser-config-context";
import { PricingModalProvider } from "@/components/pricing/pricing-modal";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const cookieLocale = (await cookies()).get("ai-suite-locale")?.value;
  return rootMetadataForLocale(resolveLocaleFromCookie(cookieLocale));
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
  const pe = process.env as Record<string, string | undefined>;
  const supabaseUrl =
    pe.NEXT_PUBLIC_SUPABASE_URL?.trim() || pe.SUPABASE_URL?.trim() || null;
  const supabaseAnonKey =
    pe.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || pe.SUPABASE_ANON_KEY?.trim() || null;
  const cookieLocale = (await cookies()).get("ai-suite-locale")?.value;
  const initialLocale: Locale | undefined =
    cookieLocale === "en" ||
    cookieLocale === "tr" ||
    cookieLocale === "es" ||
    cookieLocale === "fr" ||
    cookieLocale === "de" ||
    cookieLocale === "zh"
      ? cookieLocale
      : undefined;
  return (
    <html
      lang={initialLocale ?? "en"}
      suppressHydrationWarning
      className={`dark ${geistSans.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-[#09090b] text-slate-50 antialiased">
        {GA_ID ? (
          <>
            <Script
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            />
            <Script
              id="ga4-init"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}', { anonymize_ip: true });
`.trim(),
              }}
            />
          </>
        ) : null}
        <SupabaseBrowserConfigProvider url={supabaseUrl} anonKey={supabaseAnonKey}>
          <I18nProvider initialLocale={initialLocale}>
            <ModelProvider>
              <PricingModalProvider>
                <RouteTransition />
                <GlobalBackground />
                <SocialProof />
                {children}
              </PricingModalProvider>
            </ModelProvider>
          </I18nProvider>
        </SupabaseBrowserConfigProvider>
        <Toaster theme="dark" richColors closeButton />
      </body>
    </html>
  );
}
