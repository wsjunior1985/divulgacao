// cards.js — desenha o card do post no padrão premium.
//
// O card é uma página HTML/CSS renderizada no Chromium (Playwright) e salva em
// JPEG. Três decisões definem o resultado:
//
// 1. TELA REAL NO CELULAR. O aparelho em perspectiva 3D mostra uma captura do
//    app de verdade: a tela escolhida para o tema (assets/premium/<app>/) ou,
//    sem ela, as capturas automáticas (assets/capturas/).
//
// 2. CONTEÚDO POR TEMA. Cada post pode trazer um bloco `premium` (título,
//    destaque, subtítulo, três benefícios e tela). Sem ele, o card é montado a
//    partir do `card` e dos `recursos` que o app já tem — nenhum tema fica sem
//    card enquanto o conteúdo premium não é escrito.
//
// 3. IDENTIDADE POR APP. Cores, efeito de fundo, fonte do título e selos vêm do
//    bloco `visual` do app; o que faltar é derivado da cor da marca. Fontes são
//    arquivos locais (assets/fontes/), então o card sai igual no Mac e no runner.

import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { RAIZ } from "./base.js";
import { paraHex, clarear } from "./cor.js";
import { icone } from "./icones.js";

export const FORMATOS = {
  feed: { largura: 1080, altura: 1350 },
  vertical: { largura: 1080, altura: 1920 },
};

export const semMarcadores = (texto) => String(texto ?? "").replace(/\*/g, "");

// Fonte do título por app (campo `fonte` ou `visual.fonteTitulo`).
const DISPLAYS = {
  barlow: { familia: "Barlow Condensed", arquivo: "BarlowCondensed-Bold.ttf", peso: 700, tracking: -1 },
  inter: { familia: "Inter Display", arquivo: "InterDisplay-ExtraBold.ttf", peso: 800, tracking: -2 },
  sora: { familia: "Sora", arquivo: "Sora-ExtraBold.ttf", peso: 800, tracking: -2 },
  manrope: { familia: "Manrope", arquivo: "Manrope-ExtraBold.ttf", peso: 800, tracking: -2 },
  fraunces: { familia: "Fraunces", arquivo: "Fraunces-Bold.ttf", peso: 700, tracking: -1 },
  grotesk: { familia: "Space Grotesk", arquivo: "SpaceGrotesk-Bold.ttf", peso: 700, tracking: -1.5 },
  jakarta: { familia: "Plus Jakarta Sans", arquivo: "PlusJakartaSans-ExtraBold.ttf", peso: 800, tracking: -2 },
};

const url = (relativo) => pathToFileURL(resolve(RAIZ, relativo)).href;
const existe = (relativo) => existsSync(resolve(RAIZ, relativo));
const rgb = (hex) => {
  const h = paraHex(hex).slice(1);
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).join(",");
};

/** Identidade visual do app: o que o bloco `visual` declara, o resto derivado da marca. */
function tema(app) {
  const v = app.visual ?? {};
  const acento = paraHex(v.acento ?? app.marca.destaque);
  return {
    acento,
    acento2: paraHex(v.acento2 ?? clarear(acento, 0.35)),
    calor: paraHex(v.calor ?? acento),
    efeito: v.efeito ?? "luz",
    display: DISPLAYS[v.fonteTitulo ?? app.fonte] ?? DISPLAYS.inter,
    selos: (v.selos ?? app.selos ?? []).slice(0, 3),
    urlSufixo: v.urlSufixo ?? "",
  };
}

/** Capturas automáticas do app, em ordem estável (fallback quando o tema não escolhe tela). */
function capturas(app) {
  const dir = resolve(RAIZ, "assets/capturas");
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.startsWith(`${app.id}-`) && f.endsWith(".png"))
    .sort()
    .map((f) => `assets/capturas/${f}`);
}

function telaDoPost(app, post, variacao) {
  const escolhida = post.premium?.tela && `assets/premium/${app.id}/${post.premium.tela}.png`;
  if (escolhida && existe(escolhida)) return escolhida;
  const lista = capturas(app);
  return lista.length ? lista[((variacao % lista.length) + lista.length) % lista.length] : null;
}

function logo(app) {
  const premium = `assets/premium/${app.id}/logo.png`;
  return existe(premium) ? premium : `assets/logos/${app.id}.png`;
}

/**
 * Conteúdo do card. Com `premium`, usa o que foi escrito para o tema. Sem ele,
 * o trecho entre asteriscos do título vira a linha de destaque e os três
 * primeiros recursos do app viram os benefícios.
 */
function conteudo(app, post) {
  if (post.premium) return post.premium;
  const card = post.card ?? {};
  const bruto = String(card.titulo ?? app.tagline ?? app.nome);
  const marcado = bruto.match(/\*([^*]+)\*/);
  let titulo = semMarcadores(marcado ? bruto.replace(marcado[0], "") : bruto).trim();
  let destaque = marcado ? marcado[1].trim() : "";
  if (!marcado && card.destaque) [titulo, destaque] = [String(card.destaque), titulo];
  const recursos = (card.recursos?.length ? card.recursos : app.recursos) ?? [];
  return {
    titulo,
    destaque,
    sub: card.sub ?? app.tagline ?? "",
    beneficios: recursos.slice(0, 3).map((r) =>
      typeof r === "string" ? { icone: "check", titulo: r, texto: "" } : { icone: r.icone, titulo: r.titulo, texto: r.descricao ?? "" },
    ),
  };
}

export function montarHtml({ app, post, formato = "feed", variacao = 0 }) {
  const { largura: L, altura: A } = FORMATOS[formato] ?? FORMATOS.feed;
  const t = tema(app);
  const c = conteudo(app, post);
  const tela = telaDoPost(app, post, variacao);
  const dominio = app.url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const semente = [...`${app.id}${post.id}`].reduce((s, ch) => (s * 31 + ch.charCodeAt(0)) % 2147483647, 7) || 1;

  const beneficios = c.beneficios
    .map((b) => `<div class="beneficio"><div class="ic">${icone(b.icone)}</div><div><strong>${b.titulo}</strong>${b.texto ? `<span>${b.texto}</span>` : ""}</div></div>`)
    .join("");
  const selos = t.selos.map((s) => `<div class="selo"><div class="ic">${icone(s.icone)}</div>${s.titulo}</div>`).join('<i class="div"></i>');
  const fontes = [
    [t.display.familia, t.display.arquivo, t.display.peso],
    ["Inter", "Inter-Regular.ttf", 400],
    ["Inter", "Inter-Medium.ttf", 500],
    ["Inter", "Inter-SemiBold.ttf", 600],
    ["Inter", "InterDisplay-Bold.ttf", 700],
    ["Inter", "InterDisplay-ExtraBold.ttf", 800],
  ]
    .map(([familia, arquivo, peso]) => `@font-face{font-family:"${familia}";src:url("${url(`assets/fontes/${arquivo}`)}");font-weight:${peso};}`)
    .join("\n");

  return `<!doctype html><html><head><meta charset="utf-8"><style>
${fontes}
:root { --acento:${t.acento}; --acento2:${t.acento2}; --acento-rgb:${rgb(t.acento)}; --calor-rgb:${rgb(t.calor)}; }
* { margin:0; padding:0; box-sizing:border-box; }
html,body { width:${L}px; height:${A}px; background:#030201; overflow:hidden; }
body { font-family:Inter, sans-serif; color:#fff; position:relative; -webkit-font-smoothing:antialiased; }
#luz { position:absolute; inset:0; }
.grao { position:absolute; inset:0; opacity:.07; mix-blend-mode:overlay;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E"); }

.logo { position:absolute; left:40px; top:30px; width:330px; max-height:220px; object-fit:contain; object-position:left top;
  filter:drop-shadow(0 10px 30px rgba(var(--calor-rgb),.35)); }

.esq { position:absolute; left:58px; top:258px; width:530px; }
h1 { font-family:"${t.display.familia}"; font-weight:${t.display.peso}; font-size:104px; line-height:.93; letter-spacing:${t.display.tracking}px;
  text-shadow:0 4px 30px rgba(0,0,0,.6); }
h1 .l2 { display:block; font-size:82px; margin-top:6px; white-space:nowrap; letter-spacing:${t.display.tracking / 2}px;
  background:linear-gradient(90deg,var(--acento) 0%,var(--acento2) 100%); -webkit-background-clip:text; color:transparent;
  filter:drop-shadow(0 0 18px rgba(var(--acento-rgb),.35)); }
.risco { height:3px; width:430px; margin:22px 0 20px; background:linear-gradient(90deg,var(--acento),rgba(var(--acento-rgb),0));
  box-shadow:0 0 12px var(--acento); border-radius:3px; }
.sub { font:400 27px/1.34 Inter; color:#e9e6e2; max-width:470px; }
.sub b { color:var(--acento); font-weight:700; }

.beneficios { margin-top:26px; display:flex; flex-direction:column; gap:13px; width:452px; }
.beneficio { display:flex; align-items:center; gap:20px; padding:16px 22px; border-radius:18px;
  background:linear-gradient(135deg,rgba(var(--calor-rgb),.10),rgba(10,8,6,.80));
  border:1.5px solid rgba(var(--calor-rgb),.28);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.06), 0 12px 30px rgba(0,0,0,.45); }
.beneficio .ic { width:58px; height:58px; flex:none; color:var(--acento); filter:drop-shadow(0 0 8px rgba(var(--acento-rgb),.75)); }
.beneficio .ic svg, .selo .ic svg { width:100%; height:100%; }
.beneficio strong { display:block; font:700 26px/1.15 Inter; letter-spacing:-.3px; }
.beneficio span { display:block; margin-top:4px; font:400 20px/1.3 Inter; color:#b9b3ac; }

.url { position:absolute; left:58px; bottom:138px; display:flex; align-items:center; gap:14px; padding:15px 30px 15px 20px; border-radius:50px;
  background:linear-gradient(180deg,#ffd84a,#ffb319); color:#161005; font:800 28px/1 Inter; letter-spacing:-.3px;
  box-shadow:0 0 0 1px rgba(255,255,255,.3) inset, 0 10px 40px rgba(255,170,20,.45), 0 0 80px rgba(255,140,0,.25); }
.url svg { width:34px; height:34px; }
.url em { font-style:normal; font-weight:600; opacity:.7; margin-left:4px; }

.rodape { position:absolute; left:50%; transform:translateX(-50%); bottom:30px; height:80px; display:flex; align-items:center; gap:44px; font:600 28px/1 Inter; }
.selo { display:flex; align-items:center; gap:16px; white-space:nowrap; }
.selo .ic { width:1.86em; height:1.86em; color:var(--acento); filter:drop-shadow(0 0 8px rgba(var(--acento-rgb),.7)); }
.div { width:1.5px; height:2em; background:linear-gradient(180deg,transparent,rgba(255,255,255,.28),transparent); }

/* Celular em perspectiva */
.cena { position:absolute; left:590px; top:162px; width:430px; height:930px; perspective:2400px; }
.brilho-cel { position:absolute; left:500px; top:220px; width:620px; height:900px; border-radius:50%;
  background:radial-gradient(closest-side, rgba(var(--acento-rgb),.30), rgba(var(--acento-rgb),.08) 60%, transparent); filter:blur(20px); }
.sombra-cel { position:absolute; left:610px; top:1085px; width:420px; height:70px; border-radius:50%; background:rgba(0,0,0,.85); filter:blur(28px); }
.cel { position:absolute; inset:0; transform-style:preserve-3d; transform:rotateY(-17deg) rotateX(5deg) rotateZ(3.5deg); }
.aro { position:absolute; inset:0; border-radius:72px;
  background:linear-gradient(135deg,#6b6f68 0%,#2b2d2a 18%,#8d928a 34%,#1e201d 52%,#5c605a 70%,#1a1b19 86%,#7d8279 100%);
  box-shadow:
    1px 0 0 #3d403b, 2px 0 0 #363833, 3px 0 0 #30322e, 4px 1px 0 #2c2e2a, 5px 1px 0 #282a26, 6px 1px 0 #252723,
    7px 2px 0 #222420, 8px 2px 0 #1f211d, 9px 2px 0 #1d1f1b, 10px 3px 0 #1b1d19, 11px 3px 0 #1a1c18, 12px 3px 0 #191a17,
    13px 4px 0 #181916, 14px 4px 0 rgba(var(--acento-rgb),.55),
    18px 14px 60px rgba(0,0,0,.8), 0 0 70px rgba(var(--acento-rgb),.22); }
.aro::after { content:""; position:absolute; inset:0; border-radius:72px; box-shadow:inset 0 0 0 2px rgba(255,255,255,.18), inset 3px 3px 6px rgba(255,255,255,.15); }
.tela { position:absolute; inset:13px; border-radius:60px; overflow:hidden; background:#000; }
.tela img { position:absolute; left:0; top:40px; width:100%; }
.status { position:absolute; left:0; right:0; top:0; height:60px; display:flex; justify-content:space-between; align-items:center; padding:10px 40px 0 48px;
  font:600 18px/1 Inter; z-index:2; background:linear-gradient(#000 70%,transparent); }
.st-ic { display:flex; gap:6px; align-items:center; }
.ilha { position:absolute; top:24px; left:50%; transform:translateX(-50%); width:116px; height:34px; border-radius:22px; background:#000; z-index:3; box-shadow:inset 0 0 0 1px #111; }
.ilha::after { content:""; position:absolute; right:14px; top:10px; width:14px; height:14px; border-radius:50%; background:radial-gradient(circle at 35% 35%,#2a3a6a,#070a14 70%); }
.reflexo { position:absolute; inset:13px; border-radius:60px; z-index:4;
  background:linear-gradient(115deg, rgba(255,255,255,.16) 0%, rgba(255,255,255,.05) 22%, transparent 38%, transparent 70%, rgba(255,255,255,.05) 100%); }
.botao { position:absolute; right:-5px; top:250px; height:110px; width:6px; border-radius:3px; background:linear-gradient(90deg,#1c1d1b,#5d615a); }

/* Vertical (TikTok): mesma composição, mais ar, e rodapé acima da legenda sobreposta. */
body.vertical .logo { left:48px; top:70px; width:400px; max-height:270px; }
body.vertical .esq { top:420px; }
body.vertical h1 { font-size:116px; }
body.vertical h1 .l2 { font-size:90px; }
body.vertical .sub { font-size:30px; }
body.vertical .beneficios { gap:16px; width:470px; margin-top:34px; }
body.vertical .beneficio { padding:20px 24px; }
body.vertical .cena { top:450px; }
body.vertical .brilho-cel { top:510px; }
body.vertical .sombra-cel { top:1375px; }
body.vertical .url { bottom:470px; }
body.vertical .rodape { bottom:370px; }
</style></head><body class="${formato}">
<canvas id="luz" width="${L}" height="${A}"></canvas>
<div class="brilho-cel"></div>
<div class="sombra-cel"></div>
<div class="cena"><div class="cel">
  <div class="aro"></div><div class="botao"></div>
  <div class="tela">
    <div class="status"><span>9:41</span><span class="st-ic"><svg width="19" height="12" viewBox="0 0 19 12" fill="#fff"><rect x="0" y="8" width="3.2" height="4" rx=".8"/><rect x="5" y="5.5" width="3.2" height="6.5" rx=".8"/><rect x="10" y="3" width="3.2" height="9" rx=".8"/><rect x="15" y="0" width="3.2" height="12" rx=".8"/></svg><svg width="17" height="12" viewBox="0 0 17 12" fill="#fff"><path d="M8.5 2.3c2.4 0 4.6.9 6.2 2.5l1.2-1.2A10.4 10.4 0 0 0 8.5.6 10.4 10.4 0 0 0 1.1 3.6l1.2 1.2a8.7 8.7 0 0 1 6.2-2.5z"/><path d="M8.5 5.7c1.5 0 2.8.6 3.8 1.5l1.2-1.2a7 7 0 0 0-10 0l1.2 1.2c1-.9 2.3-1.5 3.8-1.5z"/><path d="M8.5 9c.6 0 1.1.2 1.5.6L8.5 11.2 7 9.6c.4-.4.9-.6 1.5-.6z"/></svg><svg width="27" height="13" viewBox="0 0 27 13"><rect x=".5" y=".5" width="23" height="12" rx="3.5" fill="none" stroke="#fff" stroke-opacity=".4"/><rect x="2" y="2" width="20" height="9" rx="2" fill="#fff"/><path d="M25 4.5v4c.8-.3 1.3-1.1 1.3-2s-.5-1.7-1.3-2z" fill="#fff" fill-opacity=".45"/></svg></span></div>
    ${tela ? `<img src="${url(tela)}">` : ""}
  </div>
  <div class="ilha"></div><div class="reflexo"></div>
</div></div>

<img class="logo" src="${url(logo(app))}">
<div class="esq">
  <h1${c.tamanho ? ` style="font-size:${c.tamanho}px"` : ""}>${c.titulo}${c.destaque ? `<span class="l2">${c.destaque}</span>` : ""}</h1>
  <div class="risco"></div>
  <p class="sub">${c.sub}</p>
  <div class="beneficios">${beneficios}</div>
</div>
<div class="url">
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9.5"/><path d="M2.5 12h19M12 2.5c2.6 2.8 3.9 6 3.9 9.5s-1.3 6.7-3.9 9.5c-2.6-2.8-3.9-6-3.9-9.5s1.3-6.7 3.9-9.5z"/></svg>
  ${dominio}${t.urlSufixo ? ` <em>· ${t.urlSufixo}</em>` : ""}
</div>
<div class="rodape">${selos}</div>
<div class="grao"></div>

<script>
// Luz de fundo: calor atrás da logo, feixes cruzando o canto inferior direito, faíscas e vinheta.
const W = ${L}, H = ${A}, FOGO = ${t.efeito === "fogo"};
const CALOR = [${rgb(t.calor)}], ACENTO = [${rgb(t.acento)}];
const c = document.getElementById("luz"), g = c.getContext("2d");
let s = ${semente};
const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
const cor = (k, a) => "rgba(" + k.join(",") + "," + a + ")";
g.fillStyle = "#030201"; g.fillRect(0, 0, W, H);
function radial(x, y, rad, k, a) {
  const gr = g.createRadialGradient(x, y, 0, x, y, rad);
  gr.addColorStop(0, cor(k, a)); gr.addColorStop(1, cor(k, 0));
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
}
g.globalCompositeOperation = "lighter";
radial(300, 120, 480, CALOR, .13);
radial(W, H - 50, 680, CALOR, .19);
radial(820, H * .52, 480, ACENTO, .07);
radial(0, H, 420, CALOR, .05);

function feixes(qtd, blur, alpha, larg) {
  g.filter = blur ? "blur(" + blur + "px)" : "none";
  for (let i = 0; i < qtd; i++) {
    const y0 = H + r() * 260, x0 = 180 + r() * 700;
    const x3 = W + 40 + r() * 120, y3 = H * .31 + r() * H * .39;
    const base = r() < .78 ? CALOR : ACENTO;
    const k = FOGO && base === CALOR ? [255, 110 + r() * 90 | 0, 20] : base;
    const gr = g.createLinearGradient(x0, y0, x3, y3);
    gr.addColorStop(0, cor(k, 0)); gr.addColorStop(.55, cor(k, alpha * (0.4 + r() * .8))); gr.addColorStop(1, cor(k, 0));
    g.strokeStyle = gr; g.lineWidth = larg * (0.4 + r());
    g.beginPath(); g.moveTo(x0, y0);
    g.bezierCurveTo(x0 + 260 + r() * 200, y0 - 180 - r() * 120, x3 - 300 - r() * 200, y3 + 200 + r() * 150, x3, y3);
    g.stroke();
  }
}
feixes(22, 18, .34, 10);
feixes(80, 2, .36, 1.6);
feixes(55, 0, .5, .8);

g.filter = "blur(26px)";
for (let i = 0; i < 16; i++) {
  const k = FOGO ? [255, 60 + r() * 80 | 0, 0] : CALOR;
  g.fillStyle = cor(k, .03 + r() * .045);
  g.beginPath(); g.ellipse(40 + r() * 520, 60 + r() * 220, 60 + r() * 140, 16 + r() * 30, -0.35, 0, 7); g.fill();
}

g.filter = "none";
for (let i = 0; i < 110; i++) {
  const k = FOGO ? [255, 150 + r() * 90 | 0, 60] : ACENTO.map((v) => Math.min(255, v + 60));
  g.fillStyle = cor(k, r() * .9);
  g.shadowColor = cor(FOGO ? [255, 120, 0] : ACENTO, .9); g.shadowBlur = 8;
  g.beginPath(); g.arc(520 + r() * 560, H * .44 + r() * H * .56, .6 + r() * 1.8, 0, 7); g.fill();
}
g.shadowBlur = 0;

g.globalCompositeOperation = "source-over";
const v = g.createRadialGradient(W / 2, H * .47, 360, W / 2, H * .47, Math.max(W, H) * .73);
v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,.86)");
g.fillStyle = v; g.fillRect(0, 0, W, H);

// Encaixe: o título diminui até caber na coluna e não encostar na pílula do site.
document.fonts.ready.then(() => {
  const esq = document.querySelector(".esq"), h1 = document.querySelector("h1"), l2 = h1.querySelector(".l2");
  const pilula = document.querySelector(".url").getBoundingClientRect().top - 24;
  h1.style.display = "inline-block";
  let t1 = parseFloat(getComputedStyle(h1).fontSize), t2 = l2 ? parseFloat(getComputedStyle(l2).fontSize) : 0;
  for (let i = 0; i < 40 && (h1.offsetWidth > esq.clientWidth || esq.getBoundingClientRect().bottom > pilula); i++) {
    t1 -= 3; h1.style.fontSize = t1 + "px";
    if (l2) { t2 = Math.min(t2, t1 * .8); l2.style.fontSize = t2 + "px"; }
  }
  for (let i = 0; l2 && i < 30 && l2.offsetWidth > esq.clientWidth; i++) { t2 -= 2; l2.style.fontSize = t2 + "px"; }
  // Selos: encolhem juntos até caber na largura do card.
  const rodape = document.querySelector(".rodape");
  let tr = 28, gap = 44;
  for (let i = 0; i < 20 && rodape.offsetWidth > W - 60; i++) { tr -= 1; gap -= 3; rodape.style.fontSize = tr + "px"; rodape.style.gap = gap + "px"; }
  window.__pronto = true;
});
</script>
</body></html>`;
}

/**
 * Gera o card do post e salva em assets/cards/<nome>.jpg.
 *
 * @param {string} formato - "feed" (1080×1350) ou "vertical" (1080×1920)
 * @param {number} variacao - qual captura automática usar quando o tema não escolhe tela
 * @returns {Promise<{relativo, caminho, bytes}>}
 */
export async function gerarCard({ app, post, formato = "feed", nome, titulo, sub, variacao = 0 }) {
  const { chromium } = await import("playwright");
  const { default: sharp } = await import("sharp");
  const postFinal = post ?? { id: nome, card: { titulo, sub } };
  const { largura, altura } = FORMATOS[formato] ?? FORMATOS.feed;

  const temporario = resolve(RAIZ, "assets/tmp");
  mkdirSync(temporario, { recursive: true });
  const pagina = resolve(temporario, `${nome}.html`);
  writeFileSync(pagina, montarHtml({ app, post: postFinal, formato, variacao }));

  // Renderiza em 2x e reduz: o antialias do texto e dos traços sai mais limpo que em 1x.
  const navegador = await chromium.launch();
  try {
    const aba = await navegador.newPage({ viewport: { width: largura, height: altura }, deviceScaleFactor: 2 });
    await aba.goto(pathToFileURL(pagina).href, { waitUntil: "load" });
    await aba.waitForFunction(() => window.__pronto === true, null, { timeout: 15000 });
    const png = await aba.screenshot({ type: "png" });
    const buffer = await sharp(png).resize(largura, altura).jpeg({ quality: 92, chromaSubsampling: "4:4:4" }).toBuffer();

    const relativo = `assets/cards/${nome}.jpg`;
    mkdirSync(resolve(RAIZ, "assets/cards"), { recursive: true });
    writeFileSync(resolve(RAIZ, relativo), buffer);
    return { relativo, caminho: resolve(RAIZ, relativo), bytes: buffer.length };
  } finally {
    await navegador.close();
    rmSync(pagina, { force: true });
  }
}
