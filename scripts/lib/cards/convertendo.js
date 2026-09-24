// convertendo.js — layout do Convertendo, a partir da referência aprovada: foto de
// noite de viagem (assets/premium/convertendo/fundo-noite.jpg, gerada por IA no
// Canva: Estátua da Liberdade, Big Ben, cidade, avião e mala), marca com slogan,
// título em itálico condensado,
// quatro benefícios em esferas coloridas, celular à direita, faixa em onda
// verde→azul e rodapé com o site, o "app e navegador" e a sincronização.
import { icone } from "../icones.js";
import { CSS_BASE, CSS_CELULAR, celular, conteudo, dominio, fontesCss, DISPLAYS, existe, logo, rgb, tela, tema, url } from "./comum.js";

const CORES = [
  { fundo: "#3cc34a", texto: "#8ee35a" },
  { fundo: "#2f7df0", texto: "#5fb4ff" },
  { fundo: "#8a4cf0", texto: "#b692ff" },
  { fundo: "#f5b81c", texto: "#ffcf3f" },
];

export function convertendo({ app, post, formato, L, A, variacao }) {
  const t = tema(app);
  const c = conteudo(app, post, 4);
  const display = DISPLAYS.barlow;
  const fundo = `assets/premium/${app.id}/fundo-noite.jpg`;
  const principal = tela(app, (c.telas ?? [c.tela ?? "tela-converter"])[0], variacao);
  const faixa = t.faixa ?? [
    { icone: "globo", titulo: "Viaje", texto: "sem preocupações" },
    { icone: "carrinho", titulo: "Compre", texto: "com confiança" },
    { icone: "dinheiro", titulo: "Economize", texto: "sempre" },
  ];
  const beneficios = c.beneficios
    .map((b, i) => {
      const cor = CORES[i % CORES.length];
      return `<div class="beneficio"><div class="ic" style="--cor:${cor.fundo}">${icone(b.icone)}</div>
      <div><strong style="color:${cor.texto}">${b.titulo}</strong>${b.texto ? `<span>${b.texto}</span>` : ""}</div></div>`;
    })
    .join("");

  return `<!doctype html><html><head><meta charset="utf-8"><style>
${fontesCss(display)}
:root { --acento-rgb:${rgb("#2f7df0")}; }
${CSS_BASE}
html,body { width:${L}px; height:${A}px; background:#050d24; }
.ceu { position:absolute; inset:0; background:#050d24 ${existe(fundo) ? `url("${url(fundo)}") center top / cover no-repeat` : ""}; }
.sombra { position:absolute; inset:0; background:
  linear-gradient(90deg, rgba(4,10,30,.45) 0%, rgba(4,10,30,.55) 30%, rgba(4,10,30,.12) 58%, transparent 75%),
  linear-gradient(180deg, rgba(4,10,30,.35) 0%, transparent 18%); }
.beneficio span, .marca small { text-shadow:0 2px 10px rgba(0,0,0,.8); }
body.vertical .ceu { background-size:100% auto; background-position:center 150px; }
body.vertical .ceu::before { content:""; position:absolute; left:0; right:0; top:0; height:260px; background:linear-gradient(180deg,#050d24 55%,transparent); }
body.vertical .ceu::after { content:""; position:absolute; left:0; right:0; top:1250px; bottom:0; background:linear-gradient(180deg,transparent,#050d24 35%); }

.marca { position:absolute; left:44px; top:44px; display:flex; align-items:center; gap:30px; }
.marca img { width:190px; height:190px; filter:drop-shadow(0 14px 30px rgba(0,0,0,.6)); }
.marca b { display:block; font:800 92px/1 Inter; letter-spacing:-3px; }
.marca small { display:block; margin-top:14px; font:500 33px/1.25 Inter; color:#fff; }
.marca small i { font-style:normal; color:#ffd23f; }

.esq { position:absolute; left:48px; top:300px; width:610px; }
h1 { font-family:"${display.familia}"; font-weight:700; text-transform:uppercase; transform:skewX(-9deg); transform-origin:left; line-height:.92; }
h1 .l1 { display:block; font-size:72px; letter-spacing:.5px; white-space:nowrap; }
h1 .l2 { display:block; font-size:104px; white-space:nowrap; letter-spacing:-.5px;
  background:linear-gradient(180deg,#d8ff5a 0%,#8fe03a 55%,#4fbf2f 100%); -webkit-background-clip:text; color:transparent;
  filter:drop-shadow(0 0 16px rgba(143,224,58,.45)); }

.beneficios { margin-top:34px; display:flex; flex-direction:column; }
.beneficio { display:flex; align-items:center; gap:26px; padding:15px 0; border-top:1.5px solid rgba(140,180,255,.16); }
.beneficio .ic { flex:none; width:92px; height:92px; border-radius:50%; display:grid; place-items:center; color:#fff;
  background:radial-gradient(circle at 32% 26%, color-mix(in srgb, var(--cor) 45%, #fff), var(--cor) 50%, color-mix(in srgb, var(--cor) 60%, #000));
  box-shadow:0 12px 26px rgba(0,0,0,.5), inset 0 -6px 12px rgba(0,0,0,.25), inset 0 3px 0 rgba(255,255,255,.35); }
.beneficio .ic svg { width:46px; height:46px; stroke-width:2.4; }
.beneficio strong { display:block; font:700 30px/1.15 Inter; letter-spacing:-.3px; }
.beneficio span { display:block; margin-top:5px; font:400 23px/1.3 Inter; color:#e3ebff; max-width:400px; }
.beneficio > div:last-child { max-width:470px; }

.cena.principal { left:650px; top:236px; width:430px; height:930px; transform:scale(.84); transform-origin:0 0;
  --giro:rotateY(-20deg) rotateX(5deg) rotateZ(5deg); z-index:5; }
.cena.principal .aro { background:linear-gradient(135deg,#4a4f58 0%,#101217 20%,#3a3f47 38%,#0b0c10 56%,#2a2e35 74%,#08090c 100%); }
.brilho { position:absolute; left:600px; top:260px; width:560px; height:900px; border-radius:50%;
  background:radial-gradient(closest-side, rgba(47,125,240,.4), transparent); filter:blur(30px); }
${CSS_CELULAR}

.faixa { position:absolute; left:0; right:0; top:1030px; height:140px; z-index:4; }
.faixa svg.onda { position:absolute; inset:0; width:100%; height:100%; }
.faixa .itens { position:absolute; left:36px; top:38px; display:flex; gap:20px; align-items:center; }
.faixa .item { display:flex; align-items:center; gap:14px; color:#fff; }
.faixa .item .ic { width:50px; height:50px; }
.faixa .item .ic svg { width:100%; height:100%; }
.faixa .item b { display:block; font:700 28px/1 "${display.familia}"; text-transform:uppercase; letter-spacing:.5px; }
.faixa .item small { display:block; margin-top:4px; font:600 18px/1 "${display.familia}"; text-transform:uppercase; letter-spacing:.5px; }
.faixa .sep { width:1.5px; height:60px; background:rgba(255,255,255,.35); }

.pe { position:absolute; left:0; right:0; top:1170px; bottom:0; background:#050d24; display:flex; align-items:center; padding:0 36px; gap:26px; z-index:4;
  border-top:1px solid rgba(120,160,255,.15); }
.pe .col { display:flex; align-items:center; gap:16px; }
.pe .col + .col { padding-left:26px; border-left:1.5px solid rgba(255,255,255,.18); }
.pe .ic { width:52px; height:52px; color:#fff; flex:none; }
.pe .ic svg { width:100%; height:100%; }
.pe em { display:block; font:700 32px/1 "${display.familia}"; font-style:normal; transform:skewX(-9deg); color:#8fe03a; text-transform:uppercase; }
.pe b { display:block; margin-top:6px; font:600 32px/1 Inter; letter-spacing:-.4px; }
.pe small { display:block; font:400 19px/1.3 Inter; color:#dfe7ff; white-space:nowrap; }

body.vertical .marca { top:100px; }
body.vertical .esq { top:390px; }
body.vertical .beneficios { margin-top:44px; }
body.vertical .beneficio { padding:22px 0; }
body.vertical .cena.principal { top:420px; transform:scale(.92); }
body.vertical .brilho { top:440px; }
body.vertical .faixa { top:1300px; }
body.vertical .pe { top:1440px; bottom:280px; }
</style></head><body class="${formato}">
<div class="ceu"></div>
<div class="sombra"></div>
<div class="brilho"></div>
${celular(principal, "principal")}

<div class="marca"><img src="${url(logo(app))}"><div><b>${app.nome}</b><small>${t.slogan ?? app.tagline}</small></div></div>

<div class="esq">
  <h1${c.tamanho ? ` style="font-size:${c.tamanho}px"` : ""}><span class="l1">${c.titulo}</span>${c.destaque ? `<span class="l2">${c.destaque}</span>` : ""}</h1>
  <div class="beneficios">${beneficios}</div>
</div>

<div class="faixa">
  <svg class="onda" viewBox="0 0 1080 140" preserveAspectRatio="none"><defs><linearGradient id="og" x1="0" x2="1"><stop offset="0" stop-color="#3cbf3a"/><stop offset=".55" stop-color="#1f7fd8"/><stop offset="1" stop-color="#1d4fd0"/></linearGradient></defs>
  <path d="M0 40 C 300 0, 700 10, 1080 -10 L1080 140 L0 140 Z" fill="url(#og)"/></svg>
  <div class="itens">${faixa.map((f) => `<div class="item"><div class="ic">${icone(f.icone)}</div><div><b>${f.titulo}</b><small>${f.texto}</small></div></div>`).join('<i class="sep"></i>')}</div>
</div>

<div class="pe">
  <div class="col"><div class="ic">${icone("globo")}</div><div><em>Acesso grátis!</em><b>${dominio(app)}</b></div></div>
  <div class="col"><small>Disponível como app<br>e no navegador</small><div class="ic">${icone("celular")}</div></div>
  <div class="col"><div class="ic">${icone("nuvem")}</div><small>Sincronize suas listas<br>em todos os aparelhos.</small></div>
</div>
<div class="grao"></div>

<script>
// Encaixe: título e rodapé sem vazar.
document.fonts.ready.then(() => {
  const esq = document.querySelector(".esq"), l1 = document.querySelector("h1 .l1"), l2 = document.querySelector("h1 .l2");
  const limite = document.querySelector(".faixa").getBoundingClientRect().top - 10;
  const larg = esq.clientWidth - 10;
  for (const [el, min] of [[l1, 40], [l2, 56]]) {
    let tam = el ? parseFloat(getComputedStyle(el).fontSize) : 0;
    for (let i = 0; el && i < 40 && el.scrollWidth > larg && tam > min; i++) { tam -= 2; el.style.fontSize = tam + "px"; }
  }
  const bs = document.querySelectorAll(".beneficio");
  for (let i = 0, p = 15; i < 10 && esq.getBoundingClientRect().bottom > limite; i++) { p -= 2; bs.forEach((b) => (b.style.padding = Math.max(p, 4) + "px 0")); }
  window.__pronto = true;
});
</script>
</body></html>`;
}
