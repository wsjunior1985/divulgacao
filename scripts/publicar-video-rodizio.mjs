#!/usr/bin/env node
// publicar-video-rodizio.mjs — publica, no horário do slot, o próximo vídeo do rodízio como Reel
// (instagram, facebook, threads, bluesky e x), 2 por dia.
//
//   node scripts/publicar-video-rodizio.mjs --dry-run            próximo slot, sem enviar
//   node scripts/publicar-video-rodizio.mjs --agenda 7           mostra os próximos 7 dias
//   node scripts/publicar-video-rodizio.mjs --data 2026-11-06 --pos 1   slot específico
//
// No Actions, o slot vem do cron (GITHUB_EVENT_SCHEDULE, passado pelo workflow_dispatch da VPS).
// Cada rodada tem estado próprio em estado/videos-rodizio.json (chave data-posição-app): um slot
// não publica duas vezes e um canal com erro é retentado sem repetir os outros.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { carregarEnv, lerJson, agoraBRT, log, env, RAIZ } from "./lib/base.js";

carregarEnv();
const CRONS = ["0 15 * * *", "0 22 * * *"]; // 12h e 19h BRT
const EPOCA = Date.UTC(2026, 10, 5);
const CANAIS = "instagram,facebook,threads,bluesky,x";
const ESTADO = "estado/videos-rodizio.json";

export function sequencia(data, posicao) {
  const [a, m, d] = data.split("-").map(Number);
  const dias = Math.round((Date.UTC(a, m - 1, d) - EPOCA) / 86400000);
  if (dias < 0) throw new Error(`data anterior ao início do rodízio: ${data}`);
  return dias * CRONS.length + posicao;
}

export function pautaDoSlot(lista, data, posicao) {
  const seq = sequencia(data, posicao);
  const n = lista.length;
  return { seq, app: lista[((seq % n) + n) % n], ciclo: Math.floor(seq / n) + 1 };
}

function slotDoCron(cron, permitirAtraso) {
  const posicao = CRONS.indexOf(cron.trim());
  if (posicao < 0) throw new Error(`cron de vídeo não reconhecido: ${cron}`);
  const [minuto, hora] = CRONS[posicao].split(" ").map(Number);
  const agora = new Date();
  const previsto = new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth(), agora.getUTCDate(), hora, minuto));
  if (previsto > agora) previsto.setUTCDate(previsto.getUTCDate() - 1);
  const atraso = (agora - previsto) / 60000;
  if (atraso > 120 && !permitirAtraso) throw new Error(`cron atrasou ${Math.floor(atraso)} minutos; slot ignorado`);
  return { data: agoraBRT(previsto).dia, posicao };
}

function proximoSlot() {
  const agora = new Date();
  for (let k = 0; k < 4; k++) {
    for (let p = 0; p < CRONS.length; p++) {
      const [minuto, hora] = CRONS[p].split(" ").map(Number);
      const t = new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth(), agora.getUTCDate() + k, hora, minuto));
      if (t > agora) return { data: agoraBRT(t).dia, posicao: p };
    }
  }
}

async function baixarSeFaltar(arquivo) {
  const caminho = resolve(RAIZ, arquivo);
  if (existsSync(caminho)) return;
  const url = env("SUPABASE_URL"), bucket = env("SUPABASE_VIDEO_BUCKET", "marketing-videos");
  if (!url) throw new Error(`${arquivo} não existe e SUPABASE_URL não está definida`);
  const publica = `${url}/storage/v1/object/public/${bucket}/videos/${arquivo.split("/").pop()}`;
  const res = await fetch(publica);
  if (!res.ok) throw new Error(`download do vídeo falhou (${res.status}): ${publica}`);
  mkdirSync(dirname(caminho), { recursive: true });
  writeFileSync(caminho, Buffer.from(await res.arrayBuffer()));
  log(`vídeo baixado do bucket: ${arquivo}`);
}

async function main() {
  const a = process.argv.slice(2);
  const val = (f) => (a.includes(f) ? a[a.indexOf(f) + 1] : null);
  const dryRun = a.includes("--dry-run");
  const manifesto = lerJson("videos/videos.json");
  const lista = manifesto.rodizio;
  if (!lista?.length) throw new Error("videos/videos.json sem a lista `rodizio`");
  for (const id of lista) if (!manifesto.videos[id]) throw new Error(`rodizio: vídeo desconhecido ${id}`);

  if (val("--agenda")) {
    let { data, posicao } = proximoSlot();
    for (let i = 0; i < Number(val("--agenda")) * CRONS.length; i++) {
      const p = pautaDoSlot(lista, data, posicao);
      console.log(`${data} ${posicao === 0 ? "12h" : "19h"} BRT  ciclo ${p.ciclo}  ${p.app}`);
      posicao++; if (posicao >= CRONS.length) { posicao = 0; data = new Date(Date.parse(`${data}T12:00:00Z`) + 86400000).toISOString().slice(0, 10); }
    }
    return;
  }

  const cron = env("GITHUB_EVENT_SCHEDULE");
  if (!dryRun && !cron && !val("--data")) {
    throw new Error("publicação real exige o cron do slot (GITHUB_EVENT_SCHEDULE) ou --data/--pos; sem eles só vale --dry-run");
  }
  const slot = val("--data") ? { data: val("--data"), posicao: Number(val("--pos") ?? 0) }
    : cron ? slotDoCron(cron, env("PERMITIR_ATRASO") === "true") : proximoSlot();
  const { seq, app, ciclo } = pautaDoSlot(lista, slot.data, slot.posicao);
  const chave = `${slot.data}-p${slot.posicao}-${app}`;
  log(`rodízio de vídeos · ${slot.data} ${slot.posicao === 0 ? "12h" : "19h"} BRT · sequência ${seq} · ciclo ${ciclo} · ${app}`);

  await baixarSeFaltar(manifesto.videos[app].arquivo);
  const r = spawnSync(process.execPath, [
    resolve(RAIZ, "scripts/publicar-video.mjs"), "--app", app, "--canais", CANAIS,
    "--estado", ESTADO, "--chave", chave, ...(dryRun ? ["--dry-run"] : []),
  ], { stdio: "inherit", env: { ...process.env, CAMPANHA: `reels-ciclo-${ciclo}` } });
  process.exitCode = r.status ?? 1;
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
