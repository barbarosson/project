import type { Metadata, Viewport } from "next";

/** Matches `globals.css` light shell background. */
export const PWA_THEME_COLOR = "#e3e6ec";

export const pwaViewport: Viewport = {
  themeColor: PWA_THEME_COLOR,
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "light",
};

/** PWA manifest + Apple web app tags (merged into root metadata). */
export function pwaMetadata(): Pick<
  Metadata,
  "manifest" | "applicationName" | "appleWebApp" | "formatDetection"
> {
  return {
    manifest: "/manifest.json",
    applicationName: "isendai",
    appleWebApp: {
      capable: true,
      /** Opaque bar keeps controls below the clock/battery — avoids dead tap zone on mobile. */
      statusBarStyle: "default",
      title: "isendai",
    },
    formatDetection: {
      telephone: false,
    },
  };
}
