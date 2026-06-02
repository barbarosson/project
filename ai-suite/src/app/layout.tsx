import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import Script from "next/script";
import { cookies } from "next/headers";
import { Toaster } from "sonner";
import "./globals.css";
import { I18nProvider } from "@/i18n/i18n-provider";
import { RouteTransition } from "@/components/route-transition";
import { ModelProvider } from "@/models/model-provider";
import { readDefaultAiModelFromMetadata } from "@/lib/auth/default-ai-model";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ModelId } from "@/models/models";
import { GlobalBackground } from "@/components/global-background";
import { SocialProof } from "@/components/SocialProof";
import { ModelAnnouncement } from "@/components/model-announcement";
import type { Locale } from "@/i18n/dictionaries";
import { resolveLocaleFromCookie } from "@/i18n/resolve-locale";
import { rootMetadataForLocale } from "@/lib/site-metadata";
import { getDeployEnv } from "@/lib/deploy-env";
import { SupabaseBrowserConfigProvider } from "@/lib/supabase/browser-config-context";
import { PricingModalProvider } from "@/components/pricing/pricing-modal";
import { AuthSessionHydrator } from "@/components/auth-session-hydrator";
import { DeployEnvBanner } from "@/components/deploy-env-banner";
import { PwaSerwistProvider } from "@/components/pwa/serwist-provider";
import { pwaViewport } from "@/lib/pwa/metadata";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const cookieLocale = (await cookies()).get("ai-suite-locale")?.value;
  return rootMetadataForLocale(resolveLocaleFromCookie(cookieLocale));
}

export const viewport: Viewport = pwaViewport;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const GA_ID = getDeployEnv() === "production" ? process.env.NEXT_PUBLIC_GA_ID : undefined;
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

  let initialDefaultAiModel: ModelId | null = null;
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      initialDefaultAiModel = readDefaultAiModelFromMetadata(data.user.user_metadata);
    }
  } catch {
    initialDefaultAiModel = null;
  }

  return (
    <html
      lang={initialLocale ?? "en"}
      suppressHydrationWarning
      className={`dark ${inter.variable} ${spaceGrotesk.variable} h-full font-sans antialiased`}
    >
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="flex min-h-full min-w-0 flex-col overflow-x-clip bg-[#09090b] text-slate-50 antialiased">
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
        <PwaSerwistProvider>
          <SupabaseBrowserConfigProvider url={supabaseUrl} anonKey={supabaseAnonKey}>
            <I18nProvider initialLocale={initialLocale}>
              <ModelProvider initialDefaultAiModel={initialDefaultAiModel}>
                <PricingModalProvider>
                  <RouteTransition />
                  <GlobalBackground />
                  <SocialProof />
                  <ModelAnnouncement />
                  <DeployEnvBanner />
                  <AuthSessionHydrator />
                  {children}
                </PricingModalProvider>
              </ModelProvider>
            </I18nProvider>
          </SupabaseBrowserConfigProvider>
        </PwaSerwistProvider>
        <Toaster theme="dark" richColors closeButton />
      </body>
    </html>
  );
}
