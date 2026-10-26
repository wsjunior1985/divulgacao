// Captura as telas reais do app (PNG 390x844 @3x) para assets/premium/<id>/tela-*.png.
// Regras: modo escuro do app quando existir, contexto novo por captura, escritas bloqueadas (204), dados 100% fictícios
// (Maria Exemplo, SAO PAULO, exemplo@exemplo.com, R$ 35,00…), nunca criar conta em produção, nunca imprimir segredos.
// uso: SITE=https://<app>.waldeapps.systems ID=<id> node captura-telas.mjs
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const SITE = process.env.SITE, ID = process.env.ID;
if (!SITE || !ID) throw new Error('defina SITE e ID');
const OUT = `/Users/wsjunior/Projetos/divulgacao/assets/premium/${ID}`; mkdirSync(OUT, { recursive: true });
const b = await chromium.launch();
async function novaPagina() { // contexto novo por captura (sem localStorage sobrando)
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, colorScheme: 'dark' });
  const p = await ctx.newPage();
  await p.addInitScript(() => { try { localStorage.setItem('theme', 'dark'); /* ajuste a chave conforme o código do app */ } catch {} });
  await p.route('**/*', (r) => (['GET', 'HEAD', 'OPTIONS'].includes(r.request().method()) ? r.continue() : r.fulfill({ status: 204, body: '' })));
  return { ctx, p };
}
// Uma entrada por tela: nome do arquivo + função que leva o app ao estado desejado.
const TELAS = [
  ['tela-1', async (p) => { await p.goto(SITE + '/', { waitUntil: 'networkidle' }); await p.waitForTimeout(800); }],
  // ['tela-2', async (p) => { await p.goto(SITE + '/'); await p.fill('input[...]', 'dado fictício'); }],
];
for (const [nome, preparar] of TELAS) {
  const { ctx, p } = await novaPagina();
  await preparar(p);
  await p.screenshot({ path: `${OUT}/${nome}.png` });
  await ctx.close(); console.log('ok', nome);
}
await b.close();
