#!/usr/bin/env node
// publicar-video.mjs — publica os vídeos de apresentação 9:16 (videos/videos.json).
//
//   node scripts/publicar-video.mjs --dry-run                 mostra legendas, não envia
//   node scripts/publicar-video.mjs --app gasonol             um vídeo, todos os canais
//   node scripts/publicar-video.mjs --apps remedin,aieat       vários vídeos, todos os canais
//   node scripts/publicar-video.mjs --app gasonol --canais bluesky,threads
//   node scripts/publicar-video.mjs --forcar                  republica o que já saiu
//   node scripts/publicar-video.mjs --app gasonol --formato 16x9   versão horizontal (1920x1080)
//
// Formatos: 9x16 (padrão; arquivo `arquivo`/`arquivos["9x16"]` do manifesto) e 16x9
// (`arquivos["16x9"]`, ou videos/16x9/<app>.mp4). O 16:9 só sai em facebook, threads, bluesky e x:
// o Instagram (Reels) e o TikTok exigem 9:16 e são pulados. O estado do 16:9 fica em "<app>@16x9".
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
const formato = val("--formato") ?? "9x16";
if (!["9x16", "16x9"].includes(formato)) throw new Error(`--formato inválido: ${formato} (use 9x16 ou 16x9)`);
const CANAIS_16X9 = ["facebook", "threads", "bluesky", "x"];
const ASPECTO = formato === "16x9" ? { width: 1920, height: 1080 } : { width: 1080, height: 1920 };
const arquivoDe = (id, v) => v.arquivos?.[formato] ?? (formato === "9x16" ? v.arquivo : `videos/16x9/${id}.mp4`);
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
  const chave = formato === "9x16" ? app : `${app}@${formato}`;
  const feitos = estado.videos[chave] ?? {};
  const arquivo = arquivoDe(app, v);
  if (!existsSync(`${RAIZ}/${arquivo}`)) { erro(`${app}: ${arquivo} não existe (${formato})`); falhas++; continue; }
  const canais = canaisPedidos.filter((c) => {
    if (!CANAIS.includes(c)) throw new Error(`canal desconhecido: ${c}`);
    if (formato === "16x9" && !CANAIS_16X9.includes(c)) { aviso(`${app}/${c}: 16:9 não sai neste canal (exige 9:16) — pulando`); return false; }
    if (feitos[c]?.status === "ok" && !forcar) { log(`${app}/${c}: já publicado — pulando`); return false; }
    const p = pronto(c);
    if (!p.ok && !dryRun) { aviso(`${app}/${c}: desligado (${p.motivo})`); return false; }
    return true;
  });
  log(`— ${v.nome} (${formato}) · ${(statSync(`${RAIZ}/${arquivo}`).size / 1048576).toFixed(1)} MB · canais: ${canais.join(", ") || "nenhum"}`);
  if (dryRun) { for (const c of canais) log(`[${c}]\n${v.legendas[c]}\n`); continue; }
  if (!canais.length) continue;

  let urlVideo = null;
  if (canais.some((c) => ["instagram", "facebook", "threads", "x"].includes(c))) {
    try { urlVideo = await hospedarVideo(arquivo, formato === "9x16" ? undefined : `${formato}-${app}.mp4`); } catch (e) { erro(`${app}: hospedagem — ${e.message}`); falhas++; continue; }
  }
  const dom = new URL(v.url).hostname;
  for (const c of canais) {
    const legenda = v.legendas[c];
    try {
      const r = c === "instagram" ? await video.instagram({ legenda, urlVideo })
        : c === "facebook" ? await video.facebook({ legenda, urlVideo })
        : c === "threads" ? await video.threads({ legenda, urlVideo })
        : c === "tiktok" ? await video.tiktok({ legenda, arquivo })
        : c === "bluesky" ? await video.bluesky({ legenda, arquivo, aspecto: ASPECTO, alt: v.titulo, link: uTm(v.url, c), linkLimpo: dom })
        : await buffer.publicar({ texto: legenda, imagens: [], video: urlVideo, servicos: ["twitter"] });
      feitos[c] = { status: "ok", id: r.id ?? null, url: r.url ?? null, em: new Date().toISOString() };
      ok(`${app}/${c}: publicado`);
    } catch (e) {
      erro(`${app}/${c}: ${e.message}`);
      feitos[c] = { status: "erro", erro: e.message, em: new Date().toISOString() };
      falhas++;
    }
    estado.videos[chave] = feitos; estado.atualizadoEm = new Date().toISOString(); gravarJson(ESTADO, estado);
  }
}
if (falhas) process.exitCode = 1;
