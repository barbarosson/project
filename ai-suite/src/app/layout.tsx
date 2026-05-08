import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import Script from "next/script";
import { cookies } from "next/headers";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { I18nProvider } from "@/i18n/i18n-provider";
import { RouteTransition } from "@/components/route-transition";
import { ModelProvider } from "@/models/model-provider";
import { GlobalBackground } from "@/components/global-background";
import type { Locale } from "@/i18n/dictionaries";

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
  title: "AI Suite",
  description: "One-click AI solutions for your daily struggles.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
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
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <I18nProvider initialLocale={initialLocale}>
            <ModelProvider>
              <RouteTransition />
              <GlobalBackground />
              {children}
            </ModelProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
