#!/usr/bin/env node
// publicar-video.mjs — publica os vídeos de apresentação 9:16 (videos/videos.json).
//
//   node scripts/publicar-video.mjs --dry-run                 mostra legendas, não envia
//   node scripts/publicar-video.mjs --app gasonol             um vídeo, todos os canais
//   node scripts/publicar-video.mjs --apps remedin,aieat       vários vídeos, todos os canais
//   node scripts/publicar-video.mjs --app gasonol --canais bluesky,threads
//   node scripts/publicar-video.mjs --forcar                  republica o que já saiu
//
// Estado em estado/videos.json (anti-duplicata por vídeo+canal). Uma falha de canal
// não derruba os outros.
import { existsSync, statSync } from "node:fs";
import { carregarEnv, lerJson, gravarJson, log, ok, aviso, erro, env, RAIZ } from "./lib/base.js";
import { hospedarVideo } from "./lib/midia-video.js";
import * as video from "./canais/video.js";
import * as meta from "./canais/meta.js";
import * as threads from "./canais/threads.js";
import * as bluesky from "./canais/bluesky.js";
import * as tiktok from "./canais/tiktok.js";
import * as buffer from "./canais/buffer.js";

carregarEnv();
const CANAIS = ["instagram", "facebook", "threads", "bluesky", "tiktok", "x"];
const ESTADO = "estado/videos.json";

const a = process.argv.slice(2);
const flag = (f) => a.includes(f);
const val = (f) => (a.includes(f) ? a[a.indexOf(f) + 1] : null);
const dryRun = flag("--dry-run");
const forcar = flag("--forcar");
const canaisPedidos = val("--canais")?.split(",").map((c) => c.trim()) ?? CANAIS;
const manifesto = lerJson("videos/videos.json");
const alvosApp = val("--apps")
  ? val("--apps").split(",").map((app) => app.trim()).filter(Boolean)
  : val("--app")
    ? [val("--app")]
    : manifesto.ordem;

const pronto = (c) =>
  c === "instagram" || c === "facebook" ? meta.pronto(c) : c === "threads" ? threads.pronto()
  : c === "bluesky" ? bluesky.pronto() : c === "tiktok" ? tiktok.pronto() : buffer.pronto();

function uTm(urlApp, canal) {
  const u = new URL(urlApp);
  u.searchParams.set("utm_source", canal);
  u.searchParams.set("utm_medium", "social");
  u.searchParams.set("utm_campaign", "apresentacao");
  return u.toString();
}

const estado = lerJson(ESTADO, { videos: {} });
let falhas = 0;

for (const app of alvosApp) {
  const v = manifesto.videos[app];
  if (!v) { erro(`vídeo desconhecido: ${app}`); falhas++; continue; }
  if (!existsSync(`${RAIZ}/${v.arquivo}`)) { erro(`${app}: ${v.arquivo} não existe (rode npm run videos:converter)`); falhas++; continue; }
  const feitos = estado.videos[app] ?? {};
  const canais = canaisPedidos.filter((c) => {
    if (!CANAIS.includes(c)) throw new Error(`canal desconhecido: ${c}`);
    if (feitos[c]?.status === "ok" && !forcar) { log(`${app}/${c}: já publicado — pulando`); return false; }
    const p = pronto(c);
    if (!p.ok && !dryRun) { aviso(`${app}/${c}: desligado (${p.motivo})`); return false; }
    return true;
  });
  log(`— ${v.nome} · ${(statSync(`${RAIZ}/${v.arquivo}`).size / 1048576).toFixed(1)} MB · canais: ${canais.join(", ") || "nenhum"}`);
  if (dryRun) { for (const c of canais) log(`[${c}]\n${v.legendas[c]}\n`); continue; }
  if (!canais.length) continue;

  let urlVideo = null;
  if (canais.some((c) => ["instagram", "facebook", "threads", "x"].includes(c))) {
    try { urlVideo = await hospedarVideo(v.arquivo); } catch (e) { erro(`${app}: hospedagem — ${e.message}`); falhas++; continue; }
  }
  const dom = new URL(v.url).hostname;
  for (const c of canais) {
    const legenda = v.legendas[c];
    try {
      const r = c === "instagram" ? await video.instagram({ legenda, urlVideo })
        : c === "facebook" ? await video.facebook({ legenda, urlVideo })
        : c === "threads" ? await video.threads({ legenda, urlVideo })
        : c === "tiktok" ? await video.tiktok({ legenda, arquivo: v.arquivo })
        : c === "bluesky" ? await video.bluesky({ legenda, arquivo: v.arquivo, alt: v.titulo, link: uTm(v.url, c), linkLimpo: dom })
        : await buffer.publicar({ texto: legenda, imagens: [], video: urlVideo, servicos: ["twitter"] });
      feitos[c] = { status: "ok", id: r.id ?? null, url: r.url ?? null, em: new Date().toISOString() };
      ok(`${app}/${c}: publicado`);
    } catch (e) {
      erro(`${app}/${c}: ${e.message}`);
      feitos[c] = { status: "erro", erro: e.message, em: new Date().toISOString() };
      falhas++;
    }
    estado.videos[app] = feitos; estado.atualizadoEm = new Date().toISOString(); gravarJson(ESTADO, estado);
  }
}
if (falhas) process.exitCode = 1;
