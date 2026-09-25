// remedin.js — layout do Remedin, a partir da referência aprovada: topo claro com a
// marca e o selo "PWA", painel verde-escuro com o título em duas cores e quatro
// benefícios, celular sobre uma faixa verde diagonal, caixa "funciona em qualquer
// dispositivo | PWA" e pílula dupla com o site e o slogan.
import { icone } from "../icones.js";
import { CSS_BASE, CSS_CELULAR, celular, conteudo, dominio, fontesCss, DISPLAYS, logo, tela, url } from "./comum.js";

const VERDE = "#6ccb4a";

export function remedin({ app, post, formato, L, A, variacao }) {
  const c = conteudo(app, post, 4);
  const manrope = DISPLAYS.manrope;
  const principal = tela(app, (c.telas ?? [c.tela ?? "tela-hoje"])[0], variacao);
  const beneficios = c.beneficios
    .map((b) => `<div class="beneficio"><div class="ic">${icone(b.icone)}</div><div><strong>${b.titulo}</strong>${b.texto ? `<span>${b.texto}</span>` : ""}</div></div>`)
    .join("");
  const aparelhos = [["celular", "Android"], ["celular", "iPhone"], ["tablet", "Tablets"], ["monitor", "Computadores"]];
  const pwa = [["offline", "Instale em<br>segundos"], ["nuvem", "Não ocupa<br>muito espaço"], ["troca", "Atualizações<br>automáticas"], ["escudo", "Mais seguro<br>e confiável"]];
  const item = ([i, t]) => `<div class="item"><div class="ic">${icone(i)}</div><span>${t}</span></div>`;

  return `<!doctype html><html><head><meta charset="utf-8"><style>
${fontesCss(manrope)}
:root { --verde:${VERDE}; --acento-rgb:108,203,74; }
${CSS_BASE}
html,body { width:${L}px; height:${A}px; background:#0d3b22; }
.topo { position:absolute; left:0; right:0; top:0; height:330px; background:#f3f5ef; }
.pontos { position:absolute; right:0; top:0; width:560px; height:300px; opacity:.5;
  background-image:radial-gradient(rgba(15,61,34,.22) 1.6px, transparent 1.8px); background-size:18px 18px;
  -webkit-mask-image:linear-gradient(90deg, transparent, #000 60%); }
.painel { position:absolute; inset:0; background:
  radial-gradient(700px 500px at 15% 45%, rgba(40,140,80,.35), transparent 70%),
  linear-gradient(180deg,#0f4a2a 0%,#0c3b21 60%,#0a321c 100%);
  clip-path:path("M0 262 C 180 214, 420 196, 620 236 L 1080 236 L 1080 1350 L 0 1350 Z"); }
.faixa { position:absolute; inset:0; background:linear-gradient(160deg,#3c9a5c 0%,#2f8550 40%,#1d6a3c 100%);
  clip-path:polygon(58% 17%, 100% 11%, 100% 100%, 50% 100%); opacity:.95; }
.faixa::after { content:""; position:absolute; inset:0; background:linear-gradient(90deg, rgba(10,50,28,.55), transparent 40%); }

.marca { position:absolute; left:40px; top:40px; display:flex; align-items:center; gap:26px; }
.marca img { width:130px; height:130px; filter:drop-shadow(0 10px 20px rgba(0,0,0,.25)); }
.marca b { display:block; font:800 80px/1 "${manrope.familia}"; color:#0f3d24; letter-spacing:-2px; }
.marca small { display:block; margin-top:8px; font:500 30px/1 Inter; color:#2d4a37; }
.pwa { position:absolute; z-index:6; right:36px; top:36px; width:232px; padding:18px 16px 16px; border-radius:22px; background:#0b1410; color:#fff; text-align:center;
  box-shadow:0 14px 34px rgba(0,0,0,.35); }
.pwa b { display:block; font:800 64px/1 "${manrope.familia}"; letter-spacing:-2px; }
.pwa small { display:block; margin-top:8px; font:800 17px/1.2 Inter; text-transform:uppercase; }

.esq { position:absolute; left:42px; top:292px; width:560px; }
h1 { font-family:"${manrope.familia}"; font-weight:800; font-size:74px; line-height:1.02; letter-spacing:-2.5px; }
h1 .l1 { display:block; color:#fff; }
h1 .l2 { display:block; color:var(--verde); }
.sub { margin-top:14px; font:400 22px/1.32 Inter; color:#e3efe6; max-width:520px; }
.beneficios { margin-top:12px; display:flex; flex-direction:column; }
.beneficio { display:flex; align-items:center; gap:20px; padding:8px 0; border-top:1.5px solid rgba(160,220,170,.14); }
.beneficio .ic { flex:none; width:68px; height:68px; border-radius:50%; display:grid; place-items:center; color:#fff;
  background:radial-gradient(circle at 35% 30%, #1f6a3e, #0e3d23); box-shadow:inset 0 0 0 2px rgba(120,200,130,.35), 0 8px 18px rgba(0,0,0,.35); }
.beneficio .ic svg { width:34px; height:34px; stroke-width:2.2; }
.beneficio strong { display:block; font:800 22px/1.15 Inter; color:var(--verde); text-transform:uppercase; letter-spacing:.2px; }
.beneficio span { display:block; margin-top:3px; font:400 20px/1.25 Inter; color:#fff; }

.cena.principal { left:590px; top:150px; width:430px; height:930px; transform:scale(.9); transform-origin:0 0;
  --giro:rotateY(-15deg) rotateX(4deg) rotateZ(4deg); z-index:3; }
.cena.principal .aro { background:linear-gradient(135deg,#4a4f50 0%,#101414 20%,#3a3f40 38%,#0b0c0c 56%,#2a2e2e 74%,#080909 100%); }
${CSS_CELULAR}

.caixa { position:absolute; left:34px; right:34px; top:1040px; height:156px; border-radius:24px; background:rgba(8,40,22,.92); z-index:4;
  box-shadow:0 14px 40px rgba(0,0,0,.35); display:flex; padding:18px 10px 14px; }
.grupo { flex:1; display:flex; flex-direction:column; align-items:center; }
.grupo + .grupo { border-left:1.5px solid rgba(255,255,255,.18); }
.grupo h4 { font:800 17px/1 Inter; color:var(--verde); text-transform:uppercase; letter-spacing:.3px; margin-bottom:14px; }
.itens { display:flex; gap:10px; justify-content:space-around; width:100%; }
.item { display:flex; flex-direction:column; align-items:center; gap:8px; text-align:center; font:700 14px/1.2 Inter; color:#fff; width:112px; }
.item .ic { width:44px; height:44px; color:#fff; }
.item .ic svg { width:100%; height:100%; stroke-width:1.8; }

.pilula { position:absolute; left:74px; right:52px; top:1214px; height:104px; z-index:4; display:flex; border-radius:60px; overflow:hidden;
  box-shadow:0 14px 34px rgba(0,0,0,.35); }
.pilula .site { flex:0 0 44%; display:flex; align-items:center; gap:18px; padding-left:34px; background:linear-gradient(90deg,#4fb040,#6ccb4a); color:#0b2a17; }
.pilula .site .ic { width:58px; height:58px; }
.pilula .site .ic svg { width:100%; height:100%; stroke-width:2; }
.pilula .site small { display:block; font:500 22px/1 Inter; }
.pilula .site b { display:block; margin-top:4px; font:800 32px/1 Inter; letter-spacing:-.5px; }
.pilula .frase { flex:1; display:flex; align-items:center; gap:18px; padding:0 30px; background:#f5f7f2; color:#0f3d24; }
.pilula .frase svg { width:56px; height:56px; flex:none; color:#4fb040; }
.pilula .frase small { display:block; font:500 21px/1.2 Inter; }
.pilula .frase b { display:block; margin-top:4px; font:800 25px/1.1 Inter; }

body.vertical .topo { height:420px; }
body.vertical .marca { top:110px; }
body.vertical .pwa { top:100px; }
body.vertical .painel { clip-path:path("M0 352 C 180 304, 420 286, 620 326 L 1080 326 L 1080 1920 L 0 1920 Z"); }
body.vertical .esq { top:400px; }
body.vertical h1 { font-size:76px; }
body.vertical .beneficio { padding:18px 0; }
body.vertical .cena.principal { top:250px; transform:scale(.95); }
body.vertical .caixa { top:1380px; }
body.vertical .pilula { top:1556px; }
</style></head><body class="${formato}">
<div class="painel"></div>
<div class="faixa"></div>
<div class="topo" style="clip-path:path('M0 0 H1080 V${formato === "vertical" ? 326 : 236} H620 C 420 ${formato === "vertical" ? 286 : 196}, 180 ${formato === "vertical" ? 304 : 214}, 0 ${formato === "vertical" ? 352 : 262} Z')"><div class="pontos"></div></div>
${celular(principal, "principal")}

<div class="marca"><img src="${url(logo(app))}"><div><b>REMEDIN</b><small>Porque cada dose conta.</small></div></div>
<div class="pwa"><b>PWA</b><small>Funciona como<br>um app de verdade!</small></div>

<div class="esq">
  <h1${c.tamanho ? ` style="font-size:${c.tamanho}px"` : ""}><span class="l1">${c.titulo}</span>${c.destaque ? `<span class="l2">${c.destaque}</span>` : ""}</h1>
  ${c.sub ? `<p class="sub">${c.sub}</p>` : ""}
  <div class="beneficios">${beneficios}</div>
</div>

<div class="caixa">
  <div class="grupo"><h4>Funciona em qualquer dispositivo</h4><div class="itens">${aparelhos.map(item).join("")}</div></div>
  <div class="grupo"><h4>PWA · Progressive Web App</h4><div class="itens">${pwa.map(item).join("")}</div></div>
</div>
<div class="pilula">
  <div class="site"><div class="ic">${icone("globo")}</div><div><small>Acesse agora:</small><b>${dominio(app)}</b></div></div>
  <div class="frase"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20.5s-7.8-4.7-9.4-9.6C1.4 7.2 3.7 4 7.2 4c2 0 3.6 1.1 4.8 2.8C13.2 5.1 14.8 4 16.8 4c3.5 0 5.8 3.2 4.6 6.9-.6 1.9-2.2 3.8-3.9 5.4"/><path d="M8 12h2.5l1.5-2.5 2 5 1.5-2.5H18"/></svg><div><small>Cuidar da saúde é um ato de amor.</small><b>Porque cada dose conta.</b></div></div>
</div>
<div class="grao"></div>

<script>
// Encaixe: título e lista cabem acima da caixa de dispositivos.
document.fonts.ready.then(() => {
  const esq = document.querySelector(".esq"), h1 = document.querySelector("h1");
  const limite = document.querySelector(".caixa").getBoundingClientRect().top - 14;
  let t = parseFloat(getComputedStyle(h1).fontSize);
  for (let i = 0; i < 30 && esq.getBoundingClientRect().bottom > limite && t > 44; i++) { t -= 2; h1.style.fontSize = t + "px"; }
  const bs = document.querySelectorAll(".beneficio");
  for (let i = 0, p = 8; i < 8 && esq.getBoundingClientRect().bottom > limite; i++) { p -= 2; bs.forEach((b) => (b.style.padding = Math.max(p, 3) + "px 0")); }
  window.__pronto = true;
});
</script>
</body></html>`;
}
