#!/usr/bin/env node
// Monta a captura.mp4 de um Short de IA a partir de telas premium estáticas (apps que exigem login ou têm uma só tela pública).
// Uso: node scripts/short-ia-estatico.mjs <app> <tela1> [tela2 ...] [--total 6.4] [--zoom 0.05] [--saida <pasta>]
//   <app>   nome de scripts/short-ia/<app>.json e de videos/shorts-ia/<app>/
//   <telaN> nome em assets/premium/<app>/ (com ou sem .png) ou caminho de um PNG 1170x2532
// Cada tela ganha zoom lento; com 2+ telas há transição suave de 0,4 s. Grava captura.mp4 (780x1688, 30 fps) e captura.json.
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";

const raiz = resolve(new URL("..", import.meta.url).pathname);
const args = process.argv.slice(2);
const opt = (nome, padrao) => { const i = args.indexOf(`--${nome}`); if (i < 0) return padrao; const v = args[i + 1]; args.splice(i, 2); return v; };
const total = Number(opt("total", "6.4")), zoom = Number(opt("zoom", "0.05")), saidaArg = opt("saida", null);
const [app, ...telas] = args;
if (!app || !telas.length) { console.error("uso: short-ia-estatico.mjs <app> <tela1> [tela2 ...] [--total 6.4] [--zoom 0.05] [--saida <pasta>]"); process.exit(1); }

const pasta = saidaArg ? resolve(saidaArg) : join(raiz, "videos/shorts-ia", app);
mkdirSync(pasta, { recursive: true });
const caminho = (t) => { const c = [t, join(raiz, "assets/premium", app, t), join(raiz, "assets/premium", app, `${t}.png`)].find((p) => existsSync(p) && p.endsWith(".png")); if (!c) throw new Error(`tela não encontrada: ${t}`); return c; };
const xf = 0.4, n = telas.length, seg = (total + (n - 1) * xf) / n, quadros = Math.round(seg * 30);
const ff = (a) => execFileSync("ffmpeg", ["-v", "error", "-y", ...a], { stdio: "inherit" });
const partes = telas.map((t, i) => {
  const saida = join(pasta, `c-${i}.mp4`);
  // pré-escala 2x para o zoom não tremer; foco no topo (y 10%)
  ff(["-loop", "1", "-i", caminho(t), "-vf", `scale=2340:5064:flags=lanczos,zoompan=z='1+${zoom}*on/${quadros}':x='(iw-iw/zoom)/2':y='(ih-ih/zoom)*0.1':d=${quadros}:s=780x1688:fps=30,format=yuv420p`, "-frames:v", String(quadros), "-c:v", "libx264", "-crf", "14", "-preset", "slow", saida]);
  return saida;
});
const destino = join(pasta, "captura.mp4");
if (n === 1) ff(["-i", partes[0], "-c", "copy", destino]);
else {
  let filtro = "", rotulo = "[0:v]";
  for (let i = 1; i < n; i++) { const desloc = (seg * i - xf * (i - 1) - xf).toFixed(3); filtro += `${rotulo}[${i}:v]xfade=transition=fade:duration=${xf}:offset=${desloc}[x${i}];`; rotulo = `[x${i}]`; }
  ff([...partes.flatMap((p) => ["-i", p]), "-filter_complex", `${filtro}${rotulo}format=yuv420p[v]`, "-map", "[v]", "-c:v", "libx264", "-crf", "14", destino]);
}
writeFileSync(join(pasta, "captura.json"), JSON.stringify({ lista: [], marcas: {}, total }) + "\n");
console.log(`captura estática: ${destino} (${n} tela(s), ${total}s)`);
