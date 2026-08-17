// Enfileira um plano (JSON gerado pelo planner) no Buffer, com horário.
//
// Uso:
//   bun scripts/marketing/enqueue.ts                          # último planner-*.json
//   bun scripts/marketing/enqueue.ts --file marketing/planner-2026-08-13.json
//   bun scripts/marketing/enqueue.ts --dry-run                # só mostra o que enviaria
//   bun scripts/marketing/enqueue.ts --only x,facebook        # filtra canais
//
// Regras:
//   - Canais com adapter "manual" (ex.: TikTok) são ignorados.
//   - Canais que precisam de mídia (Instagram) sem media no plano são ignorados.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import {
  createScheduledPost,
  deletePost,
  listChannels,
  listOrganizations,
  listScheduledPosts,
  listScheduledTexts,
} from "./buffer.ts";
import type { PlanEntry } from "./planner.ts";

const args = process.argv.slice(2);
function flag(name: string): string | undefined {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}
const dryRun = args.includes("--dry-run");
const clear = args.includes("--clear"); // apaga os agendados dos canais-alvo antes de enfileirar
const only =
  flag("--only")
    ?.split(",")
    .map((s) => s.trim())
    .filter(Boolean) ?? null;
const file = flag("--file");
// Plano gratuito do Buffer: 10 posts agendados por canal. Ajuste se for pago.
const limitPerChannel = Math.max(1, Number(flag("--limit-per-channel") ?? "10"));

function findPlan(): string {
  if (file) {
    if (!existsSync(file)) throw new Error(`Arquivo não encontrado: ${file}`);
    return file;
  }
  const files = readdirSync("marketing")
    .filter((f) => /^planner-.*\.json$/.test(f))
    .sort();
  if (!files.length)
    throw new Error("Nenhum planner-*.json em marketing/. Rode npm run marketing:plan.");
  return `marketing/${files[files.length - 1]}`;
}

const planPath = findPlan();
const plan: PlanEntry[] = JSON.parse(readFileSync(planPath, "utf8"));

const targets = plan.filter((e) => {
  if (only && !only.includes(e.channel)) return false;
  if (e.adapter !== "buffer") return false;
  if (e.needsMedia && !e.media) return false;
  return true;
});

// Aplica o limite por canal (mantém a ordem cronológica: os primeiros vencem).
const capLog: string[] = [];
const capped = targets.filter((e) => {
  const used = targets.filter((t) => t.channel === e.channel).findIndex((t) => t === e);
  if (used >= limitPerChannel) {
    if (!capLog.includes(e.channel)) capLog.push(e.channel);
    return false;
  }
  return true;
});
for (const ch of capLog) {
  console.log(`ℹ  ${ch}: limite de ${limitPerChannel} agendados por canal (plano gratuito).`);
}

console.log(`Plano: ${planPath} · ${plan.length} posts · ${capped.length} elegíveis para Buffer\n`);

if (!capped.length) {
  console.log("Nada para enfileirar (canais manuais, sem mídia ou acima do limite).");
  process.exit(0);
}

// Em dry-run não toca na API: não precisa de token.
const byService = new Map<string, string>();
const dedupe = new Map<string, Set<string>>();
let orgId = "";
if (!dryRun) {
  const orgs = await listOrganizations();
  if (!orgs.length) throw new Error("Sem organização no Buffer.");
  orgId = orgs[0].id;
  const channels = await listChannels(orgId);
  for (const c of channels) byService.set(c.service, c.id);
  if (clear) {
    for (const [service, id] of byService) {
      const posts = await listScheduledPosts(orgId, id);
      for (const p of posts) {
        await deletePost(p.id);
        console.log(`🗑  ${service}: removido agendado ${p.id}`);
      }
    }
  }
  for (const [service, id] of byService) {
    const texts = await listScheduledTexts(orgId, id);
    dedupe.set(service, new Set(texts));
  }
}
let ok = 0;
let skipped = 0;
for (const entry of capped) {
  const when = `${entry.date} ${entry.time} (SP)`;
  if (dryRun) {
    console.log(`[dry-run] ${entry.channel} @ ${when} → ${entry.kind}`);
    console.log(`  ${entry.text.slice(0, 120)}${entry.text.length > 120 ? "…" : ""}\n`);
    ok++;
    continue;
  }
  const already = dedupe.get(entry.service)?.has(entry.text);
  if (already) {
    console.log(`⏭  ${entry.channel} @ ${when} → já agendado (dedupe)`);
    skipped++;
    continue;
  }
  const channelId = byService.get(entry.service);
  if (!channelId) {
    console.log(`⏭  sem canal ${entry.service} conectado no Buffer`);
    skipped++;
    continue;
  }
  try {
    const post = await createScheduledPost({
      channelId,
      text: entry.text,
      dueAt: entry.dueAt,
      media: entry.media,
    });
    console.log(`✓ ${entry.channel} @ ${when} → id ${post.id}`);
    ok++;
  } catch (err) {
    console.log(
      `✗ ${entry.channel} @ ${when} → ${err instanceof Error ? err.message : String(err)}`,
    );
    skipped++;
  }
}

console.log(
  `\nConcluído: ${ok} ok · ${skipped} ignorados/falhas${dryRun ? " (dry-run, nada enviado)" : ""}`,
);
