import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import Script from "next/script";
import { cookies } from "next/headers";
import { Toaster } from "sonner";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { I18nProvider } from "@/i18n/i18n-provider";
import { RouteTransition } from "@/components/route-transition";
import { ModelProvider } from "@/models/model-provider";
import { GlobalBackground } from "@/components/global-background";
import type { Locale } from "@/i18n/dictionaries";
import { SupabaseBrowserConfigProvider } from "@/lib/supabase/browser-config-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://isendai.netlify.app"),
  title: "isendai | Perfect Your Message Before You Hit Send",
  description:
    "Stop overthinking. Let AI transform your angry emails, write your cover letters, and handle your communication stress in seconds. Pay per use, no subscriptions.",
  openGraph: {
    type: "website",
    title: "isendai | Perfect Your Message Before You Hit Send",
    description:
      "Stop overthinking. Let AI transform your angry emails, write your cover letters, and handle your communication stress in seconds. Pay per use, no subscriptions.",
    siteName: "isendai",
  },
  twitter: {
    card: "summary_large_image",
    title: "isendai | Perfect Your Message Before You Hit Send",
    description:
      "Stop overthinking. Let AI transform your angry emails, write your cover letters, and handle your communication stress in seconds. Pay per use, no subscriptions.",
  },
};

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
      className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-50">
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
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
            <I18nProvider initialLocale={initialLocale}>
              <ModelProvider>
                <RouteTransition />
                <GlobalBackground />
                {children}
              </ModelProvider>
            </I18nProvider>
          </ThemeProvider>
        </SupabaseBrowserConfigProvider>
        <Toaster theme="dark" richColors closeButton />
      </body>
    </html>
  );
}
