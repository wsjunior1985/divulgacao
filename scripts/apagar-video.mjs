#!/usr/bin/env node
// apagar-video.mjs — apaga posts de VÍDEO já publicados (estado/videos.json).
//
//   node scripts/apagar-video.mjs --app remedin,aieat [--canais bluesky,x] [--formato 9x16|16x9] [--dry-run]
//
// O que for apagado sai do estado, para o vídeo poder ser republicado. O X sai pelo
// Buffer, que só remove post ainda na fila: post já publicado no X é manual.
import { carregarEnv, lerJson, gravarJson, log, ok, aviso, erro } from "./lib/base.js";
import * as meta from "./canais/meta.js";
import * as threads from "./canais/threads.js";
import * as bluesky from "./canais/bluesky.js";
import * as buffer from "./canais/buffer.js";

carregarEnv();
const a = process.argv.slice(2);
const val = (f) => (a.includes(f) ? a[a.indexOf(f) + 1] : null);
const dryRun = a.includes("--dry-run");
const apps = val("--app")?.split(",") ?? [];
const formato = val("--formato") ?? "9x16";
if (!["9x16", "16x9"].includes(formato)) throw new Error(`--formato inválido: ${formato}`);
const canais = val("--canais")?.split(",") ?? ["instagram", "facebook", "threads", "bluesky", "x"];
if (!apps.length) throw new Error("use --app <id[,id]>");

const estado = lerJson("estado/videos.json", { videos: {} });
const manuais = [];
for (const app of apps) {
  const chave = formato === "9x16" ? app : `${app}@${formato}`;
  const feitos = estado.videos[chave] ?? {};
  for (const canal of canais) {
    const r = feitos[canal];
    if (!r || r.status !== "ok" || !r.id) continue;
    if (dryRun) { log(`[dry-run] ${app}/${canal}: ${r.id}`); continue; }
    try {
      if (canal === "instagram" || canal === "facebook") await meta.apagar(canal, r.id);
      else if (canal === "threads") await threads.apagar(r.id);
      else if (canal === "bluesky") await bluesky.apagar(r.id);
      else if (canal === "x") await buffer.removerPost(r.id);
      delete feitos[canal];
      ok(`${app}/${canal}: apagado`);
    } catch (e) {
      erro(`${app}/${canal}: ${e.message}`);
      if (canal === "x") { manuais.push(`${app}/x (${r.id})`); delete feitos[canal]; }
    }
  }
  estado.videos[chave] = feitos;
}
if (!dryRun) { estado.atualizadoEm = new Date().toISOString(); gravarJson("estado/videos.json", estado); }
if (manuais.length) aviso(`X: apague manualmente no X/Buffer → ${manuais.join(", ")}`);
