/**
 * Generates 1280×1280 JPEG product images for Lemon Squeezy (9 packs).
 * Run: node scripts/generate-lemon-product-images.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "public", "lemon-products");

/** @type {Array<{ slug: string; badge: string; title: string; price: string; credits: string; bullets: string[]; accent: string }>} */
const PRODUCTS = [
  {
    slug: "01-starter-monthly",
    badge: "MONTHLY",
    title: "Starter",
    price: "$7.99 / mo",
    credits: "500 credits / month",
    accent: "#8b5cf6",
    bullets: [
      "Monthly credit refill",
      "Fast AI (1 credit) & Pro AI (25 credits)",
      "Perfect for occasional polish",
      "Cancel anytime",
    ],
  },
  {
    slug: "02-growth-monthly",
    badge: "MONTHLY",
    title: "Growth",
    price: "$9.99 / mo",
    credits: "1,000 credits / month",
    accent: "#a855f7",
    bullets: [
      "2× Starter credits every month",
      "Ideal for daily messaging",
      "Transparent cost on every button",
      "Unlocks models per your tier",
    ],
  },
  {
    slug: "03-scale-monthly",
    badge: "MONTHLY",
    title: "Scale",
    price: "$19.99 / mo",
    credits: "5,000 credits / month",
    accent: "#d946ef",
    bullets: [
      "High-volume monthly allowance",
      "Teams, automation & power users",
      "Fast + Pro + Genius when eligible",
      "Best for heavy ISEND AI use",
    ],
  },
  {
    slug: "04-starter-yearly",
    badge: "YEARLY · SAVE ~17%",
    title: "Starter Annual",
    price: "$79 / year",
    credits: "6,000 credits / year",
    accent: "#6366f1",
    bullets: [
      "Same volume as Starter monthly",
      "One payment — credits all year",
      "~17% less vs 12× monthly",
      "Great for solo professionals",
    ],
  },
  {
    slug: "05-growth-yearly",
    badge: "YEARLY · SAVE ~17%",
    title: "Growth Annual",
    price: "$99 / year",
    credits: "12,000 credits / year",
    accent: "#7c3aed",
    bullets: [
      "Matches Growth monthly volume",
      "Pay yearly, skip monthly checkout",
      "~17% savings vs monthly",
      "For committed daily users",
    ],
  },
  {
    slug: "06-scale-yearly",
    badge: "YEARLY · SAVE ~17%",
    title: "Scale Annual",
    price: "$199 / year",
    credits: "60,000 credits / year",
    accent: "#c026d3",
    bullets: [
      "Maximum yearly credit pool",
      "Scale-tier volume upfront",
      "Best value for high throughput",
      "Built for teams at scale",
    ],
  },
  {
    slug: "07-paygo-budget",
    badge: "ONE-TIME · PAY AS YOU GO",
    title: "Budget Pack",
    price: "$1",
    credits: "10 credits",
    accent: "#22d3ee",
    bullets: [
      "No subscription required",
      "Fast AI — 1 credit per run",
      "Quick fixes & light edits",
      "Top up anytime",
    ],
  },
  {
    slug: "08-paygo-standard",
    badge: "ONE-TIME · PAY AS YOU GO",
    title: "Standard Pack",
    price: "$1.49",
    credits: "25 credits",
    accent: "#38bdf8",
    bullets: [
      "Fast AI + Pro AI access",
      "Pro runs cost up to 25 credits",
      "Important emails & messages",
      "Credits never expire on account",
    ],
  },
  {
    slug: "09-paygo-premium",
    badge: "ONE-TIME · PAY AS YOU GO",
    title: "Premium Pack",
    price: "$1.99",
    credits: "50 credits",
    accent: "#34d399",
    bullets: [
      "Full catalog: Fast, Pro & Genius",
      "Highest-stakes copy & tone",
      "Best $/credit for power users",
      "Instant balance after checkout",
    ],
  },
];

function esc(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildSvg({ badge, title, price, credits, bullets, accent }) {
  const bulletY = 520;
  const bulletLines = bullets
    .map((b, i) => {
      const y = bulletY + i * 56;
      return `
    <circle cx="88" cy="${y - 8}" r="6" fill="${accent}" opacity="0.9"/>
    <text x="112" y="${y}" class="bullet">${esc(b)}</text>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="1280" viewBox="0 0 1280 1280">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1e1b4b"/>
      <stop offset="45%" style="stop-color:#0f172a"/>
      <stop offset="100%" style="stop-color:#312e81"/>
    </linearGradient>
    <linearGradient id="titleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#ffffff"/>
      <stop offset="50%" style="stop-color:#e9d5ff"/>
      <stop offset="100%" style="stop-color:#a5f3fc"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="18" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <rect width="1280" height="1280" fill="url(#bg)"/>
  <circle cx="200" cy="180" r="220" fill="${accent}" opacity="0.12" filter="url(#glow)"/>
  <circle cx="1080" cy="1050" r="280" fill="#ec4899" opacity="0.08"/>
  <rect x="64" y="64" width="1152" height="1152" rx="48" fill="none" stroke="${accent}" stroke-width="2" opacity="0.35"/>
  <text x="96" y="168" class="brand">ISEND AI</text>
  <rect x="96" y="196" width="auto" height="0" fill="none"/>
  <text x="96" y="248" class="badge">${esc(badge)}</text>
  <text x="96" y="360" class="title">${esc(title)}</text>
  <text x="96" y="448" class="price">${esc(price)}</text>
  <text x="96" y="492" class="credits">${esc(credits)}</text>
  ${bulletLines}
  <text x="96" y="1188" class="footer">isendai.com · Universal credits · Lemon Squeezy</text>
  <style>
    .brand { font: 700 42px system-ui, -apple-system, Segoe UI, sans-serif; fill: #c4b5fd; letter-spacing: 0.12em; }
    .badge { font: 600 28px system-ui, sans-serif; fill: ${accent}; letter-spacing: 0.08em; }
    .title { font: 700 88px system-ui, sans-serif; fill: url(#titleGrad); }
    .price { font: 700 64px system-ui, sans-serif; fill: #f8fafc; }
    .credits { font: 600 36px system-ui, sans-serif; fill: #cbd5e1; }
    .bullet { font: 500 34px system-ui, sans-serif; fill: #e2e8f0; }
    .footer { font: 500 24px system-ui, sans-serif; fill: #64748b; }
  </style>
</svg>`;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const manifest = [];

  for (const product of PRODUCTS) {
    const svg = buildSvg(product);
    const outPath = path.join(OUT_DIR, `${product.slug}.jpg`);
    await sharp(Buffer.from(svg)).jpeg({ quality: 92, mozjpeg: true }).toFile(outPath);
    manifest.push({ file: `${product.slug}.jpg`, ...product });
    console.log("Wrote", outPath);
  }

  fs.writeFileSync(
    path.join(OUT_DIR, "README.md"),
    `# Lemon Squeezy product images (1280×1280 JPEG)

Generated by \`node scripts/generate-lemon-product-images.mjs\`.

| File | Lemon env (variant) | Plan |
|------|---------------------|------|
| 01-starter-monthly.jpg | \`LEMON_SQUEEZY_VARIANT_BASIC_MONTHLY\` | Starter subscription |
| 02-growth-monthly.jpg | \`LEMON_SQUEEZY_VARIANT_PRO_MONTHLY\` | Growth subscription |
| 03-scale-monthly.jpg | \`LEMON_SQUEEZY_VARIANT_ULTRA_MONTHLY\` | Scale subscription |
| 04-starter-yearly.jpg | \`LEMON_SQUEEZY_VARIANT_BASIC_YEARLY\` | Starter annual |
| 05-growth-yearly.jpg | \`LEMON_SQUEEZY_VARIANT_PRO_YEARLY\` | Growth annual |
| 06-scale-yearly.jpg | \`LEMON_SQUEEZY_VARIANT_ULTRA_YEARLY\` | Scale annual |
| 07-paygo-budget.jpg | \`LEMON_SQUEEZY_VARIANT_PAYGO_BUDGET\` | $1 / 10 credits |
| 08-paygo-standard.jpg | \`LEMON_SQUEEZY_VARIANT_PAYGO_STANDARD\` | $1.49 / 25 credits |
| 09-paygo-premium.jpg | \`LEMON_SQUEEZY_VARIANT_PAYGO_PREMIUM\` | $1.99 / 50 credits |
`,
    "utf8"
  );

  fs.writeFileSync(path.join(OUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log("\nDone. Upload JPEGs in Lemon Squeezy → Products → Media.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
