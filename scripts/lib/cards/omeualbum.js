// omeualbum.js — layout do O Meu Álbum, criado do zero (logo e cores novas, sem
// referência): foto de estádio à noite com álbum de figurinhas (IA no Canva), logo
// horizontal no topo, título esportivo em caixa alta com a linha de destaque verde,
// benefícios em cartões alinhados, faixa amarela com o preço, um celular com telas reais do app e a pílula verde do site.
import { icone } from "../icones.js";
import { CSS_BASE, CSS_CELULAR, celular, conteudo, dominio, fontesCss, DISPLAYS, existe, logo, tela, url } from "./comum.js";

const VERDE = "#41ca51";
const AMARELO = "#ffcf00";
const NAVY = "#050f23";

export function omeualbum({ app, post, formato, L, A, variacao }) {
  const c = conteudo(app, post, 3);
  const barlow = DISPLAYS.barlow;
  const fundo = `assets/premium/${app.id}/fundo.jpg`;
  const [frente] = (c.telas ?? ["tela-grupos", "tela-estatisticas"]).map((n, i) => tela(app, n, variacao + i));
  const selo = c.selo ?? ["R$ 15", "uma vez só", "7 dias grátis"];
  const cores = [VERDE, AMARELO, "#ffffff"];
  const beneficios = c.beneficios
    .map((b, i) => `<div class="fig" style="--giro:${[-2.5, 1.8, -1.2][i % 3]}deg; --cor:${cores[i % 3]}">
      <div class="ic">${icone(b.icone)}</div><div><strong>${b.titulo}</strong>${b.texto ? `<span>${b.texto}</span>` : ""}</div></div>`)
    .join("");

  return `<!doctype html><html><head><meta charset="utf-8"><style>
${fontesCss(barlow)}
:root { --verde:${VERDE}; --amarelo:${AMARELO}; --acento-rgb:65,202,81; }
${CSS_BASE}
html,body { width:${L}px; height:${A}px; background:${NAVY}; }
.ceu { position:absolute; inset:0; background:${NAVY} ${existe(fundo) ? `url("${url(fundo)}") center bottom / cover no-repeat` : ""}; }
.sombra { position:absolute; inset:0; background:
  linear-gradient(180deg, rgba(5,15,35,.9) 0%, rgba(5,15,35,.55) 30%, rgba(5,15,35,.12) 52%, transparent 75%, rgba(5,15,35,.55) 100%),
  linear-gradient(90deg, rgba(5,15,35,.6) 0%, rgba(5,15,35,.2) 45%, transparent 65%); }

.logo { position:absolute; left:52px; top:52px; width:440px; filter:drop-shadow(0 10px 24px rgba(0,0,0,.45)); }
.selo { display:flex; align-items:center; gap:16px; margin-top:52px; }
.selo .corpo { display:flex; align-items:baseline; gap:10px; padding:12px 22px; border-radius:16px; background:var(--amarelo); color:${NAVY}; box-shadow:0 10px 24px rgba(0,0,0,.35); }
.selo b { font:700 46px/1 "${barlow.familia}"; }
.selo span { font:700 26px/1 "${barlow.familia}"; text-transform:uppercase; }
.selo small { font:700 22px/1.2 Inter; color:#fff; }

.esq { position:absolute; left:52px; top:222px; width:540px; }
h1 { font-family:"${barlow.familia}"; font-weight:700; text-transform:uppercase; line-height:.9; letter-spacing:-.5px; font-style:italic; }
h1 .l1 { display:block; font-size:92px; color:#fff; white-space:nowrap; }
h1 .l2 { display:block; font-size:104px; color:var(--verde); white-space:nowrap; text-shadow:0 0 30px rgba(65,202,81,.35); }
.sub { margin-top:32px; font:500 26px/1.35 Inter; color:#e6ecf7; max-width:520px; }
.sub b { color:var(--amarelo); }

.figs { margin-top:48px; display:flex; flex-direction:column; gap:30px; width:520px; }
.fig { display:flex; align-items:center; gap:18px; padding:16px 20px; border-radius:18px; background:rgba(9,22,48,.82); border:1.5px solid rgba(255,255,255,.14);
  box-shadow:0 12px 26px rgba(0,0,0,.35); backdrop-filter:blur(6px); }
.fig .ic { flex:none; width:60px; height:60px; border-radius:14px; display:grid; place-items:center; background:var(--verde); color:${NAVY}; }
.fig .ic svg { width:36px; height:36px; stroke-width:2.4; }
.fig strong { display:block; font:700 30px/1 "${barlow.familia}"; text-transform:uppercase; letter-spacing:.3px; color:#fff; }
.fig span { display:block; margin-top:5px; font:400 20px/1.25 Inter; color:#c9d4ea; }

.cena { width:430px; height:930px; transform-origin:0 0; }
.cena.frente { left:622px; top:190px; transform:scale(.92); --giro:rotateY(-12deg) rotateX(3deg) rotateZ(2deg); z-index:4; }
.cena .aro { background:linear-gradient(135deg,#3b4454 0%,#0b0f18 20%,#2b3242 38%,#070a10 56%,#1f2533 74%,#05070b 100%) !important; }
${CSS_CELULAR}

.pe { position:absolute; left:46px; bottom:40px; right:46px; height:112px; display:flex; align-items:center; justify-content:center; gap:22px; padding:0 30px; border-radius:60px; z-index:5;
  background:var(--verde); color:${NAVY}; box-shadow:0 16px 36px rgba(0,0,0,.45), 0 0 40px rgba(65,202,81,.35); }
.pe .ic { width:58px; height:58px; flex:none; }
.pe .ic svg { width:100%; height:100%; stroke-width:2.2; }
.pe small { display:block; font:600 22px/1 Inter; }
.pe b { display:block; margin-top:5px; font:800 36px/1 Inter; letter-spacing:-.8px; }

body.vertical .logo { top:100px; }
body.vertical .esq { top:360px; }
body.vertical .figs { gap:26px; margin-top:36px; }
body.vertical .cena.frente { top:330px; }
body.vertical .pe { bottom:300px; }
</style></head><body class="${formato}">
<div class="ceu"></div>
<div class="sombra"></div>
${celular(frente, "frente")}

<img class="logo" src="${url(logo(app))}">

<div class="esq">
  <h1${c.tamanho ? ` style="font-size:${c.tamanho}px"` : ""}><span class="l1">${c.titulo}</span>${c.destaque ? `<span class="l2">${c.destaque}</span>` : ""}</h1>
  ${c.sub ? `<p class="sub">${c.sub}</p>` : ""}
  <div class="figs">${beneficios}</div>
  <div class="selo"><div class="corpo"><b>${selo[0]}</b><span>${selo[1]}</span></div><small>${selo[2]}</small></div>
</div>

<div class="pe"><div class="ic">${icone("globo")}</div><div><small>Teste grátis em</small><b>${dominio(app)}</b></div></div>
<div class="grao"></div>

<script>
document.fonts.ready.then(() => {
  const esq = document.querySelector(".esq"), limite = document.querySelector(".pe").getBoundingClientRect().top - 20;
  for (const el of document.querySelectorAll("h1 .l1, h1 .l2")) {
    let f = parseFloat(getComputedStyle(el).fontSize);
    for (let i = 0; i < 40 && el.scrollWidth > esq.clientWidth && f > 48; i++) { f -= 3; el.style.fontSize = f + "px"; }
  }
  const figs = document.querySelector(".figs");
  for (let i = 0, g = 30; i < 8 && esq.getBoundingClientRect().bottom > limite; i++) { g -= 3; figs.style.gap = Math.max(g, 6) + "px"; }
  window.__pronto = true;
});
</script>
</body></html>`;
}
