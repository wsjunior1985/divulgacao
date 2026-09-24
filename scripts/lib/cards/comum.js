// comum.js — peças compartilhadas pelos layouts dos cards premium: fontes locais,
// identidade do app, conteúdo do tema, celular 3D com tela real e luz de fundo.
// Cada layout (vitrine.js, aieat.js…) monta a composição com estas peças.

import { existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { RAIZ } from "../base.js";
import { paraHex, clarear } from "../cor.js";

export const semMarcadores = (texto) => String(texto ?? "").replace(/\*/g, "");

// Fonte do título por app (campo `fonte` ou `visual.fonteTitulo`).
export const DISPLAYS = {
  barlow: { familia: "Barlow Condensed", arquivo: "BarlowCondensed-Bold.ttf", peso: 700, tracking: -1 },
  inter: { familia: "Inter Display", arquivo: "InterDisplay-ExtraBold.ttf", peso: 800, tracking: -2 },
  sora: { familia: "Sora", arquivo: "Sora-ExtraBold.ttf", peso: 800, tracking: -2 },
  manrope: { familia: "Manrope", arquivo: "Manrope-ExtraBold.ttf", peso: 800, tracking: -2 },
  fraunces: { familia: "Fraunces", arquivo: "Fraunces-Bold.ttf", peso: 700, tracking: -1 },
  grotesk: { familia: "Space Grotesk", arquivo: "SpaceGrotesk-Bold.ttf", peso: 700, tracking: -1.5 },
  jakarta: { familia: "Plus Jakarta Sans", arquivo: "PlusJakartaSans-ExtraBold.ttf", peso: 800, tracking: -2 },
};

export const url = (relativo) => pathToFileURL(resolve(RAIZ, relativo)).href;
export const existe = (relativo) => existsSync(resolve(RAIZ, relativo));
export const rgb = (hex) => {
  const h = paraHex(hex).slice(1);
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).join(",");
};
export const dominio = (app) => app.url.replace(/^https?:\/\//, "").replace(/\/$/, "");
export const semente = (app, post) => [...`${app.id}${post.id}`].reduce((s, ch) => (s * 31 + ch.charCodeAt(0)) % 2147483647, 7) || 1;

/** Identidade visual do app: o que o bloco `visual` declara, o resto derivado da marca. */
export function tema(app) {
  const v = app.visual ?? {};
  const acento = paraHex(v.acento ?? app.marca.destaque);
  return {
    ...v,
    acento,
    acento2: paraHex(v.acento2 ?? clarear(acento, 0.35)),
    calor: paraHex(v.calor ?? acento),
    efeito: v.efeito ?? "luz",
    display: DISPLAYS[v.fonteTitulo ?? app.fonte] ?? DISPLAYS.inter,
    selos: (v.selos ?? app.selos ?? []).slice(0, 3),
    urlSufixo: v.urlSufixo ?? "",
  };
}

/** @font-face da fonte do título + Inter em todos os pesos usados. */
export function fontesCss(display) {
  return [
    [display.familia, display.arquivo, display.peso],
    ["Inter", "Inter-Regular.ttf", 400],
    ["Inter", "Inter-Medium.ttf", 500],
    ["Inter", "Inter-SemiBold.ttf", 600],
    ["Inter", "InterDisplay-Bold.ttf", 700],
    ["Inter", "InterDisplay-ExtraBold.ttf", 800],
  ]
    .map(([familia, arquivo, peso]) => `@font-face{font-family:"${familia}";src:url("${url(`assets/fontes/${arquivo}`)}");font-weight:${peso};}`)
    .join("\n");
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

/** Caminho da tela `nome` em assets/premium/<app>/, ou uma captura automática em rodízio. */
export function tela(app, nome, variacao = 0) {
  const escolhida = nome && `assets/premium/${app.id}/${nome}.png`;
  if (escolhida && existe(escolhida)) return escolhida;
  const lista = capturas(app);
  return lista.length ? lista[((variacao % lista.length) + lista.length) % lista.length] : null;
}

export function logo(app) {
  const premium = `assets/premium/${app.id}/logo.png`;
  return existe(premium) ? premium : `assets/logos/${app.id}.png`;
}

/**
 * Conteúdo do card. Com `premium`, usa o que foi escrito para o tema. Sem ele,
 * o trecho entre asteriscos do título vira a linha de destaque e os primeiros
 * recursos do app viram os benefícios.
 */
export function conteudo(app, post, maxBeneficios = 3) {
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
    beneficios: recursos.slice(0, maxBeneficios).map((r) =>
      typeof r === "string" ? { icone: "check", titulo: r, texto: "" } : { icone: r.icone, titulo: r.titulo, texto: r.descricao ?? "" },
    ),
  };
}

// ---------------------------------------------------------------------------
// Celular em perspectiva 3D. A posição, o tamanho e o giro vêm do layout:
// `.cena` recebe left/top/width/height e a variável --giro.
// ---------------------------------------------------------------------------

export const CSS_CELULAR = `
.cena { position:absolute; perspective:2400px; }
.cel { position:absolute; inset:0; transform-style:preserve-3d; transform:var(--giro, rotateY(-17deg) rotateX(5deg) rotateZ(3.5deg)); }
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
/* Aparelho preto (AI-Eat e afins): aro escuro e brilhante no lugar do titânio. */
.cena.preto .aro { background:linear-gradient(135deg,#3a3a40 0%,#0c0c0f 20%,#26262c 38%,#08080a 56%,#1d1d22 74%,#050506 100%); }
.cena.preto .botao { background:linear-gradient(90deg,#0c0c0f,#34343a); }
`;

const STATUS = `<div class="status"><span>9:41</span><span class="st-ic"><svg width="19" height="12" viewBox="0 0 19 12" fill="#fff"><rect x="0" y="8" width="3.2" height="4" rx=".8"/><rect x="5" y="5.5" width="3.2" height="6.5" rx=".8"/><rect x="10" y="3" width="3.2" height="9" rx=".8"/><rect x="15" y="0" width="3.2" height="12" rx=".8"/></svg><svg width="17" height="12" viewBox="0 0 17 12" fill="#fff"><path d="M8.5 2.3c2.4 0 4.6.9 6.2 2.5l1.2-1.2A10.4 10.4 0 0 0 8.5.6 10.4 10.4 0 0 0 1.1 3.6l1.2 1.2a8.7 8.7 0 0 1 6.2-2.5z"/><path d="M8.5 5.7c1.5 0 2.8.6 3.8 1.5l1.2-1.2a7 7 0 0 0-10 0l1.2 1.2c1-.9 2.3-1.5 3.8-1.5z"/><path d="M8.5 9c.6 0 1.1.2 1.5.6L8.5 11.2 7 9.6c.4-.4.9-.6 1.5-.6z"/></svg><svg width="27" height="13" viewBox="0 0 27 13"><rect x=".5" y=".5" width="23" height="12" rx="3.5" fill="none" stroke="#fff" stroke-opacity=".4"/><rect x="2" y="2" width="20" height="9" rx="2" fill="#fff"/><path d="M25 4.5v4c.8-.3 1.3-1.1 1.3-2s-.5-1.7-1.3-2z" fill="#fff" fill-opacity=".45"/></svg></span></div>`;

/** Celular com a tela `caminho` (relativo à raiz). `classe` posiciona via CSS do layout. */
export function celular(caminho, classe = "") {
  return `<div class="cena ${classe}"><div class="cel">
  <div class="aro"></div><div class="botao"></div>
  <div class="tela">${STATUS}${caminho ? `<img src="${url(caminho)}">` : ""}</div>
  <div class="ilha"></div><div class="reflexo"></div>
</div></div>`;
}

// ---------------------------------------------------------------------------
// Luz de fundo desenhada em canvas: calor atrás da logo, feixes cruzando o
// canto inferior direito, faíscas e vinheta. `fundo` é a cor base do card.
// ---------------------------------------------------------------------------

export function scriptLuz({ L, A, t, semente, fundo = "#030201", intensidade = 1 }) {
  return `
const W = ${L}, H = ${A}, FOGO = ${t.efeito === "fogo"}, K = ${intensidade};
const CALOR = [${rgb(t.calor)}], ACENTO = [${rgb(t.acento)}];
const c = document.getElementById("luz"), g = c.getContext("2d");
let s = ${semente};
const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
const cor = (k, a) => "rgba(" + k.join(",") + "," + a + ")";
g.fillStyle = "${fundo}"; g.fillRect(0, 0, W, H);
function radial(x, y, rad, k, a) {
  const gr = g.createRadialGradient(x, y, 0, x, y, rad);
  gr.addColorStop(0, cor(k, a * K)); gr.addColorStop(1, cor(k, 0));
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
    gr.addColorStop(0, cor(k, 0)); gr.addColorStop(.55, cor(k, alpha * K * (0.4 + r() * .8))); gr.addColorStop(1, cor(k, 0));
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
  g.fillStyle = cor(k, (.03 + r() * .045) * K);
  g.beginPath(); g.ellipse(40 + r() * 520, 60 + r() * 220, 60 + r() * 140, 16 + r() * 30, -0.35, 0, 7); g.fill();
}

g.filter = "none";
for (let i = 0; i < 110; i++) {
  const k = FOGO ? [255, 150 + r() * 90 | 0, 60] : ACENTO.map((v) => Math.min(255, v + 60));
  g.fillStyle = cor(k, r() * .9 * K);
  g.shadowColor = cor(FOGO ? [255, 120, 0] : ACENTO, .9); g.shadowBlur = 8;
  g.beginPath(); g.arc(520 + r() * 560, H * .44 + r() * H * .56, .6 + r() * 1.8, 0, 7); g.fill();
}
g.shadowBlur = 0;

g.globalCompositeOperation = "source-over";
const v = g.createRadialGradient(W / 2, H * .47, 360, W / 2, H * .47, Math.max(W, H) * .73);
v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,.86)");
g.fillStyle = v; g.fillRect(0, 0, W, H);
`;
}

export const CSS_BASE = `
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:Inter, sans-serif; color:#fff; position:relative; -webkit-font-smoothing:antialiased; overflow:hidden; }
#luz { position:absolute; inset:0; }
.grao { position:absolute; inset:0; opacity:.07; mix-blend-mode:overlay;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E"); }
`;
