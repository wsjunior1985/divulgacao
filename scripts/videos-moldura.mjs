#!/usr/bin/env node
// videos-moldura.mjs — coloca a vinheta (intro) e o encerramento (outro) de um app em vídeos 9:16.
//
//   node scripts/videos-moldura.mjs preparar --app gasonol --origem videos/flow/gasonol-piloto/intro.mp4 \
//        [--intro 2.2:4.0] [--outro 7.0:10.0] [--url gasonol.com.br] [--escala 1.25] [--fundo-cor #06101f] [--url-y 1260] [--fusao 0.2]   (origem 9:16 ou 16:9) gera videos/molduras/<app>/{intro,outro}.mp4 em 1080x1920
//   node scripts/videos-moldura.mjs preparar --app fazopix --padrao --url fazopix.waldeapps.systems   (sem vinheta própria: logo + fundo do app)
//   node scripts/videos-moldura.mjs aplicar --app gasonol [--id gasonol-1] [--dry-run]
//        refaz videos/9x16/<id>.mp4 = intro + vídeo original + outro, para os vídeos do app
//
// O original de cada vídeo fica em videos/nativos/anteriores/<id>-sem-moldura.mp4 (nunca é sobrescrito),
// então `aplicar` é idempotente. As vinhetas são 16:9 e entram inteiras (sem cortar a logo), na largura de 1080, centralizadas sobre o próprio
// vídeo desfocado. Os arquivos de vídeo não vão para o git; só este script e o campo `moldura` do manifesto.
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
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

if (comando === "preparar" && resto.includes("--padrao")) {
  // Vinheta simples (logo com fade e zoom suave) + encerramento com a pílula da URL, a partir da logo e do fundo do app
  // (scripts/short-ia/<app>.json: cena.logo e cena.fundo). Para apps sem vinheta própria; o áudio é silêncio.
  const url = val("--url");
  if (!url) { erro("--url obrigatório com --padrao"); process.exit(1); }
  if (!existsSync(abs(`scripts/short-ia/${app}.json`))) { erro(`--padrao usa a logo e o fundo de scripts/short-ia/${app}.json (cena.logo e cena.fundo); crie esse arquivo antes`); process.exit(1); }
  const conf = JSON.parse(readFileSync(abs(`scripts/short-ia/${app}.json`), "utf8"));
  mkdirSync(pasta, { recursive: true });
  const { chromium } = await import("playwright");
  const fonteB64 = readFileSync(abs("assets/fontes/InterDisplay-ExtraBold.ttf")).toString("base64");
  const logoB64 = readFileSync(abs(conf.cena.logo)).toString("base64");
  const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pagina = (comPilula) => `<!doctype html><html><head><meta charset="utf-8"><style>@font-face{font-family:F;src:url(data:font/ttf;base64,${fonteB64});font-weight:800}html,body{margin:0;width:1080px;height:1920px;overflow:hidden;background:#050505}.f{position:absolute;inset:0;background:${conf.cena.fundo}}img{position:absolute;left:50%;top:${comPilula ? 560 : 700}px;width:640px;transform:translateX(-50%)}.p{position:absolute;left:50%;top:960px;transform:translateX(-50%);display:flex;align-items:center;gap:22px;padding:30px 66px;border-radius:80px;background:linear-gradient(90deg,#ffd23f,#ff9f1c);box-shadow:0 10px 40px rgba(255,150,20,.45);font:800 78px/1 F;color:#1a1200;letter-spacing:-1.5px;white-space:nowrap}</style></head><body><div class="f"></div><img src="data:image/png;base64,${logoB64}">${comPilula ? `<div class="p">${esc(url)}</div>` : ""}</body></html>`;
  const nav = await chromium.launch(); const pg = await nav.newPage({ viewport: { width: 1080, height: 1920 } });
  for (const [nome, comPilula] of [["intro", false], ["outro", true]]) { await pg.setContent(pagina(comPilula)); await pg.evaluate(() => document.fonts.ready); await pg.evaluate(async () => { const el = document.querySelector(".p"); if (!el) return; const im = document.querySelector("img"); await im.decode(); el.style.top = `${Math.round(im.getBoundingClientRect().bottom + 70)}px`; let f = 78; while (el.getBoundingClientRect().width > 940 && f > 34) { f -= 2; el.style.fontSize = `${f}px`; el.style.padding = `${Math.round(f * 0.38)}px ${Math.round(f * 0.85)}px`; } }); await pg.waitForTimeout(300); await pg.screenshot({ path: `${pasta}/${nome}.png` }); }
  await nav.close();
  const zoom = "zoompan=z='min(1+0.0009*on,1.06)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':fps=30:s=1080x1920";
  for (const [nome, dur] of [["intro", 1.6], ["outro", 3.0]]) {
    ff(["-framerate", "30", "-loop", "1", "-t", String(dur), "-i", `${pasta}/${nome}.png`, "-f", "lavfi", "-t", String(dur), "-i", "anullsrc=r=48000:cl=stereo", "-filter_complex",
      `[0:v]${zoom}:d=${Math.round(dur * 30)},fade=t=in:st=0:d=0.25,fade=t=out:st=${(dur - 0.25).toFixed(2)}:d=0.25,format=yuv420p[v]`,
      "-map", "[v]", "-map", "1:a", "-t", String(dur), "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", `${pasta}/${nome}.mp4`]);
  }
  log(`molduras padrão de ${app} em videos/molduras/${app}/`);
  process.exit(0);
}

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
    await pg.evaluate(() => { const el = document.querySelector(".p"); let f = 78; while (el.getBoundingClientRect().width > 940 && f > 34) { f -= 2; el.style.fontSize = `${f}px`; el.style.padding = `${Math.round(f * 0.38)}px ${Math.round(f * 0.85)}px`; } });
    pilula = `${pasta}/url.png`;
    await pg.locator(".w").screenshot({ path: pilula, omitBackground: true }); await nav.close();
  }
  const escala = Number(val("--escala") ?? 1); // só para origem 16:9
  // Fundo natural para origem 16:9: brilho suave + partículas que se movem devagar em toda a altura, no lugar de uma cor chapada.
  const fundoCor = /^#[0-9a-fA-F]{6}$/.test(val("--fundo-cor") ?? "") ? val("--fundo-cor") : "#06101f";
  const partCor = val("--particulas-cor") ?? "#bfe8ff";
  if (!vertical) {
    const { chromium } = await import("playwright");
    const nav = await chromium.launch(); const pg = await nav.newPage({ viewport: { width: 1080, height: 1920 } });
    await pg.setContent(`<!doctype html><html><head><style>html,body{margin:0;width:1080px;height:1920px;background:${fundoCor}}.g{position:absolute;inset:0;background:radial-gradient(ellipse 760px 620px at 50% 50%,rgba(40,90,170,.34),transparent 72%),radial-gradient(ellipse 900px 500px at 20% 8%,rgba(30,70,140,.14),transparent 70%),radial-gradient(ellipse 900px 500px at 80% 95%,rgba(20,80,120,.12),transparent 70%)}</style></head><body><div class="g"></div></body></html>`);
    await pg.screenshot({ path: `${pasta}/fundo.png` });
    await pg.setContent(`<!doctype html><html><body style="margin:0;background:transparent"><canvas id="c" width="1080" height="1920"></canvas></body></html>`);
    await pg.evaluate((cor) => {
      let sd = 1234567; const rnd = () => (sd = (sd * 1664525 + 1013904223) % 4294967296) / 4294967296;
      const c = document.getElementById("c").getContext("2d");
      for (let i = 0; i < 70; i++) { const r = 5 + rnd() * 10, x = rnd() * 1080, y = rnd() * 1920, g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(160,210,255,${0.05 + rnd() * 0.08})`); g.addColorStop(1, "rgba(160,210,255,0)"); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); }
      for (let i = 0; i < 190; i++) { const r = 0.8 + Math.pow(rnd(), 2.2) * 2.6, x = rnd() * 1080, y = rnd() * 1920; c.fillStyle = cor; c.globalAlpha = 0.18 + rnd() * 0.6; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); }
    }, partCor);
    await pg.screenshot({ path: `${pasta}/particulas.png`, omitBackground: true }); await nav.close();
  }
  const congelar = Number(val("--outro-congelar") ?? 0); // segundos extras segurando o último quadro do encerramento
  const montar = ([ini, fim], saida, comUrl = false) => {
    const dur = fim - ini + (comUrl ? congelar : 0);
    const base = vertical
      ? "[0:v]scale=1080:1920:flags=lanczos,fps=30,format=yuv420p"
      // 16:9 sem recorte da logo: o quadro inteiro é ampliado por --escala (largura = 1080 × escala; só as laterais vazias são cortadas),
      // centralizado sobre o fundo natural (fundo.png + partículas em movimento lento) e com as bordas superior e inferior
      // se diluindo nele (máscara de 160 px): sem faixa quadrada visível.
      : (() => {
        const fgH = Math.round((1080 * escala * 9) / 16 / 2) * 2, topH = Math.floor((1920 - fgH) / 2 / 2) * 2;
        const iF = comUrl && pilula ? 2 : 1, iP = iF + 1;
        return `[${iF}:v]format=yuv420p[bg0];[${iP}:v]format=rgba,scroll=vertical=0.0012[pt];[bg0][pt]overlay=0:0[bg];[0:v]scale=${Math.round(1080 * escala)}:${fgH},crop=min(iw\\,1080):${fgH},fps=30,format=yuva420p,geq=lum='lum(X,Y)':cb='cb(X,Y)':cr='cr(X,Y)':a='255*min(1,min(Y,H-1-Y)/160)'[fgf];[bg][fgf]overlay=(W-w)/2:${topH}:shortest=1,format=yuv420p`;
      })();
    const usaUrl = comUrl && pilula;
    const sobrepor = usaUrl ? `[b0];[1:v]format=rgba,fade=t=in:st=0.5:d=0.4:alpha=1[u];[b0][u]overlay=(W-w)/2:${Number(val("--url-y") ?? 1260)},format=yuv420p` : "";
    const loopPng = (arq) => ["-framerate", "30", "-loop", "1", "-t", String(dur), "-i", arq];
    const entradas = ["-ss", String(ini), "-t", String(fim - ini), "-i", abs(origem), ...(usaUrl ? ["-loop", "1", "-t", String(dur), "-i", pilula] : []), ...(vertical ? [] : [...loopPng(`${pasta}/fundo.png`), ...loopPng(`${pasta}/particulas.png`)])];
    ff([...entradas, "-filter_complex",
      base + (comUrl && congelar ? `,tpad=stop_mode=clone:stop_duration=${congelar}` : "") + sobrepor + `,fade=t=in:st=0:d=0.15,fade=t=out:st=${(dur - 0.25).toFixed(2)}:d=0.25[v];` +
      `[0:a]aresample=48000,aformat=channel_layouts=stereo,${comUrl && congelar ? `apad=pad_dur=${congelar},` : ""}afade=t=in:st=0:d=0.1,afade=t=out:st=${(dur - 0.3).toFixed(2)}:d=0.3[a]`,
      "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", saida]);
  };
  montar(trecho(val("--intro"), "2.2:4.0"), `${pasta}/intro.mp4`);
  montar(trecho(val("--outro"), "7.0:10.0"), `${pasta}/outro.mp4`, true);
  writeFileSync(`${pasta}/moldura.json`, JSON.stringify({ fusao: Number(val("--fusao") ?? 0) }));
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
  const dur = (arq) => Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", arq]).toString());
  const fusao = existsSync(`${pasta}/moldura.json`) ? Number(JSON.parse(readFileSync(`${pasta}/moldura.json`, "utf8")).fusao ?? 0) : 0;
  const norm = "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,fps=30,format=yuv420p,setsar=1";
  const aud = "aresample=48000,aformat=channel_layouts=stereo";
  const dI = dur(`${pasta}/intro.mp4`), dM = dur(backup);
  const juncao = fusao > 0
    // a vinheta e a primeira fala se sobrepõem por `fusao` s (a fala entra logo que a logo aparece)
    ? `[0:v]fps=30,format=yuv420p,setsar=1,settb=1/30[i];[1:v]${norm},settb=1/30[m];[2:v]fps=30,format=yuv420p,setsar=1,settb=1/30[o];[i][m]xfade=transition=fade:duration=${fusao}:offset=${(dI - fusao).toFixed(3)}[x1];[x1][o]xfade=transition=fade:duration=${fusao}:offset=${(dI + dM - 2 * fusao).toFixed(3)}[v];` +
      `[0:a]${aud}[ia];[1:a]${aud}[ma];[2:a]${aud}[oa];[ia][ma]acrossfade=d=${fusao}[a1];[a1][oa]acrossfade=d=${fusao}[a0];[a0]loudnorm=I=-14:TP=-1.5:LRA=11[a]`
    : `[1:v]${norm}[m];[0:v]setsar=1[i];[2:v]setsar=1[o];[1:a]${aud}[ma];[0:a]${aud}[ia];[2:a]${aud}[oa];[i][ia][m][ma][o][oa]concat=n=3:v=1:a=1[v][a0];[a0]loudnorm=I=-14:TP=-1.5:LRA=11[a]`;
  ff(["-i", `${pasta}/intro.mp4`, "-i", backup, "-i", `${pasta}/outro.mp4`, "-filter_complex", juncao,
    "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", tmp]);
  renameSync(tmp, atual);
  v.moldura = app;
}
if (!dryRun) gravarJson("videos/videos.json", manifesto);
