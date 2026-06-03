/**
 * Square product logos for Lemon Squeezy (1280×1280 PNG + 512×512 PNG).
 * Run: node scripts/generate-lemon-product-logos.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "public", "lemon-products", "logos");

/** @type {Array<{ slug: string; group: string; label: string; sublabel: string; accent: string; accent2: string; emblem: string }>} */
const LOGOS = [
  {
    slug: "01-starter-monthly",
    group: "subscription",
    label: "STARTER",
    sublabel: "MONTHLY",
    accent: "#8b5cf6",
    accent2: "#c4b5fd",
    emblem: "tier-1",
  },
  {
    slug: "02-growth-monthly",
    group: "subscription",
    label: "GROWTH",
    sublabel: "MONTHLY",
    accent: "#a855f7",
    accent2: "#e9d5ff",
    emblem: "tier-2",
  },
  {
    slug: "03-scale-monthly",
    group: "subscription",
    label: "SCALE",
    sublabel: "MONTHLY",
    accent: "#d946ef",
    accent2: "#f0abfc",
    emblem: "tier-3",
  },
  {
    slug: "04-starter-yearly",
    group: "subscription",
    label: "STARTER",
    sublabel: "YEARLY",
    accent: "#6366f1",
    accent2: "#a5b4fc",
    emblem: "tier-1-ring",
  },
  {
    slug: "05-growth-yearly",
    group: "subscription",
    label: "GROWTH",
    sublabel: "YEARLY",
    accent: "#7c3aed",
    accent2: "#c4b5fd",
    emblem: "tier-2-ring",
  },
  {
    slug: "06-scale-yearly",
    group: "subscription",
    label: "SCALE",
    sublabel: "YEARLY",
    accent: "#c026d3",
    accent2: "#f0abfc",
    emblem: "tier-3-ring",
  },
  {
    slug: "07-paygo-budget",
    group: "paygo",
    label: "BUDGET",
    sublabel: "PAY AS YOU GO",
    accent: "#22d3ee",
    accent2: "#67e8f9",
    emblem: "coins-1",
  },
  {
    slug: "08-paygo-standard",
    group: "paygo",
    label: "STANDARD",
    sublabel: "PAY AS YOU GO",
    accent: "#38bdf8",
    accent2: "#7dd3fc",
    emblem: "coins-2",
  },
  {
    slug: "09-paygo-premium",
    group: "paygo",
    label: "PREMIUM",
    sublabel: "PAY AS YOU GO",
    accent: "#34d399",
    accent2: "#6ee7b7",
    emblem: "coins-3",
  },
];

function esc(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function hexagonEmblem(accent, accent2, nodes = 5) {
  const paths = {
    frame: `M512 268 L668 358 V518 L512 608 L356 518 V358 Z`,
    inner: `M512 318 L628 388 V488 L512 558 L396 488 V388 Z`,
  };
  const nodePositions =
    nodes === 1
      ? [[512, 340]]
      : nodes === 2
        ? [
            [440, 400],
            [584, 400],
          ]
        : nodes === 3
          ? [
              [512, 330],
              [420, 430],
              [604, 430],
            ]
          : [
              [512, 330],
              [420, 400],
              [604, 400],
              [460, 500],
              [564, 500],
            ];

  const nodeDots = nodePositions
    .map(
      ([cx, cy]) =>
        `<circle cx="${cx}" cy="${cy}" r="22" fill="url(#emGrad)" filter="url(#soft)"/>`
    )
    .join("");

  const links =
    nodes >= 3
      ? `<g stroke="url(#emGrad)" stroke-width="6" stroke-linecap="round" fill="none" opacity="0.85">
      <path d="M512 352 L420 400"/><path d="M512 352 L604 400"/>
      <path d="M420 400 L460 500"/><path d="M604 400 L564 500"/>
      <path d="M460 500 L564 500"/>
    </g>`
      : nodes === 2
        ? `<path d="M440 400 L584 400" stroke="url(#emGrad)" stroke-width="6" stroke-linecap="round"/>`
        : "";

  return `
    <circle cx="512" cy="430" r="200" fill="${accent}" opacity="0.14" filter="url(#soft)"/>
    <path d="${paths.frame}" fill="none" stroke="url(#emGrad)" stroke-width="10" stroke-linejoin="round" filter="url(#soft)"/>
    <path d="${paths.inner}" fill="none" stroke="${accent2}" stroke-width="3" stroke-opacity="0.45"/>
    ${links}
    ${nodeDots}
  `;
}

function yearlyRing(accent) {
  return `
    <circle cx="512" cy="430" r="230" fill="none" stroke="${accent}" stroke-width="5" stroke-dasharray="18 14" opacity="0.7"/>
    <circle cx="512" cy="430" r="252" fill="none" stroke="${accent}" stroke-width="2" opacity="0.35"/>
  `;
}

function coinStack(count, accent, accent2) {
  const coins = [];
  for (let i = 0; i < count; i++) {
    const ox = 512 + (i - (count - 1) / 2) * 52;
    const oy = 460 - i * 28;
    coins.push(`
      <g transform="translate(${ox - 56} ${oy - 56})">
        <circle cx="56" cy="56" r="52" fill="url(#coinGrad)" stroke="${accent2}" stroke-width="3" filter="url(#soft)"/>
        <text x="56" y="68" text-anchor="middle" class="coinMark">C</text>
      </g>
    `);
  }
  return `<g>${coins.join("")}</g>`;
}

function buildEmblem({ emblem, accent, accent2 }) {
  switch (emblem) {
    case "tier-1":
      return hexagonEmblem(accent, accent2, 1);
    case "tier-2":
      return hexagonEmblem(accent, accent2, 2);
    case "tier-3":
      return hexagonEmblem(accent, accent2, 5);
    case "tier-1-ring":
      return yearlyRing(accent) + hexagonEmblem(accent, accent2, 1);
    case "tier-2-ring":
      return yearlyRing(accent) + hexagonEmblem(accent, accent2, 2);
    case "tier-3-ring":
      return yearlyRing(accent) + hexagonEmblem(accent, accent2, 5);
    case "coins-1":
      return coinStack(1, accent, accent2);
    case "coins-2":
      return coinStack(2, accent, accent2);
    case "coins-3":
      return coinStack(3, accent, accent2);
    default:
      return hexagonEmblem(accent, accent2, 3);
  }
}

function buildLogoSvg({ label, sublabel, accent, accent2, emblem, group }) {
  const emblemSvg = buildEmblem({ emblem, accent, accent2, group });
  const groupIcon =
    group === "paygo"
      ? `<rect x="88" y="88" width="140" height="44" rx="22" fill="${accent}" opacity="0.2"/>
         <text x="158" y="120" text-anchor="middle" class="tag">PAYGO</text>`
      : `<rect x="88" y="88" width="180" height="44" rx="22" fill="${accent}" opacity="0.2"/>
         <text x="178" y="120" text-anchor="middle" class="tag">PLAN</text>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="1280" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e1b4b"/>
      <stop offset="50%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#312e81"/>
    </linearGradient>
    <linearGradient id="emGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${accent2}"/>
      <stop offset="50%" stop-color="${accent}"/>
      <stop offset="100%" stop-color="#ec4899"/>
    </linearGradient>
    <linearGradient id="coinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${accent2}"/>
      <stop offset="100%" stop-color="${accent}"/>
    </linearGradient>
    <filter id="soft" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="6" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <rect width="1024" height="1024" rx="96" fill="url(#bg)"/>
  <rect x="32" y="32" width="960" height="960" rx="80" fill="none" stroke="${accent}" stroke-width="2" opacity="0.35"/>
  ${groupIcon}
  <text x="512" y="148" text-anchor="middle" class="brand">isendai</text>
  <g transform="translate(0,0)">${emblemSvg}</g>
  <text x="512" y="720" text-anchor="middle" class="label">${esc(label)}</text>
  <text x="512" y="778" text-anchor="middle" class="sublabel">${esc(sublabel)}</text>
  <style>
    .brand { font: 700 36px system-ui, -apple-system, Segoe UI, sans-serif; fill: #c4b5fd; letter-spacing: 0.28em; }
    .tag { font: 700 22px system-ui, sans-serif; fill: ${accent2}; letter-spacing: 0.12em; }
    .label { font: 800 72px system-ui, sans-serif; fill: #f8fafc; letter-spacing: 0.06em; }
    .sublabel { font: 600 28px system-ui, sans-serif; fill: ${accent2}; letter-spacing: 0.2em; }
    .coinMark { font: 800 44px system-ui, sans-serif; fill: #0f172a; }
  </style>
</svg>`;
}

async function writePng(svg, outBase) {
  const buf = Buffer.from(svg);
  await sharp(buf).resize(1280, 1280).png().toFile(`${outBase}-1280.png`);
  await sharp(buf).resize(512, 512).png().toFile(`${outBase}-512.png`);
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const manifest = [];

  for (const logo of LOGOS) {
    const svg = buildLogoSvg(logo);
    const outBase = path.join(OUT_DIR, logo.slug);
    await writePng(svg, outBase);
    manifest.push({
      slug: logo.slug,
      label: logo.label,
      files: [`${logo.slug}-1280.png`, `${logo.slug}-512.png`],
      lemonVariantHint: variantHint(logo.slug),
    });
    console.log("Wrote", `${logo.slug}-1280.png`, `${logo.slug}-512.png`);
  }

  fs.writeFileSync(path.join(OUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2));

  fs.writeFileSync(
    path.join(OUT_DIR, "README.md"),
    `# Lemon Squeezy product logos

Generated by \`node scripts/generate-lemon-product-logos.mjs\`.

Upload **\`*-1280.png\`** in Lemon → Products → variant → **Media** (square product image).

| Logo | Lemon env variable |
|------|-------------------|
| 01-starter-monthly | \`LEMON_SQUEEZY_VARIANT_BASIC_MONTHLY\` |
| 02-growth-monthly | \`LEMON_SQUEEZY_VARIANT_PRO_MONTHLY\` |
| 03-scale-monthly | \`LEMON_SQUEEZY_VARIANT_ULTRA_MONTHLY\` |
| 04-starter-yearly | \`LEMON_SQUEEZY_VARIANT_BASIC_YEARLY\` |
| 05-growth-yearly | \`LEMON_SQUEEZY_VARIANT_PRO_YEARLY\` |
| 06-scale-yearly | \`LEMON_SQUEEZY_VARIANT_ULTRA_YEARLY\` |
| 07-paygo-budget | \`LEMON_SQUEEZY_VARIANT_PAYGO_BUDGET\` |
| 08-paygo-standard | \`LEMON_SQUEEZY_VARIANT_PAYGO_STANDARD\` |
| 09-paygo-premium | \`LEMON_SQUEEZY_VARIANT_PAYGO_PREMIUM\` |

Design language: isendai hexagon neural mark (subscriptions) · stacked credit coins (pay-as-you-go).
`,
    "utf8"
  );

  console.log("\nDone →", OUT_DIR);
}

function variantHint(slug) {
  const map = {
    "01-starter-monthly": "LEMON_SQUEEZY_VARIANT_BASIC_MONTHLY",
    "02-growth-monthly": "LEMON_SQUEEZY_VARIANT_PRO_MONTHLY",
    "03-scale-monthly": "LEMON_SQUEEZY_VARIANT_ULTRA_MONTHLY",
    "04-starter-yearly": "LEMON_SQUEEZY_VARIANT_BASIC_YEARLY",
    "05-growth-yearly": "LEMON_SQUEEZY_VARIANT_PRO_YEARLY",
    "06-scale-yearly": "LEMON_SQUEEZY_VARIANT_ULTRA_YEARLY",
    "07-paygo-budget": "LEMON_SQUEEZY_VARIANT_PAYGO_BUDGET",
    "08-paygo-standard": "LEMON_SQUEEZY_VARIANT_PAYGO_STANDARD",
    "09-paygo-premium": "LEMON_SQUEEZY_VARIANT_PAYGO_PREMIUM",
  };
  return map[slug] ?? "";
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
