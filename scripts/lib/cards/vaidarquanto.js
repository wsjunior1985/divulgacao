// vaidarquanto.js — layout do Vai dar quanto?, a partir da referência aprovada: fundo
// azul-noite com brilho roxo, marca "Vai dar / quanto?", título com a linha grande em
// gradiente azul→roxo, faixa lima "antes de chegar no caixa", benefícios em
// círculos, celular à direita com anotação manuscrita e selo "sem instalação", caixa do
// site com borda lima e fileira de aparelhos no pé.
import { icone } from "../icones.js";
import { CSS_BASE, CSS_CELULAR, celular, conteudo, dominio, fontesCss, DISPLAYS, existe, logo, tela, url } from "./comum.js";

const LIMA = "#b8e62e";
const ROXO = "#a855f7";

export function vaidarquanto({ app, post, formato, L, A, variacao }) {
  const c = conteudo(app, post, 4);
  const jakarta = DISPLAYS.jakarta;
  const fundo = `assets/premium/${app.id}/fundo.jpg`;
  const principal = tela(app, (c.telas ?? [c.tela ?? "tela-inicio"])[0], variacao);
  const beneficios = c.beneficios
    .map((b, i) => `<div class="beneficio"><div class="ic" style="color:${i % 2 ? ROXO : LIMA}">${icone(b.icone)}</div>
      <div><strong>${b.titulo}${b.novo ? '<em class="novo">NOVO</em>' : ""}</strong>${b.texto ? `<span>${b.texto}</span>` : ""}</div></div>`)
    .join("");
  const aparelhos = [
    ["celular", "Android • iPhone", "Funciona no seu celular"],
    ["monitor", "Computador", "Windows • macOS • Linux"],
    ["raio", "Sem instalação", "Abra no navegador e use"],
  ];

  return `<!doctype html><html><head><meta charset="utf-8"><style>
${fontesCss(jakarta)}
@font-face{font-family:"Barlow Condensed";src:url("${url("assets/fontes/BarlowCondensed-Bold.ttf")}");font-weight:700;}
@font-face{font-family:"Caveat";src:url("${url("assets/fontes/Caveat-Variable.ttf")}");font-weight:400 700;}
:root { --lima:${LIMA}; --roxo:${ROXO}; --acento-rgb:168,85,247; }
${CSS_BASE}
html,body { width:${L}px; height:${A}px; background:#0a0a1c; }
.ceu { position:absolute; inset:0; background:#0a0a1c ${existe(fundo) ? `url("${url(fundo)}") center / cover no-repeat` : ""}; }
.sombra { position:absolute; inset:0; background:
  linear-gradient(90deg, rgba(8,8,26,.78) 0%, rgba(8,8,26,.6) 42%, rgba(8,8,26,.1) 70%, transparent 85%),
  linear-gradient(180deg, rgba(8,8,26,.5) 0%, transparent 20%, transparent 72%, rgba(8,8,26,.85) 100%); }
body.vertical .ceu { background-size:auto 100%; }

.marca { position:absolute; left:40px; top:34px; display:flex; align-items:center; gap:20px; }
.marca img { width:176px; filter:drop-shadow(0 8px 24px rgba(0,0,0,.5)); }
.marca b { display:block; font:800 italic 60px/.95 "${jakarta.familia}"; letter-spacing:-2px; }
.marca b i { display:block; color:var(--lima); }

.esq { position:absolute; left:44px; top:212px; width:560px; }
h1 { font-family:"${jakarta.familia}"; font-weight:800; letter-spacing:-2.5px; line-height:1; }
h1 .l1 { display:block; font-size:74px; white-space:nowrap; }
h1 .l2 { display:inline-block; font-size:146px; white-space:nowrap; letter-spacing:-5px; padding-right:8px;
  background:linear-gradient(90deg,#5b7cfa 0%,#8b5cf6 45%,#c04cf0 100%); -webkit-background-clip:text; color:transparent; }
.faixa { display:inline-block; margin-top:8px; padding:8px 22px 6px; background:var(--lima); color:#0c0a1c; border-radius:6px; transform:rotate(-1.2deg);
  font:700 44px/1 "Barlow Condensed"; text-transform:uppercase; letter-spacing:.5px; box-shadow:0 10px 30px rgba(184,230,46,.25); }
.faixa span { display:inline-block; transform:skewX(-9deg); white-space:nowrap; }
.sub { margin-top:22px; font:500 25px/1.35 Inter; color:#e8e6f5; max-width:540px; }
.sub b { color:var(--lima); font-weight:700; }

.beneficios { margin-top:18px; display:flex; flex-direction:column; width:520px; }
.beneficio { display:flex; align-items:center; gap:22px; padding:13px 0; border-bottom:1.5px solid rgba(160,140,255,.16); }
.beneficio:last-child { border-bottom:0; }
.beneficio .ic { flex:none; width:76px; height:76px; border-radius:50%; display:grid; place-items:center;
  background:radial-gradient(circle at 35% 30%, #2a2458, #151232); box-shadow:inset 0 0 0 1.5px rgba(160,140,255,.25), 0 8px 20px rgba(0,0,0,.4); }
.beneficio .ic svg { width:40px; height:40px; stroke-width:2.2; }
.beneficio strong { display:flex; align-items:center; gap:12px; font:700 25px/1.2 Inter; }
.beneficio span { display:block; margin-top:4px; font:400 20px/1.3 Inter; color:#cfcbe6; }
.novo { font:800 15px/1 Inter; font-style:normal; letter-spacing:.5px; background:#7c3aed; color:#fff; padding:5px 10px; border-radius:20px; }

.cena.principal { left:600px; top:64px; width:430px; height:930px; transform:scale(.86); transform-origin:0 0;
  --giro:rotateY(-16deg) rotateX(4deg) rotateZ(5deg); z-index:3; }
.cena.principal .aro { background:linear-gradient(135deg,#3a3a42 0%,#0c0c10 20%,#2a2a32 38%,#08080a 56%,#1d1d24 74%,#050506 100%); }
.brilho { position:absolute; left:560px; top:80px; width:520px; height:900px; border-radius:50%;
  background:radial-gradient(closest-side, rgba(124,58,237,.35), transparent); filter:blur(30px); }
${CSS_CELULAR}

.nota { position:absolute; left:872px; top:560px; width:200px; z-index:5; font:700 40px/1.02 "Caveat"; color:#c9a5ff; transform:rotate(-6deg); text-align:center;
  text-shadow:0 2px 12px rgba(0,0,0,.6); }
.adesivo { position:absolute; left:690px; top:860px; width:370px; padding:18px 24px 18px 18px; z-index:6; display:flex; align-items:center; gap:16px;
  background:var(--lima); color:#0c0a1c; border-radius:22px; transform:rotate(-7deg); box-shadow:0 18px 40px rgba(0,0,0,.55), inset 0 0 0 3px rgba(255,255,255,.35); }
.adesivo .ic { flex:none; width:76px; height:76px; border-radius:50%; border:4px solid #fff; display:grid; place-items:center; color:#fff; background:rgba(0,0,0,.08); }
.adesivo .ic svg { width:40px; height:40px; stroke-width:2.6; }
.adesivo b { font:700 36px/1 "Barlow Condensed"; text-transform:uppercase; display:block; transform:skewX(-8deg); }

.site { position:absolute; left:40px; right:40px; top:1052px; height:118px; border-radius:26px; border:3px solid var(--lima); display:flex; align-items:center; padding:0 26px; gap:22px;
  background:rgba(12,10,30,.75); box-shadow:0 0 30px rgba(184,230,46,.18); z-index:4; }
.site .ic { flex:none; width:74px; height:74px; border-radius:18px; display:grid; place-items:center; background:linear-gradient(135deg,#8b5cf6,#6d28d9); color:#fff; }
.site .ic svg { width:44px; height:44px; }
.site small { display:block; font:500 26px/1 Inter; color:#e8e6f5; }
.site b { display:block; margin-top:6px; font:800 44px/1 "${jakarta.familia}"; color:var(--lima); letter-spacing:-1px; }
.site .div { width:2px; height:70px; background:rgba(255,255,255,.2); margin:0 6px; }
.site .extra { display:flex; align-items:center; gap:16px; font:500 22px/1.3 Inter; color:#e8e6f5; }
.site .extra svg { width:50px; height:50px; color:var(--roxo); flex:none; }
.site .extra i { font-style:normal; color:var(--lima); }

.aparelhos { position:absolute; left:40px; right:40px; top:1196px; display:flex; justify-content:space-between; z-index:4; }
.ap { display:flex; align-items:center; gap:14px; }
.ap .ic { width:48px; height:48px; color:var(--roxo); flex:none; }
.ap .ic svg { width:100%; height:100%; }
.ap b { display:block; font:700 21px/1.2 Inter; }
.ap small { display:block; font:400 17px/1.25 Inter; color:#bdb8d8; }
.ap + .ap { padding-left:20px; border-left:1.5px solid rgba(255,255,255,.15); }

body.vertical .marca { top:90px; }
body.vertical .esq { top:290px; }
body.vertical .beneficio { padding:20px 0; }
body.vertical .cena.principal { top:170px; transform:scale(.9); }
body.vertical .brilho { top:200px; }
body.vertical .nota { top:700px; }
body.vertical .adesivo { top:1010px; }
body.vertical .site { top:1330px; }
body.vertical .aparelhos { top:1480px; }
</style></head><body class="${formato}">
<div class="ceu"></div>
<div class="sombra"></div>
<div class="brilho"></div>
${celular(principal, "principal")}

<div class="marca"><img src="${url(logo(app))}"><b>Vai dar<i>quanto?</i></b></div>

<div class="esq">
  <h1><span class="l1">${c.titulo}</span>${c.destaque ? `<span class="l2">${c.destaque}</span>` : ""}</h1>
  <div class="faixa"><span>${c.faixa ?? "Antes de chegar no caixa!"}</span></div>
  <p class="sub">${c.sub}</p>
  <div class="beneficios">${beneficios}</div>
</div>

<div class="nota">Abre no navegador e usa na hora!</div>
<div class="adesivo"><div class="ic">${icone("offline")}</div><b>Sem instalação<br>obrigatória!</b></div>

<div class="site">
  <div class="ic">${icone("globo")}</div>
  <div><small>Acesse agora</small><b>${dominio(app)}</b></div>
  <i class="div"></i>
  <div class="extra"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7.5-4.6-9.5-9.2C1 8.3 3.3 4.5 7 4.5c2.1 0 3.6 1.1 5 2.8 1.4-1.7 2.9-2.8 5-2.8 3.7 0 6 3.8 4.5 7.3C19.5 16.4 12 21 12 21z"/></svg><span>Sem anúncios<br>e funciona <i>offline</i>!</span></div>
</div>
<div class="aparelhos">${aparelhos.map(([i, b, s]) => `<div class="ap"><div class="ic">${icone(i)}</div><div><b>${b}</b><small>${s}</small></div></div>`).join("")}</div>
<div class="grao"></div>

<script>
// Título e lista se ajustam para não vazar.
document.fonts.ready.then(() => {
  const esq = document.querySelector(".esq"), l1 = document.querySelector("h1 .l1"), l2 = document.querySelector("h1 .l2");
  const limite = document.querySelector(".site").getBoundingClientRect().top - 16;
  const larg = esq.clientWidth;
  for (const [el, min] of [[l1, 40], [l2, 70]]) {
    let t = el ? parseFloat(getComputedStyle(el).fontSize) : 0;
    for (let i = 0; el && i < 50 && el.scrollWidth > larg && t > min; i++) { t -= 3; el.style.fontSize = t + "px"; }
  }
  const faixa = document.querySelector(".faixa");
  for (let i = 0, f = 44; i < 20 && faixa.offsetWidth > larg; i++) { f -= 2; faixa.style.fontSize = f + "px"; }
  const bs = document.querySelectorAll(".beneficio");
  for (let i = 0, p = 13; i < 12 && esq.getBoundingClientRect().bottom > limite; i++) { p -= 2; bs.forEach((b) => (b.style.padding = Math.max(p, 3) + "px 0")); }
  window.__pronto = true;
});
</script>
</body></html>`;
}
