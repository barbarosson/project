import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const ts = fs.readFileSync(
  path.join(root, "src/components/ai-suite/tools-data.ts"),
  "utf8"
);

function extractTools(source) {
  const unescape = (s) =>
    s
      .replace(/\\n/g, "\n")
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'")
      .replace(/\\\\/g, "\\");
  const tools = [];
  const idMatches = [...source.matchAll(/tool:\s*"([^"]+)"/g)];
  for (let i = 0; i < idMatches.length; i++) {
    const tool = idMatches[i][1];
    const start = idMatches[i].index ?? 0;
    const end =
      i + 1 < idMatches.length
        ? idMatches[i + 1].index ?? source.length
        : source.length;
    const block = source.slice(start, end);
    const titleDM = block.match(/title:\s*"((?:\\.|[^"\\])*)"/);
    const titleSM = block.match(/title:\s*'((?:\\.|[^'\\])*)'/);
    const titleRaw = titleDM?.[1] ?? titleSM?.[1];
    if (!titleRaw) throw new Error(`No title for ${tool}`);
    const descM = block.match(/description:\s*"((?:\\.|[^"\\])*)"/);
    if (!descM) throw new Error(`No description for ${tool}`);
    tools.push({
      tool,
      title: unescape(titleRaw),
      description: unescape(descM[1]),
    });
  }
  return tools;
}

const tools = extractTools(ts);
const outPath = path.join(root, "tools-en.json");
fs.writeFileSync(outPath, JSON.stringify(tools, null, 2), "utf8");
console.error(`Wrote ${tools.length} tools -> ${path.relative(root, outPath)}`);
