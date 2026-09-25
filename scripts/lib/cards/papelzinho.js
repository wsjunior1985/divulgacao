// papelzinho.js — layout do Papelzinho, a partir da referência aprovada: degradê
// rosa→laranja, selo "Grátis" e pílula "PWA" no topo, presente + nome ao centro,
// título serifado centralizado com a segunda linha em dourado, subtítulo, celulares
// claros em leque com telas reais e a pílula do site no pé. Sem traços decorativos.
import { icone } from "../icones.js";
import { CSS_BASE, CSS_CELULAR, celular, conteudo, dominio, fontesCss, DISPLAYS, existe, logo, tela, url } from "./comum.js";

export function papelzinho({ app, post, formato, L, A, variacao }) {
  const c = conteudo(app, post, 0);
  const fraunces = DISPLAYS.fraunces;
  const fundo = `assets/premium/${app.id}/fundo.jpg`;
  const nomes = c.telas ?? [c.tela ?? "tela-eventos"];
  const telas = nomes.map((n, i) => tela(app, n, variacao + i));
  const [centro, esquerda, direita] = telas;

  return `<!doctype html><html><head><meta charset="utf-8"><style>
${fontesCss(fraunces)}
:root { --acento-rgb:255,140,90; }
${CSS_BASE}
html,body { width:${L}px; height:${A}px; background:#ec3f78; }
.ceu { position:absolute; inset:0; background:#ec3f78 ${existe(fundo) ? `url("${url(fundo)}") center bottom / cover no-repeat` : ""}; }
.sombra { position:absolute; inset:0; background:
  linear-gradient(180deg, rgba(232,36,110,.92) 0%, rgba(236,58,110,.78) 30%, rgba(240,90,90,.35) 52%, transparent 70%),
  radial-gradient(900px 600px at 100% 100%, rgba(247,146,60,.35), transparent 70%); }

.selo { position:absolute; left:52px; top:70px; width:168px; height:168px; transform:rotate(-12deg); }
.selo svg { position:absolute; inset:0; filter:drop-shadow(0 12px 24px rgba(160,30,60,.35)); }
.selo b { position:absolute; inset:0; display:grid; place-items:center; font:700 44px/1 "${fraunces.familia}"; color:#e03c64; padding-top:18px; }
.selo i { position:absolute; left:50%; top:36px; transform:translateX(-50%); color:#e03c64; font-style:normal; font-size:26px; }
.pwa { position:absolute; right:40px; top:96px; display:flex; align-items:center; gap:8px; padding:12px 24px; border-radius:50px;
  background:rgba(255,255,255,.18); border:2px solid rgba(255,255,255,.35); font:800 28px/1 Inter; color:#fff; backdrop-filter:blur(6px); }
.pwa svg { width:34px; height:34px; color:#ffc93c; }

.marca { position:absolute; left:0; right:0; top:62px; display:flex; align-items:center; justify-content:center; gap:26px; }
.marca img { width:120px; filter:drop-shadow(0 16px 26px rgba(120,20,60,.35)); }
.marca b { font:700 72px/1 "${fraunces.familia}"; color:#fff; letter-spacing:-1px; text-shadow:0 6px 22px rgba(120,20,60,.3); }

.titulo { position:absolute; left:40px; right:40px; top:250px; text-align:center; }
h1 { font-family:"${fraunces.familia}"; font-weight:700; line-height:.98; letter-spacing:-2px; color:#fff; text-shadow:0 8px 30px rgba(120,20,60,.3); }
h1 .l1 { display:block; font-size:122px; white-space:nowrap; }
h1 .l2 { display:block; font-size:118px; white-space:nowrap;
  background:linear-gradient(180deg,#fff7d6 0%,#ffe29a 45%,#ffc75c 100%); -webkit-background-clip:text; color:transparent;
  filter:drop-shadow(0 8px 22px rgba(160,40,40,.35)); }
.sub { margin:26px auto 0; max-width:820px; font:400 34px/1.32 Inter; color:#fff; }
.sub b { color:#ffd76a; font-weight:600; }

.cena { width:430px; height:930px; transform-origin:0 0; }
.cena .aro { background:linear-gradient(135deg,#ffffff 0%,#e9e4ea 25%,#ffffff 45%,#dcd6de 70%,#f7f4f8 100%) !important;
  box-shadow:0 30px 60px rgba(120,20,50,.35), 0 0 0 1px rgba(255,255,255,.6) !important; }
.cena .aro::after { box-shadow:inset 0 0 0 2px rgba(0,0,0,.05) !important; }
.cena .tela { background:#fdf6f7; }
.cena .status { color:#1b1216; background:linear-gradient(#fdf6f7 70%,transparent); }
.cena .status svg { filter:invert(1); }
.cena .ilha { background:#111; }
.cena.centro { left:318px; top:660px; transform:scale(1); --giro:none; z-index:3; }
.cena.esq { left:24px; top:810px; transform:scale(.8); --giro:rotateY(22deg) rotateZ(-6deg); z-index:2; }
.cena.dir { left:716px; top:790px; transform:scale(.8); --giro:rotateY(-22deg) rotateZ(6deg); z-index:2; }
${CSS_CELULAR}

.pe { position:absolute; left:92px; right:92px; bottom:40px; height:118px; border-radius:70px; z-index:5; display:flex; align-items:center; justify-content:center; gap:22px;
  background:linear-gradient(90deg,#e8246e,#f06a52 60%,#f7923c); border:3px solid rgba(255,255,255,.75); color:#fff;
  box-shadow:0 18px 40px rgba(120,20,50,.35); }
.pe .ic { width:54px; height:54px; }
.pe .ic svg { width:100%; height:100%; }
.pe small { display:block; font:500 24px/1 Inter; opacity:.9; }
.pe b { display:block; margin-top:6px; font:800 38px/1 Inter; letter-spacing:-.8px; }

body.vertical .selo { top:120px; }
body.vertical .pwa { top:150px; }
body.vertical .marca { top:120px; }
body.vertical .titulo { top:330px; }
body.vertical .cena.centro { left:350px; top:740px; transform:scale(.8); }
body.vertical .cena.esq { top:990px; }
body.vertical .cena.dir { top:970px; }
body.vertical .pe { bottom:300px; }
</style></head><body class="${formato}">
<div class="ceu"></div>
<div class="sombra"></div>
${esquerda ? celular(esquerda, "esq") : ""}
${direita ? celular(direita, "dir") : ""}
${celular(centro, "centro")}

<div class="selo"><svg viewBox="0 0 100 100"><path fill="#ffd45c" d="${Array.from({ length: 40 }, (_, i) => { const a = (i / 40) * Math.PI * 2, r = i % 2 ? 46 : 50; return `${i ? "L" : "M"}${(50 + r * Math.cos(a)).toFixed(2)} ${(50 + r * Math.sin(a)).toFixed(2)}`; }).join(" ")}Z"/></svg><i>✦</i><b>Grátis</b></div>
<div class="pwa"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>PWA</div>
<div class="marca" style="${formato === "vertical" ? "" : "top:44px"}"></div>

<div class="titulo">
  <h1${c.tamanho ? ` style="font-size:${c.tamanho}px"` : ""}><span class="l1">${c.titulo}</span>${c.destaque ? `<span class="l2">${c.destaque}</span>` : ""}</h1>
  ${c.sub ? `<p class="sub">${c.sub}</p>` : ""}
</div>

<div class="pe"><div class="ic">${icone("globo")}</div><div><small>Acesse grátis</small><b>${dominio(app)}</b></div></div>
<div class="grao"></div>

<script>
// Logo e nome no centro do topo, entre o selo e a pílula; título cabe na largura.
document.querySelector(".marca").innerHTML = '<img src="${url(logo(app))}"><b>Papelzinho</b>';
document.fonts.ready.then(() => {
  const t = document.querySelector(".titulo"), larg = t.clientWidth;
  for (const el of document.querySelectorAll("h1 .l1, h1 .l2")) {
    let f = parseFloat(getComputedStyle(el).fontSize);
    for (let i = 0; i < 40 && el.scrollWidth > larg && f > 60; i++) { f -= 3; el.style.fontSize = f + "px"; }
  }
  window.__pronto = true;
});
</script>
</body></html>`;
}
