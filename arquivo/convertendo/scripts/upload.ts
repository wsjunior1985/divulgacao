// Envia os cards gerados para o Cloudinary e grava as URLs públicas no plano.
//
// Uso:
//   bun scripts/marketing/upload.ts                    # último planner-*.json
//   bun scripts/marketing/upload.ts --file marketing/planner-2026-08-12.json
//
// Exige no .env.local:
//   CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { loadEnv } from "./env.ts";
import type { PlanEntry } from "./planner.ts";

loadEnv();

const CLOUD = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

if (!CLOUD || !API_KEY || !API_SECRET) {
  console.error(
    "Faltam CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET no .env.local. Veja marketing/AUTOMACAO.md.",
  );
  process.exit(1);
}

const args = process.argv.slice(2);
function flag(name: string): string | undefined {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}
const file = flag("--file");

function findPlan(): string {
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

function sign(params: Record<string, string>): string {
  const query = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return createHash("sha1")
    .update(query + API_SECRET)
    .digest("hex");
}

async function uploadImage(filePath: string, publicId: string): Promise<string> {
  const timestamp = String(Math.floor(Date.now() / 1000));
  const params: Record<string, string> = { timestamp, folder: "convertendo", public_id: publicId };
  const signature = sign(params);
  const form = new FormData();
  form.append("file", new Blob([readFileSync(filePath)]), publicId + ".png");
  form.append("api_key", API_KEY!);
  form.append("timestamp", timestamp);
  form.append("signature", signature);
  form.append("folder", params.folder);
  form.append("public_id", params.public_id);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`, {
    method: "POST",
    body: form,
  });
  const data = (await res.json()) as { secure_url?: string; error?: { message?: string } };
  if (!res.ok || !data.secure_url) {
    throw new Error(`Cloudinary ${res.status}: ${data?.error?.message ?? JSON.stringify(data)}`);
  }
  return data.secure_url;
}

const planPath = findPlan();
const plan: PlanEntry[] = JSON.parse(readFileSync(planPath, "utf8"));

const pending = plan.filter(
  (e) => e.needsMedia && e.media && !String(e.media).startsWith("https://"),
);
if (!pending.length) {
  console.log("Nenhum card local pendente de upload (rode npm run marketing:cards antes).");
  process.exit(0);
}

for (const entry of pending) {
  try {
    const url = await uploadImage(entry.media!, entry.id.replace(/[^a-zA-Z0-9_-]/g, "_"));
    entry.media = url;
    console.log(`✓ ${entry.id} → ${url}`);
  } catch (err) {
    console.log(`✗ ${entry.id} → ${err instanceof Error ? err.message : String(err)}`);
  }
}

writeFileSync(planPath, JSON.stringify(plan, null, 2) + "\n");
console.log(`\nPlano atualizado: ${planPath}`);
console.log("Próximo passo: npm run marketing:enqueue -- --dry-run");
