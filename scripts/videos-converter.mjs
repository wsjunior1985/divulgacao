#!/usr/bin/env node
// videos-converter.mjs — gera a versão 9:16 (1080x1920) de cada vídeo de apresentação.
//
//   node scripts/videos-converter.mjs [--origem <pasta>] [--app gasonol]
//
// Se existir videos/nativos/<app>.mp4 (render vertical de verdade), ele é só
// normalizado. Senão, o 16:9 entra inteiro no centro sobre um fundo desfocado
// do próprio vídeo (nada é cortado).
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { RAIZ, log, ok, aviso } from "./lib/base.js";

const args = process.argv.slice(2);
const pega = (f) => (args.includes(f) ? args[args.indexOf(f) + 1] : null);
const origem = pega("--origem") ?? join(homedir(), "Desktop", "Vídeos de Apresentação");
const so = pega("--app");
const saida = join(RAIZ, "videos", "9x16");
mkdirSync(saida, { recursive: true });

const FILTRO_FIT =
  "[0:v]split=2[a][b];[a]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=40:5,eq=brightness=-0.08[bg];" +
  "[b]scale=1080:-2[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2,format=yuv420p[v]";
const FILTRO_NATIVO = "[0:v]scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,format=yuv420p[v]";

for (const arq of readdirSync(origem).filter((f) => f.endsWith("-apresentacao.mp4"))) {
  const app = arq.replace("-apresentacao.mp4", "");
  if (so && so !== app) continue;
  const nativo = join(RAIZ, "videos", "nativos", `${app}.mp4`);
  const entrada = existsSync(nativo) ? nativo : join(origem, arq);
  const destino = join(saida, `${app}.mp4`);
  log(`${app}: ${existsSync(nativo) ? "nativo vertical" : "16:9 com fundo desfocado"} → ${destino}`);
  execFileSync(
    "ffmpeg",
    ["-v", "error", "-y", "-i", entrada, "-filter_complex", existsSync(nativo) ? FILTRO_NATIVO : FILTRO_FIT,
     "-map", "[v]", "-map", "0:a?", "-c:v", "libx264", "-profile:v", "high", "-preset", "slow", "-crf", "21",
     "-r", "30", "-c:a", "aac", "-b:a", "128k", "-ar", "44100", "-movflags", "+faststart", destino],
    { stdio: "inherit" },
  );
  ok(`${app}: ${(statSync(destino).size / 1048576).toFixed(1)} MB`);
}
if (!readdirSync(saida).length) aviso("nenhum vídeo convertido");
