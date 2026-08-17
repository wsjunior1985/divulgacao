// Gera cards PNG (Instagram/TikTok) a partir de um plano.
//
// Uso:
//   bun scripts/marketing/cards.ts                    # último planner-*.json
//   bun scripts/marketing/cards.ts --file marketing/planner-2026-08-12.json
//   bun scripts/marketing/cards.ts --size 1080        # 1080x1080 ou 1350 (retrato)
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import sharp from "sharp";
import { buildPlan } from "./planner.ts";
import type { PlanEntry } from "./planner.ts";

const args = process.argv.slice(2);
function flag(name: string): string | undefined {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}
const sizeParam = Number(flag("--size") ?? "1080");
const SIZE = sizeParam === 1350 ? 1080 : sizeParam; // largura fixa; altura varia
const HEIGHT = sizeParam === 1350 ? 1350 : 1080;

function findPlan(): string {
  const file = flag("--file");
  if (file) {
    if (!existsSync(file)) throw new Error(`Arquivo não encontrado: ${file}`);
    return file;
  }
  const files = readdirSync("marketing")
    .filter((f) => /^planner-.*\.json$/.test(f))
    .sort();
  if (!files.length) throw new Error("Nenhum planner-*.json. Rode npm run marketing:plan.");
  return `marketing/${files[files.length - 1]}`;
}
function existsSync(p: string): boolean {
  try {
    readFileSync(p);
    return true;
  } catch {
    return false;
  }
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrap(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    if ((current + " " + w).trim().length <= maxChars) {
      current = (current + " " + w).trim();
    } else {
      if (current) lines.push(current);
      current = w;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function buildSvg(title: string, sub: string): string {
  const pad = 90;
  const titleSize = 78;
  const subSize = 44;
  const titleLines = wrap(title, Math.floor((SIZE - pad * 2) / (titleSize * 0.55)));
  const subLines = wrap(sub, Math.floor((SIZE - pad * 2) / (subSize * 0.55)));

  const titleY = HEIGHT / 2 - ((titleLines.length + subLines.length) * 90) / 2 + 60;
  const titleBlock = titleLines
    .map(
      (line, i) =>
        `<text x="${SIZE / 2}" y="${titleY + i * (titleSize + 14)}" text-anchor="middle" font-family="Helvetica Neue, Arial, sans-serif" font-size="${titleSize}" font-weight="800" fill="#ffffff">${esc(line)}</text>`,
    )
    .join("");
  const subStart = titleY + titleLines.length * (titleSize + 14) + 40;
  const subBlock = subLines
    .map(
      (line, i) =>
        `<text x="${SIZE / 2}" y="${subStart + i * (subSize + 10)}" text-anchor="middle" font-family="Helvetica Neue, Arial, sans-serif" font-size="${subSize}" font-weight="500" fill="#9fb8d9">${esc(line)}</text>`,
    )
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${HEIGHT}" viewBox="0 0 ${SIZE} ${HEIGHT}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#050d1a"/>
      <stop offset="1" stop-color="#0b1b33"/>
    </linearGradient>
    <radialGradient id="glowCyan" cx="0.85" cy="0.12" r="0.6">
      <stop offset="0" stop-color="#22d3ee" stop-opacity="0.28"/>
      <stop offset="1" stop-color="#22d3ee" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glowAmber" cx="0.12" cy="0.95" r="0.55">
      <stop offset="0" stop-color="#fbbf24" stop-opacity="0.22"/>
      <stop offset="1" stop-color="#fbbf24" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${SIZE}" height="${HEIGHT}" fill="url(#bg)"/>
  <rect width="${SIZE}" height="${HEIGHT}" fill="url(#glowCyan)"/>
  <rect width="${SIZE}" height="${HEIGHT}" fill="url(#glowAmber)"/>
  <rect x="0" y="0" width="${SIZE}" height="10" fill="#22d3ee"/>
  <g>
    <circle cx="${pad}" cy="64" r="20" fill="#fbbf24"/>
    <text x="${pad}" y="72" text-anchor="middle" font-size="26">💱</text>
    <text x="${pad + 40}" y="76" font-family="Helvetica Neue, Arial, sans-serif" font-size="40" font-weight="800" fill="#ffffff">Convertendo</text>
  </g>
  ${titleBlock}
  ${subBlock}
  <rect x="${SIZE / 2 - 220}" y="${HEIGHT - 150}" width="440" height="76" rx="38" fill="#fbbf24"/>
  <text x="${SIZE / 2}" y="${HEIGHT - 102}" text-anchor="middle" font-family="Helvetica Neue, Arial, sans-serif" font-size="34" font-weight="700" fill="#141006">convertendo.app.br</text>
</svg>`;
}

async function renderCard(entry: PlanEntry): Promise<Buffer> {
  const svg = buildSvg(entry.cardTitle, entry.cardSub);
  return sharp(Buffer.from(svg)).png().toBuffer();
}

const planPath = findPlan();
const plan: PlanEntry[] = JSON.parse(readFileSync(planPath, "utf8"));

const targets = plan.filter((e) => e.needsMedia);
mkdirSync("marketing/cards", { recursive: true });

for (const entry of targets) {
  const file = `marketing/cards/${entry.id}.png`;
  try {
    const png = await renderCard(entry);
    writeFileSync(file, png);
    entry.media = file;
    console.log(`✓ ${entry.id} → ${file} (${(png.length / 1024).toFixed(0)} KB)`);
  } catch (err) {
    console.log(`✗ ${entry.id} → ${err instanceof Error ? err.message : String(err)}`);
  }
}

writeFileSync(planPath, JSON.stringify(plan, null, 2) + "\n");
console.log(`\nPlano atualizado: ${planPath}`);
console.log(
  "Próximo passo: npm run marketing:upload (enviar ao Cloudinary e gerar URLs públicas).",
);
