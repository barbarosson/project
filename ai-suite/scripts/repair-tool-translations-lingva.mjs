/**
 * Fixes MYMEMORY/quota garbage in src/i18n/generated/tool-translations.ts
 * using Google Translate `gtx` (query-param API; avoids path-based limits on "/" in text).
 * Run from ai-suite/: node scripts/repair-tool-translations-lingva.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const BLOCK_TO_LANG = {
  ES: "es",
  FR: "fr",
  DE: "de",
  ZH: "zh-CN",
  TR: "tr",
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function translateGtx(text, targetLang, attempt = 0) {
  const u = new URL("https://translate.googleapis.com/translate_a/single");
  u.searchParams.set("client", "gtx");
  u.searchParams.set("sl", "en");
  u.searchParams.set("tl", targetLang);
  u.searchParams.set("dt", "t");
  u.searchParams.set("q", text);
  const res = await fetch(u);
  const raw = await res.text();
  const looksHtml = raw.startsWith("<") && raw.includes("Error");
  if (!res.ok || looksHtml) {
    if (attempt < 10) {
      await sleep(2000 + attempt * 1500);
      return translateGtx(text, targetLang, attempt + 1);
    }
    throw new Error(`translate ${res.status}: ${raw.slice(0, 200)}`);
  }
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    if (attempt < 10) {
      await sleep(2000 + attempt * 1500);
      return translateGtx(text, targetLang, attempt + 1);
    }
    throw new Error(`translate JSON: ${raw.slice(0, 120)}`);
  }
  const out = data?.[0]?.[0]?.[0];
  if (typeof out !== "string" || !out.trim()) {
    if (attempt < 10) {
      await sleep(2000 + attempt * 1500);
      return translateGtx(text, targetLang, attempt + 1);
    }
    throw new Error(`translate parse: ${raw.slice(0, 160)}`);
  }
  return out.trim();
}

function parseToolEntryLine(line) {
  const idMatch = line.match(/^\s*"([^"]+)"\s*:\s*\{\s*title:\s*"/);
  if (!idMatch) return null;
  const id = idMatch[1];
  const titleStart = line.indexOf('title: "') + 8;
  const descSep = '", description: "';
  const descIdx = line.indexOf(descSep, titleStart);
  if (descIdx === -1) return null;
  const title = line.slice(titleStart, descIdx);
  const descStart = descIdx + descSep.length;
  const tail = line.trimEnd();
  if (!tail.endsWith("},") && !tail.endsWith("}")) return null;
  const descEnd = line.lastIndexOf('"');
  if (descEnd <= descStart) return null;
  const description = line.slice(descStart, descEnd);
  return { id, title, description, line };
}

function needsRepair(parsed) {
  if (/MYMEMORY|USAGE LIMIT|USAGELIMITS|TRANSLATE MORE/i.test(parsed.title)) {
    return true;
  }
  if (/MYMEMORY|USAGE LIMIT|USAGELIMITS|TRANSLATE MORE/i.test(parsed.description)) {
    return true;
  }
  return false;
}

function formatEntry(id, title, description) {
  return `  ${JSON.stringify(id)}: { title: ${JSON.stringify(title)}, description: ${JSON.stringify(description)} },`;
}

async function main() {
  const toolsPath = path.join(root, "tools-en.json");
  const tsPath = path.join(root, "src/i18n/generated/tool-translations.ts");
  const tools = JSON.parse(fs.readFileSync(toolsPath, "utf8"));
  const byId = Object.fromEntries(tools.map((t) => [t.tool ?? t.id, t]));

  const lines = fs.readFileSync(tsPath, "utf8").split("\n");
  let block = null;
  const repairs = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const bm = line.match(/^const (ES|FR|DE|ZH|TR):/);
    if (bm) {
      block = bm[1];
      continue;
    }
    if (block && line.trim() === "};") {
      block = null;
      continue;
    }
    if (!block || !line.trim().startsWith('"')) continue;
    const parsed = parseToolEntryLine(line);
    if (!parsed || !needsRepair(parsed)) continue;
    const en = byId[parsed.id];
    if (!en) {
      console.warn("skip unknown tool id:", parsed.id);
      continue;
    }
    const lang = BLOCK_TO_LANG[block];
    if (!lang) continue;
    repairs.push({ i, lang, enTitle: en.title, enDesc: en.description });
  }

  console.error(`Repairing ${repairs.length} tool rows via translate.googleapis.com (gtx)…`);

  for (let j = 0; j < repairs.length; j++) {
    const { i, lang, enTitle, enDesc } = repairs[j];
    process.stderr.write(`\r${j + 1}/${repairs.length} `);
    const idMatch = lines[i].match(/^\s*"([^"]+)"/);
    const id = idMatch[1];
    const title = await translateGtx(enTitle, lang);
    await sleep(450);
    const description = await translateGtx(enDesc, lang);
    lines[i] = formatEntry(id, title, description);
    fs.writeFileSync(tsPath, lines.join("\n"), "utf8");
    await sleep(700);
  }
  process.stderr.write("\n");

  console.error("Wrote", tsPath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
