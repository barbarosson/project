import { baseSiteUrl } from "@/lib/site-metadata";
import { DEFAULT_SUPPORT_EMAIL } from "@/lib/support-email";

export function HomeJsonLd() {
  const url = baseSiteUrl().href.replace(/\/$/, "") || "https://isendai.com";
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "isendai",
    url,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description:
      "AI micro-tools that turn messy drafts into messages you can actually send — email, work, dating, and more.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Pay per use credit packs; optional subscriptions via Lemon Squeezy",
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: DEFAULT_SUPPORT_EMAIL,
      url: `${url}/contact`,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
