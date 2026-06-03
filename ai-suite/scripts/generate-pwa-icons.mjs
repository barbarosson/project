/**
 * PWA + maskable icons from branded SVG mark.
 * Usage: node scripts/generate-pwa-icons.mjs
 */
import { mkdir, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const candidates = [
  path.join(root, "public", "icons", "isendai-mark.svg"),
  path.join(root, "src", "app", "icon.svg"),
  path.join(root, "src", "app", "favicon.ico"),
];
const outDir = path.join(root, "public", "icons");

const sizes = [
  { name: "icon-192x192.png", size: 192 },
  { name: "icon-512x512.png", size: 512 },
];
const faviconIco = path.join(root, "src", "app", "favicon.ico");

let sourcePath = null;
for (const candidate of candidates) {
  try {
    await access(candidate);
    sourcePath = candidate;
    break;
  } catch {
    // try next
  }
}
if (!sourcePath) {
  console.error(
    "No icon source found. Add public/icons/isendai-mark.svg or src/app/icon.svg"
  );
  process.exit(1);
}

await mkdir(outDir, { recursive: true });
const input = sharp(sourcePath);
console.log("Source:", sourcePath);

for (const { name, size } of sizes) {
  const dest = path.join(outDir, name);
  await input
    .clone()
    .resize(size, size, { fit: "contain", background: { r: 9, g: 9, b: 11, alpha: 1 } })
    .png()
    .toFile(dest);
  console.log("Wrote", dest);
}

await input
  .clone()
  .resize(32, 32, { fit: "contain", background: { r: 9, g: 9, b: 11, alpha: 1 } })
  .toFile(faviconIco);
console.log("Wrote", faviconIco);
