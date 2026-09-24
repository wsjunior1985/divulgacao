// vitrine.js — layout padrão do card premium (aprovado no GASONOL): logo, título em
// duas cores, três benefícios, celular 3D à direita, site em destaque e selos.
import { icone } from "../icones.js";
import { CSS_BASE, CSS_CELULAR, celular, conteudo, dominio, fontesCss, logo, rgb, scriptLuz, semente, tela, tema, url } from "./comum.js";

export function vitrine({ app, post, formato, L, A, variacao }) {
  const t = tema(app);
  const c = conteudo(app, post);
  const telaDoPost = tela(app, post.premium?.tela, variacao);

  const beneficios = c.beneficios
    .map((b) => `<div class="beneficio"><div class="ic">${icone(b.icone)}</div><div><strong>${b.titulo}</strong>${b.texto ? `<span>${b.texto}</span>` : ""}</div></div>`)
    .join("");
  const selos = t.selos.map((s) => `<div class="selo"><div class="ic">${icone(s.icone)}</div>${s.titulo}</div>`).join('<i class="div"></i>');
  const fontes = fontesCss(t.display);

  return `<!doctype html><html><head><meta charset="utf-8"><style>
${fontes}
:root { --acento:${t.acento}; --acento2:${t.acento2}; --acento-rgb:${rgb(t.acento)}; --calor-rgb:${rgb(t.calor)}; }
${CSS_BASE}
html,body { width:${L}px; height:${A}px; background:#030201; }

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
.cena { left:590px; top:162px; width:430px; height:930px; }
.brilho-cel { position:absolute; left:500px; top:220px; width:620px; height:900px; border-radius:50%;
  background:radial-gradient(closest-side, rgba(var(--acento-rgb),.30), rgba(var(--acento-rgb),.08) 60%, transparent); filter:blur(20px); }
.sombra-cel { position:absolute; left:610px; top:1085px; width:420px; height:70px; border-radius:50%; background:rgba(0,0,0,.85); filter:blur(28px); }
${CSS_CELULAR}
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
${celular(telaDoPost)}

<img class="logo" src="${url(logo(app))}">
<div class="esq">
  <h1${c.tamanho ? ` style="font-size:${c.tamanho}px"` : ""}>${c.titulo}${c.destaque ? `<span class="l2">${c.destaque}</span>` : ""}</h1>
  <div class="risco"></div>
  <p class="sub">${c.sub}</p>
  <div class="beneficios">${beneficios}</div>
</div>
<div class="url">
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9.5"/><path d="M2.5 12h19M12 2.5c2.6 2.8 3.9 6 3.9 9.5s-1.3 6.7-3.9 9.5c-2.6-2.8-3.9-6-3.9-9.5s1.3-6.7 3.9-9.5z"/></svg>
  ${dominio(app)}${t.urlSufixo ? ` <em>· ${t.urlSufixo}</em>` : ""}
</div>
<div class="rodape">${selos}</div>
<div class="grao"></div>

<script>
${scriptLuz({ L, A, t, semente: semente(app, post) })}
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
