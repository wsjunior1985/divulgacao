#!/usr/bin/env node
// videos-moldura.mjs — coloca a vinheta (intro) e o encerramento (outro) de um app em vídeos 9:16.
//
//   node scripts/videos-moldura.mjs preparar --app gasonol --origem videos/flow/gasonol-piloto/intro.mp4 \
//        [--intro 2.2:4.0] [--outro 7.0:10.0] [--url gasonol.com.br]   (origem 9:16 ou 16:9) gera videos/molduras/<app>/{intro,outro}.mp4 em 1080x1920
//   node scripts/videos-moldura.mjs aplicar --app gasonol [--id gasonol-1] [--dry-run]
//        refaz videos/9x16/<id>.mp4 = intro + vídeo original + outro, para os vídeos do app
//
// O original de cada vídeo fica em videos/nativos/anteriores/<id>-sem-moldura.mp4 (nunca é sobrescrito),
// então `aplicar` é idempotente. As vinhetas são 16:9 e entram inteiras (sem cortar a logo), na largura de 1080, centralizadas sobre o próprio
// vídeo desfocado. Os arquivos de vídeo não vão para o git; só este script e o campo `moldura` do manifesto.
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, renameSync } from "node:fs";
import { resolve } from "node:path";
import { lerJson, gravarJson, log, aviso, erro, RAIZ } from "./lib/base.js";

const [comando, ...resto] = process.argv.slice(2);
const val = (f) => (resto.includes(f) ? resto[resto.indexOf(f) + 1] : null);
const app = val("--app");
const dryRun = resto.includes("--dry-run");
const forcar = resto.includes("--forcar");
if (!["preparar", "aplicar"].includes(comando) || !app || !/^[a-z0-9-]+$/.test(app)) { erro("uso: videos-moldura.mjs <preparar|aplicar> --app <app> [...]"); process.exit(1); }
const ff = (args) => execFileSync("ffmpeg", ["-v", "error", "-y", ...args], { stdio: ["ignore", "inherit", "inherit"] });
const abs = (r) => resolve(RAIZ, r);
const pasta = abs(`videos/molduras/${app}`);

if (comando === "preparar") {
  const origem = val("--origem");
  if (!origem || !existsSync(abs(origem))) { erro("--origem inexistente"); process.exit(1); }
  mkdirSync(pasta, { recursive: true });
  const trecho = (spec, padrao) => (spec ?? padrao).split(":").map(Number);
  // Origem já vertical (9:16): só ajusta para 1080x1920. Origem 16:9: entra inteira (sem cortar) sobre o próprio fundo desfocado.
  const [largura, altura] = execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0:s=x", abs(origem)]).toString().trim().split("x").map(Number);
  const vertical = altura > largura;
  // URL no encerramento (--url gasonol.com.br): pílula do site, no estilo dos cards, aparece com fade sobre a logo.
  const url = val("--url");
  const escapar = (t) => String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  let pilula = null;
  if (url) {
    const { chromium } = await import("playwright");
    const fonteB64 = (await import("node:fs")).readFileSync(abs("assets/fontes/InterDisplay-ExtraBold.ttf")).toString("base64");
    const html = `<!doctype html><html><head><meta charset="utf-8"><style>@font-face{font-family:F;src:url(data:font/ttf;base64,${fonteB64});font-weight:800}
html,body{margin:0;background:transparent}.w{display:inline-block;padding:70px}.p{display:inline-flex;align-items:center;gap:22px;padding:30px 66px;border-radius:80px;background:linear-gradient(90deg,#ffd23f,#ff9f1c);box-shadow:0 10px 40px rgba(255,150,20,.45),0 0 0 3px rgba(255,255,255,.55) inset;font:800 78px/1 F;color:#1a1200;letter-spacing:-1.5px}
svg{width:72px;height:72px}</style></head><body><div class="w"><span class="p"><svg viewBox="0 0 24 24" fill="none" stroke="#1a1200" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9.5"/><path d="M2.5 12h19M12 2.5c3 3 3 16.500 0 19M12 2.5c-3 3-3 16.500 0 19"/></svg>${escapar(url)}</span></div></body></html>`;
    const nav = await chromium.launch(); const pg = await nav.newPage({ viewport: { width: 1100, height: 300 } });
    await pg.setContent(html); await pg.evaluate(() => document.fonts.ready);
    pilula = `${pasta}/url.png`;
    await pg.locator(".w").screenshot({ path: pilula, omitBackground: true }); await nav.close();
  }
  const montar = ([ini, fim], saida, comUrl = false) => {
    const dur = fim - ini;
    const base = vertical
      ? "[0:v]scale=1080:1920:flags=lanczos,fps=30,format=yuv420p"
      : "[0:v]split[a][b];[a]scale=-2:1920,crop=1080:1920,boxblur=40:6,eq=brightness=-0.05[bg];[b]scale=1080:-2[fg];[bg][fg]overlay=0:(H-h)/2,fps=30,format=yuv420p";
    const usaUrl = comUrl && pilula;
    const sobrepor = usaUrl ? `[b0];[1:v]format=rgba,fade=t=in:st=0.5:d=0.4:alpha=1[u];[b0][u]overlay=(W-w)/2:1260,format=yuv420p` : "";
    const entradas = ["-ss", String(ini), "-t", String(dur), "-i", abs(origem), ...(usaUrl ? ["-loop", "1", "-t", String(dur), "-i", pilula] : [])];
    ff([...entradas, "-filter_complex",
      base + sobrepor + `,fade=t=in:st=0:d=0.15,fade=t=out:st=${(dur - 0.25).toFixed(2)}:d=0.25[v];` +
      `[0:a]aresample=48000,aformat=channel_layouts=stereo,afade=t=in:st=0:d=0.1,afade=t=out:st=${(dur - 0.3).toFixed(2)}:d=0.3[a]`,
      "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", saida]);
  };
  montar(trecho(val("--intro"), "2.2:4.0"), `${pasta}/intro.mp4`);
  montar(trecho(val("--outro"), "7.0:10.0"), `${pasta}/outro.mp4`, true);
  log(`molduras de ${app} em videos/molduras/${app}/`);
  process.exit(0);
}

// aplicar
const manifesto = lerJson("videos/videos.json");
const alvos = Object.entries(manifesto.videos).filter(([id, v]) => (val("--id") ? id === val("--id") : v.youtube?.playlist === app));
if (!alvos.length) { erro(`nenhum vídeo do app ${app}`); process.exit(1); }
for (const arq of ["intro.mp4", "outro.mp4"]) if (!existsSync(`${pasta}/${arq}`)) { erro(`falta videos/molduras/${app}/${arq}; rode "preparar" antes`); process.exit(1); }
mkdirSync(abs("videos/nativos/anteriores"), { recursive: true });

for (const [id, v] of alvos) {
  const atual = abs(v.arquivo);
  const backup = abs(`videos/nativos/anteriores/${id}-sem-moldura.mp4`);
  if (!existsSync(backup)) {
    if (!existsSync(atual)) { aviso(`${id}: ${v.arquivo} não existe; pulando`); continue; }
    // Sem backup mas já marcado com moldura: o arquivo atual já tem vinheta; aplicar de novo duplicaria.
    if (v.moldura === app && !forcar) { erro(`${id}: já tem moldura e não há ${id}-sem-moldura.mp4; restaure o original ou use --forcar`); continue; }
    if (!dryRun) { copyFileSync(atual, `${backup}.tmp`); renameSync(`${backup}.tmp`, backup); }
  }
  log(`${id}: intro + ${id}-sem-moldura + outro → ${v.arquivo}`);
  if (dryRun) continue;
  const tmp = `${atual}.tmp.mp4`;
  ff(["-i", `${pasta}/intro.mp4`, "-i", backup, "-i", `${pasta}/outro.mp4`, "-filter_complex",
    "[1:v]scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,fps=30,format=yuv420p,setsar=1[m];" +
    "[0:v]setsar=1[i];[2:v]setsar=1[o];" +
    "[1:a]aresample=48000,aformat=channel_layouts=stereo[ma];[0:a]aresample=48000,aformat=channel_layouts=stereo[ia];[2:a]aresample=48000,aformat=channel_layouts=stereo[oa];" +
    "[i][ia][m][ma][o][oa]concat=n=3:v=1:a=1[v][a0];[a0]loudnorm=I=-14:TP=-1.5:LRA=11[a]",
    "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", tmp]);
  renameSync(tmp, atual);
  v.moldura = app;
}
if (!dryRun) gravarJson("videos/videos.json", manifesto);
