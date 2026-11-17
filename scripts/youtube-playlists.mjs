#!/usr/bin/env node
// youtube-playlists.mjs — coloca nas playlists dos apps os Shorts já publicados que ainda não estão.
//
//   node scripts/youtube-playlists.mjs [--dry-run]
//
// Lê estado/videos.json e estado/videos-rodizio.json, usa `youtube.playlist` de cada vídeo em
// videos/videos.json e grava `playlistId` no registro do canal youtube. Idempotente.
import { carregarEnv, lerJson, gravarJson, log, aviso, erro } from "./lib/base.js";
import * as youtube from "./canais/youtube.js";

carregarEnv();
const dryRun = process.argv.includes("--dry-run");
const manifesto = lerJson("videos/videos.json");
const pronto = youtube.pronto();
if (!pronto.ok) { erro(`YouTube desligado: ${pronto.motivo}`); process.exit(1); }

let feitos = 0, falhas = 0;
for (const arquivo of ["estado/videos.json", "estado/videos-rodizio.json"]) {
  const estado = lerJson(arquivo, { videos: {} });
  for (const [chaveEstado, canais] of Object.entries(estado.videos ?? {})) {
    const yt = canais?.youtube;
    if (!yt || yt.status !== "ok" || !yt.id || yt.playlistId) continue;
    if (chaveEstado.includes("@")) continue; // versões 16:9 não vão ao YouTube Shorts
    const idVideo = chaveEstado.replace(/^\d{4}-\d{2}-\d{2}-p\d+-/, "");
    const chave = manifesto.videos[idVideo]?.youtube?.playlist, definicao = manifesto.playlists?.[chave];
    if (!chave || !definicao) { aviso(`${idVideo}: sem playlist definida no manifesto`); continue; }
    if (dryRun) { log(`[dry-run] ${idVideo} (${yt.id}) → "${definicao.titulo}"`); continue; }
    try {
      yt.playlistId = (await youtube.registrarNaPlaylist({ chave, definicao, videoId: yt.id })).playlistId;
      gravarJson(arquivo, estado); feitos++;
    } catch (e) { erro(`${idVideo} (${yt.id}): ${e.message}`); falhas++; }
  }
}
log(`playlists: ${feitos} vídeo(s) colocados${falhas ? `, ${falhas} falha(s)` : ""}`);
if (falhas) process.exitCode = 1;
