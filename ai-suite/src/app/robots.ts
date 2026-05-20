import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const base =
    raw && (raw.startsWith("http://") || raw.startsWith("https://"))
      ? raw.replace(/\/$/, "")
      : "https://isendai.netlify.app";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/account",
        "/account/",
        "/history",
        "/request/",
        "/auth/",
        "/login",
        "/success",
        "/claim",
      ],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
