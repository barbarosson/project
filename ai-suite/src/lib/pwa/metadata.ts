import type { Metadata, Viewport } from "next";

/** Matches `globals.css` / layout body background. */
export const PWA_THEME_COLOR = "#09090b";

export const pwaViewport: Viewport = {
  themeColor: PWA_THEME_COLOR,
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "dark",
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
      statusBarStyle: "black-translucent",
      title: "isendai",
    },
    formatDetection: {
      telephone: false,
    },
  };
}
