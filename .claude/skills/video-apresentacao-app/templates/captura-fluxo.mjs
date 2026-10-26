// Modelo de captura: grava um fluxo do app como sequência de screenshots JPEG a 30 fps + list.json (durações) e cues
// (cursor/teclas). Rode:  node captura-fluxo.mjs   (ajuste SITE, OUT e o roteiro abaixo; um fluxo por cena).
// Regras: viewport 390x844 @3x, contexto novo, escritas bloqueadas (204), dados pessoais fictícios, nunca criar conta.
import { chromium } from 'playwright';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';

const SITE = process.env.SITE ?? 'https://exemplo.waldeapps.systems';
const OUT = new URL('./frames/', import.meta.url).pathname;
rmSync(OUT, { recursive: true, force: true }); mkdirSync(OUT, { recursive: true });

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, colorScheme: 'dark' });
const p = await ctx.newPage();
// tema escuro do app (ajuste a chave conforme o código do app) e bloqueio de escritas
await p.addInitScript(() => { try { localStorage.setItem('theme', 'dark'); } catch {} });
await p.route('**/*', (r) => (['GET', 'HEAD', 'OPTIONS'].includes(r.request().method()) ? r.continue() : r.fulfill({ status: 204, body: '' })));

let n = 0, T = 0; const list = [], cues = [], marks = {};
const snap = async (dur) => { const f = `${String(n++).padStart(4, '0')}.jpg`; await p.screenshot({ path: `${OUT}/${f}`, type: 'jpeg', quality: 92 }); list.push({ f, dur }); T += dur; };
const mark = (k) => { marks[k] = +T.toFixed(3); };
const cue = (type, pt = {}) => cues.push({ t: +T.toFixed(3), type, ...pt });
const center = async (loc) => { const r = await loc.boundingBox(); return { x: +(r.x + r.width / 2).toFixed(1), y: +(r.y + r.height / 2).toFixed(1) }; };
const scrollTo = async (to, dur) => { // rolagem suave com easing, um screenshot por quadro
  const from = await p.evaluate(() => window.scrollY); const N = Math.round(dur * 30);
  for (let i = 1; i <= N; i++) { const e = i / N; const k = e < .5 ? 2 * e * e : 1 - Math.pow(-2 * e + 2, 2) / 2;
    await p.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), from + (to - from) * k); await snap(1 / 30); } };
const type = async (txt) => { for (const ch of txt) { cues.push({ t: +T.toFixed(3), type: 'key' }); await p.keyboard.type(ch); await p.waitForTimeout(40); await snap(0.09); } };
const tap = async (loc) => { const pt = await center(loc); cue('move', pt); await snap(0.4); cue('click', pt); await loc.click(); await p.waitForTimeout(400); await snap(0.6); };

// ===== roteiro do fluxo (exemplo) =====
await p.goto(SITE + '/', { waitUntil: 'networkidle' }); await p.waitForTimeout(1200);
mark('inicio'); await snap(1.0);
// const campo = p.locator('input[placeholder="..."]'); await tap(campo); await type('texto fictício');
// await scrollTo(600, 0.8); await snap(0.5);
// const botao = p.getByRole('button', { name: /Gerar/ }); await tap(botao);

await b.close();
writeFileSync(`${OUT}/list.json`, JSON.stringify({ list, cues, marks, total: +T.toFixed(2) }, null, 1));
console.log('quadros', n, 'duração', T.toFixed(1), marks);
