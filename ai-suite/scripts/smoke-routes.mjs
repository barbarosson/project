#!/usr/bin/env node
/**
 * HTTP smoke check for public routes (no auth, no payment).
 * Usage: node scripts/smoke-routes.mjs https://isendai.com
 */
const base = (process.argv[2] || process.env.SMOKE_BASE_URL || "http://localhost:3001").replace(
  /\/$/,
  ""
);

const ROUTES = [
  "/",
  "/pricing",
  "/faq",
  "/contact",
  "/login",
  "/privacy",
  "/terms",
  "/robots.txt",
  "/sitemap.xml",
  "/tool/corporate-whisperer",
];

async function check(path) {
  const url = `${base}${path}`;
  const res = await fetch(url, { redirect: "follow" });
  const ok = res.status >= 200 && res.status < 400;
  return { path, status: res.status, ok };
}

async function main() {
  console.log(`Smoke base: ${base}\n`);
  let failed = 0;
  for (const path of ROUTES) {
    const r = await check(path);
    const mark = r.ok ? "OK" : "FAIL";
    console.log(`${mark} ${r.status} ${path}`);
    if (!r.ok) failed += 1;
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
