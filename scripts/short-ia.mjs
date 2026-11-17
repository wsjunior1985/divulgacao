#!/usr/bin/env node
// short-ia.mjs — Short com apresentadora gerada por IA + captura REAL do app, para qualquer app da WaldeApps.
//
//   node scripts/short-ia.mjs preparar <app>    pasta de trabalho, quadros de referência e prompt do Flow (LEIA-ME.md)
//   node scripts/short-ia.mjs capturar <app>    grava o fluxo real do app (scripts/short-ia/fluxos/<fluxo>.mjs) e monta a cena do celular
//   node scripts/short-ia.mjs transcrever <app> transcreve o clipe (whisper-cli) e sugere os tempos da legenda
//   node scripts/short-ia.mjs compor <app>      rosto + cena real + legenda → videos/9x16/<id>.mp4 (com a moldura do app, se existir)
//
// Config por app em scripts/short-ia/<app>.json; arquivos de vídeo em videos/shorts-ia/<app>/ (fora do git).
// O clipe da apresentadora (piloto.mp4) é gerado à mão no Google Flow (Veo 3.1), seguindo o LEIA-ME.md.
// Método e armadilhas: .claude/skills/short-apresentadora-ia/SKILL.md
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";
import { RAIZ, lerJson, log, erro } from "./lib/base.js";

const [comando, app] = process.argv.slice(2);
if (!["preparar", "capturar", "transcrever", "compor"].includes(comando) || !app || !/^[a-z0-9-]+$/.test(app)) { erro("uso: short-ia.mjs <preparar|capturar|transcrever|compor> <app>"); process.exit(1); }
const abs = (r) => resolve(RAIZ, r);
const cfg = JSON.parse(readFileSync(abs(`scripts/short-ia/${app}.json`), "utf8"));
cfg.id = process.env.SHORT_IA_ID ?? cfg.id; // útil para testar sem sobrescrever o vídeo oficial
for (const [campo, v] of [["id", cfg.id], ["app", cfg.app], ["cena.fluxo", cfg.cena?.fluxo]]) if (!/^[a-z0-9-]+$/.test(String(v))) { erro(`config inválida: ${campo}="${v}"`); process.exit(1); }
const pasta = abs(`videos/shorts-ia/${app}`);
mkdirSync(pasta, { recursive: true });
const ff = (args) => execFileSync("ffmpeg", ["-v", "error", "-y", ...args], { stdio: ["ignore", "inherit", "inherit"] });
const b64 = (arq, tipo) => `data:${tipo};base64,${readFileSync(arq).toString("base64")}`;
const escapar = (t) => String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const FONTE = abs("assets/fontes/InterDisplay-ExtraBold.ttf");

async function chromium() { return (await import("playwright")).chromium; }

// ---------------------------------------------------------------------------------------------- preparar
if (comando === "preparar") {
  const ref = cfg.apresentadora;
  const quadroRef = `${pasta}/1-apresentadora.png`;
  const pron = ref.pronome === "he" ? "he" : "she";
  // Apresentadora existente (quadro de um clipe) ou NOVA (imagem gerada no Flow, uma por app).
  if (ref.referencia && existsSync(abs(ref.referencia))) ff(["-ss", String(ref.quadro ?? 1), "-i", abs(ref.referencia), "-frames:v", "1", quadroRef]);
  const prompt = `Vertical 9:16 realistic smartphone-style video, natural daylight, handheld feel. The ${ref.descricao} from the FIRST reference image only (ignore any other person in other images) ${ref.cenario}, looks at the camera and speaks in Brazilian Portuguese with a friendly, casual, natural tone: "${cfg.fala}" While ${pron} speaks, ${pron} ${ref.gesto}. Clear voice, faint ambient sound, no music. The phone screen must NOT show any readable interface or text. No subtitles, no text overlays, no logos, no watermarks.`;
  writeFileSync(`${pasta}/prompt.txt`, `${prompt}\n`);
  let etapaImagem = "";
  if (!ref.referencia) {
    const promptImagem = `Photorealistic vertical 9:16 portrait, shot like a smartphone photo in natural daylight, shallow depth of field. A ${ref.descricao}, upper body visible, ${ref.cenario}. Relaxed friendly expression with a slight smile, looking straight at the camera, holding a smartphone in one hand with the screen turned away. Natural skin texture, realistic hands (five fingers), no text, no logos, no watermarks.`;
    writeFileSync(`${pasta}/prompt-imagem.txt`, `${promptImagem}\n`);
    etapaImagem = `## Etapa 0: criar a apresentadora deste app (uma por projeto)\nNo Flow, peça uma imagem (modelo Nano Banana, 9:16, x2) com o prompt de \`prompt-imagem.txt\`. Escolha a melhor (rosto natural, mãos com 5 dedos, sem texto) e salve aqui como \`1-apresentadora.png\`. Ela vira a referência do vídeo e deve ser **diferente** das apresentadoras dos outros apps.\n\n## Prompt da imagem\n${promptImagem}\n\n`;
  }
  writeFileSync(`${pasta}/LEIA-ME.md`, `# Short com apresentadora de IA: ${app}\n\n## Fala\n${cfg.fala}\n\n${etapaImagem}## Vídeo no Flow (flow.google, conta com o plano Google AI Pro)\n1. Suba só a imagem \`1-apresentadora.png\` (nesta pasta) e anexe-a ao pedido.\n2. Agente > Configurações: modelo **Veo 3.1 Fast**, **9:16**, x1; "Confirmar antes de gerar: Sempre" (custo ~20 créditos).\n3. Cole o prompt abaixo (também em \`prompt.txt\`; copie com \`LC_ALL=en_US.UTF-8 pbcopy < prompt.txt\` para não quebrar os acentos).\n4. Baixe em qualidade original e salve aqui como \`piloto.mp4\`.\n\n## Prompt do vídeo\n${prompt}\n\n## Depois\n\`node scripts/short-ia.mjs capturar ${app}\`, \`transcrever ${app}\` (ajuste \`tempos\` no JSON) e \`compor ${app}\`.\n`);
  log(`preparado em ${pasta} (${ref.referencia ? (existsSync(quadroRef) ? "referência extraída" : "sem quadro") : "apresentadora NOVA: gere a imagem com prompt-imagem.txt"})`);
  process.exit(0);
}

// ---------------------------------------------------------------------------------------------- capturar
if (comando === "capturar") {
  const fluxoMod = await import(`./short-ia/fluxos/${cfg.cena.fluxo}.mjs`);
  const quadros = `${pasta}/captura`; rmSync(quadros, { recursive: true, force: true }); mkdirSync(quadros, { recursive: true });
  const nav = await (await chromium()).launch();
  const ctx = await nav.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: "dark", serviceWorkers: "block" }); // sem service worker: o bloqueio de escritas vale para tudo
  await ctx.addInitScript((c) => { for (const [k, v] of Object.entries(c.sessionStorage ?? {})) { try { sessionStorage.setItem(k, v); } catch {} } for (const [k, v] of Object.entries(c.localStorage ?? {})) { try { localStorage.setItem(k, v); } catch {} } }, fluxoMod.contexto ?? {});
  const leituraPost = (fluxoMod.permitirPost ?? []).map((x) => new RegExp(x)); // POSTs que só leem (ex.: funções de catálogo/horários); o fluxo declara quais
  await ctx.route("**/*", (r) => (["GET", "HEAD", "OPTIONS"].includes(r.request().method()) || leituraPost.some((re) => re.test(r.request().url())) ? r.continue() : (console.log(`   bloqueado ${r.request().method()} ${r.request().url().slice(0, 110)}`), r.fulfill({ status: 204, body: "" })))); // só leitura
  const p = await ctx.newPage();
  await p.goto(fluxoMod.url, { waitUntil: "networkidle", timeout: 45000 }); await p.waitForTimeout(1500);
  const lista = []; let rodando = true; let n = 0; const t0 = Date.now();
  const laco = (async () => { while (rodando) { const f = `${String(n++).padStart(5, "0")}.jpg`; const t = Date.now() - t0; await p.screenshot({ path: `${quadros}/${f}`, type: "jpeg", quality: 90 }); lista.push({ f, t }); } })();
  const marcas = {}; const marca = (k) => { marcas[k] = (Date.now() - t0) / 1000; };
  try { await fluxoMod.default({ p, esp: (ms) => p.waitForTimeout(ms), marca }); }
  finally { rodando = false; await laco; await nav.close(); }
  const total = (Date.now() - t0) / 1000;
  writeFileSync(`${pasta}/captura.json`, JSON.stringify({ lista, marcas, total }, null, 1));
  const txt = lista.map((x, i) => `file '${quadros}/${x.f}'\nduration ${Math.max((((lista[i + 1]?.t ?? total * 1000) - x.t) / 1000), 0.02).toFixed(3)}\n`).join("") + `file '${quadros}/${lista.at(-1).f}'\n`;
  writeFileSync(`${pasta}/captura.txt`, txt);
  ff(["-f", "concat", "-safe", "0", "-i", `${pasta}/captura.txt`, "-vf", "fps=30,format=yuv420p,scale=trunc(iw/2)*2:trunc(ih/2)*2", "-an", `${pasta}/captura.mp4`]);
  log(`captura: ${lista.length} quadros, ${total.toFixed(1)} s, marcas ${JSON.stringify(marcas)}`);
  process.exit(0);
}

// ---------------------------------------------------------------------------------------------- transcrever
if (comando === "transcrever") {
  const clipe = `${pasta}/piloto.mp4`;
  if (!existsSync(clipe)) { erro(`falta ${clipe}`); process.exit(1); }
  const modelo = `${homedir()}/.cache/whisper-cpp/ggml-small-q5_1.bin`;
  if (!existsSync(modelo)) { erro(`falta o modelo ${modelo} (huggingface.co/ggerganov/whisper.cpp, ggml-small-q5_1.bin)`); process.exit(1); }
  ff(["-i", clipe, "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le", `${pasta}/fala.wav`]);
  const marca = cfg.destaques?.[0]?.trecho ?? "";
  execFileSync("whisper-cli", ["-m", modelo, "-f", `${pasta}/fala.wav`, "-l", "pt", "-ojf", "-of", `${pasta}/trans`, "-ml", "1", "-sow", ...(marca ? ["--prompt", marca] : [])], { stdio: "ignore" });
  const t = JSON.parse(readFileSync(`${pasta}/trans.json`, "utf8")).transcription.filter((x) => x.text.trim());
  console.log("fala configurada:", cfg.fala, "\nfala ouvida:", t.map((x) => x.text).join("").trim());
  for (const x of t) console.log(`${(x.offsets.from / 1000).toFixed(2)}-${(x.offsets.to / 1000).toFixed(2)}  ${x.text.trim()}`);
  console.log("\nAjuste `tempos` em scripts/short-ia/" + app + ".json: um bloco por linha de legenda (ini/fim em segundos).");
  process.exit(0);
}

// ---------------------------------------------------------------------------------------------- compor
const clipe = `${pasta}/piloto.mp4`;
for (const arq of [clipe, `${pasta}/captura.mp4`]) if (!existsSync(arq)) { erro(`falta ${arq}`); process.exit(1); }
if (!cfg.tempos?.length) { erro("`tempos` vazio no JSON: rode `transcrever` e preencha"); process.exit(1); }
const duracaoClipe = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", clipe]).toString());
const fimFala = Math.max(...cfg.tempos.map((t) => t.fim));
const total = Math.min(duracaoClipe + 0.9, fimFala + 1.0);
const corte = cfg.corte, xf = 0.25;
const cenaInicio = corte - xf, cenaDur = total - cenaInicio;
const nav = await (await chromium()).launch();
const pg = await nav.newPage({ viewport: { width: 1080, height: 1920 } });
const fonte = b64(FONTE, "font/ttf");

// 1) fundo e moldura do celular
const logo = cfg.cena.logo ? b64(abs(cfg.cena.logo), "image/png") : null;
await pg.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;width:1080px;height:1920px;overflow:hidden;background:#050505}.f{position:absolute;inset:0;background:${cfg.cena.fundo}}img{position:absolute;left:50%;top:40px;max-width:${cfg.cena.logoLargura ?? 340}px;max-height:${cfg.cena.logoAltura ?? 215}px;width:auto;height:auto;transform:translateX(-50%)}</style></head><body><div class="f"></div>${logo ? `<img src="${logo}">` : ""}</body></html>`);
await pg.waitForTimeout(300); await pg.screenshot({ path: `${pasta}/cena-fundo.png` });
await pg.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;width:1080px;height:1920px;overflow:hidden;background:transparent}</style></head><body><svg width="1080" height="1920" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8d928a"/><stop offset=".5" stop-color="#2b2e2a"/><stop offset="1" stop-color="#6c7168"/></linearGradient></defs><path fill-rule="evenodd" fill="url(#g)" d="M262 360a80 80 0 0 1 80-80h396a80 80 0 0 1 80 80v1011a80 80 0 0 1-80 80H342a80 80 0 0 1-80-80Z M280 366a62 62 0 0 1 62-62h396a62 62 0 0 1 62 62v999a62 62 0 0 1-62 62H342a62 62 0 0 1-62-62Z"/><rect x="470" y="318" width="140" height="38" rx="19" fill="#000"/></svg></body></html>`);
await pg.screenshot({ path: `${pasta}/cena-moldura.png`, omitBackground: true });

// 2) legendas (PNG transparente por linha)
const cap = JSON.parse(readFileSync(`${pasta}/captura.json`, "utf8"));
const estilosCores = Object.entries(cfg.cores ?? {}).map(([k, v]) => `.c .${k}{color:${v}}`).join("");
const comDestaques = (texto) => { let h = escapar(texto); for (const d of cfg.destaques ?? []) h = h.split(escapar(d.trecho)).join(d.html); return h; };
for (const [i, t] of cfg.tempos.entries()) {
  await pg.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>@font-face{font-family:F;src:url(${fonte});font-weight:800}html,body{margin:0;width:1080px;height:1920px;background:transparent;overflow:hidden}.c{position:absolute;left:40px;right:40px;top:1545px;text-align:center;font:800 58px/1.12 F;white-space:nowrap;color:#fff;text-shadow:0 0 6px #000,0 4px 14px #000,0 0 28px rgba(0,0,0,.85),3px 3px 0 #000,-3px 3px 0 #000,3px -3px 0 #000,-3px -3px 0 #000}.c i{font-style:normal}${estilosCores}</style></head><body><div class="c">${comDestaques(t.texto)}</div></body></html>`);
  await pg.evaluate(() => document.fonts.ready);
  await pg.evaluate(() => { const el = document.querySelector(".c"); let f = 58; while (el.scrollWidth > 1000 && f > 36) { f -= 2; el.style.fontSize = `${f}px`; } }); // cabe em uma linha
  await pg.waitForTimeout(150);
  await pg.screenshot({ path: `${pasta}/leg-${i}.png`, omitBackground: true });
}
await nav.close();

// 3) cena do celular com a captura real (início cortado e acelerada para caber na narração)
const durCaptura = cap.total - (cfg.cena.inicio ?? 0);
const vel = durCaptura / cenaDur;
ff(["-i", `${pasta}/captura.mp4`, "-vf", `trim=start=${cfg.cena.inicio ?? 0},setpts=(PTS-STARTPTS)/${vel.toFixed(4)},scale=520:1126:flags=lanczos,format=yuv420p`, "-an", "-t", cenaDur.toFixed(2), `${pasta}/tela-real.mp4`]);
ff(["-loop", "1", "-t", cenaDur.toFixed(2), "-i", `${pasta}/cena-fundo.png`, "-i", `${pasta}/tela-real.mp4`, "-loop", "1", "-t", cenaDur.toFixed(2), "-i", `${pasta}/cena-moldura.png`,
  "-filter_complex", "[0:v][1:v]overlay=280:304[a];[a][2:v]overlay=0:0,fps=30,format=yuv420p[v]", "-map", "[v]", "-t", cenaDur.toFixed(2), "-c:v", "libx264", "-crf", "18", "-preset", "medium", `${pasta}/cena-real.mp4`]);

// 4) composição final (rosto → cena real, legendas sincronizadas, áudio do clipe com fade)
const entradas = ["-i", clipe, "-i", `${pasta}/cena-real.mp4`, ...cfg.tempos.flatMap((_, i) => ["-i", `${pasta}/leg-${i}.png`])];
let cadeia = `[0:v]trim=0:${(corte + 0.25).toFixed(2)},setpts=PTS-STARTPTS,scale=1080:1920:flags=lanczos,unsharp=5:5:0.7,fps=30,format=yuv420p[v0];[1:v]setpts=PTS-STARTPTS,fps=30,format=yuv420p[v1];[v0][v1]xfade=transition=fade:duration=${xf}:offset=${cenaInicio.toFixed(2)}[x0];`;
cfg.tempos.forEach((t, i) => { cadeia += `[x${i}][${i + 2}:v]overlay=enable='gte(t,${t.ini})*lt(t,${t.fim})'[${i === cfg.tempos.length - 1 ? "v" : `x${i + 1}`}];`; });
cadeia += `[0:a]atrim=0:${(fimFala + 0.05).toFixed(2)},afade=t=out:st=${(fimFala - 0.4).toFixed(2)}:d=0.4,apad=whole_dur=${total.toFixed(2)},asetpts=PTS-STARTPTS[a]`;
const saida = abs(`videos/9x16/${cfg.id}.mp4`);
const backup = abs(`videos/nativos/anteriores/${cfg.id}-sem-moldura.mp4`);
const tmp = `${saida}.tmp.mp4`;
ff([...entradas, "-filter_complex", cadeia, "-map", "[v]", "-map", "[a]", "-t", total.toFixed(2), "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", tmp]);
renameSync(tmp, saida);
// a composição nova passa a ser o "original sem moldura" (só depois de pronta, para nunca perder o anterior se o ffmpeg falhar)
mkdirSync(abs("videos/nativos/anteriores"), { recursive: true });
copyFileSync(saida, `${backup}.tmp`); renameSync(`${backup}.tmp`, backup);
log(`composto: ${saida} (${total.toFixed(1)} s, captura x${vel.toFixed(2)})`);
if (existsSync(abs(`videos/molduras/${cfg.app}/intro.mp4`)) && lerJson("videos/videos.json").videos[cfg.id]) {
  execFileSync(process.execPath, [abs("scripts/videos-moldura.mjs"), "aplicar", "--app", cfg.app, "--id", cfg.id], { stdio: "inherit" });
} else log("sem moldura aplicada (falta a vinheta do app ou o vídeo no manifesto)");
