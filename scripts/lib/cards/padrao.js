// padrao.js — layout premium genérico, no padrão aprovado (O Palpiteiro / O Meu Álbum):
// foto de fundo do app (IA no Canva), marca + nome, título em duas cores, três
// benefícios alinhados, pílula de vidro com a oferta, um celular com a tela real e a
// pílula do site. Cores e textos vêm do bloco `visual` do app:
// { layout:"padrao", cor1, cor2, fundoCor, nomeMarca, selo:[forte, fraco], pe, tela, logoArredondado }
import { icone } from "../icones.js";
import { CSS_BASE, CSS_CELULAR, celular, conteudo, dominio, fontesCss, DISPLAYS, existe, logo, tela, url } from "./comum.js";

export function padrao({ app, post, formato, L, A, variacao }) {
  const v = app.visual ?? {};
  const VERDE = v.cor1 ?? "#a855f7", AMARELO = v.cor2 ?? "#fb923c", NAVY = v.fundoCor ?? "#0c0820";
  const rgb1 = VERDE.replace("#", "").match(/../g).map((h) => parseInt(h, 16)).join(",");
  const c = conteudo(app, post, 3);
  const barlow = DISPLAYS.barlow;
  const fundo = `assets/premium/${app.id}/fundo.jpg`;
  const [frente] = (c.telas ?? [v.tela ?? "tela-app"]).map((n, i) => tela(app, n, variacao + i));
  const selo = c.selo ?? v.selo ?? ["Grátis", "para começar"];
  const cores = [VERDE, AMARELO, "#ffffff"];
  const beneficios = c.beneficios
    .map((b, i) => `<div class="fig" style="--giro:${[-2.5, 1.8, -1.2][i % 3]}deg; --cor:${cores[i % 3]}">
      <div class="ic">${icone(b.icone)}</div><div><strong>${b.titulo}</strong>${b.texto ? `<span>${b.texto}</span>` : ""}</div></div>`)
    .join("");

  return `<!doctype html><html><head><meta charset="utf-8"><style>
${fontesCss(barlow)}
:root { --verde:${VERDE}; --amarelo:${AMARELO}; --acento-rgb:${rgb1}; }
${CSS_BASE}
html,body { width:${L}px; height:${A}px; background:${NAVY}; }
.ceu { position:absolute; inset:0; background:${NAVY} ${existe(fundo) ? `url("${url(fundo)}") 30% center / cover no-repeat` : ""}; }
.sombra { position:absolute; inset:0; background:
  linear-gradient(180deg, rgba(5,15,35,.9) 0%, rgba(5,15,35,.55) 30%, rgba(5,15,35,.12) 52%, transparent 75%, rgba(5,15,35,.55) 100%),
  linear-gradient(90deg, rgba(5,15,35,.6) 0%, rgba(5,15,35,.2) 45%, transparent 65%); }

.marca { position:absolute; left:52px; top:44px; display:flex; align-items:center; gap:20px; }
.marca img { width:120px; ${v.logoArredondado ? "border-radius:28px;" : ""} }
.marca b { font:800 italic 64px/1 "${barlow.familia}"; text-transform:uppercase; color:#fff; letter-spacing:-.5px; }
.selo { display:inline-flex; align-items:center; gap:14px; margin-top:52px; padding:12px 26px 12px 12px; border-radius:60px;
  background:rgba(20,12,44,.72); border:1.5px solid rgba(255,255,255,.14); box-shadow:0 12px 26px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.08); backdrop-filter:blur(8px); }
.selo .ic { flex:none; width:52px; height:52px; border-radius:50%; display:grid; place-items:center; color:#fff;
  background:linear-gradient(135deg,var(--verde),var(--amarelo)); box-shadow:0 0 18px rgba(${rgb1},.45); }
.selo .ic svg { width:28px; height:28px; stroke-width:2.2; }
.selo b { font:700 23px/1.2 Inter; color:#fff; white-space:nowrap; }
.selo small { font:500 21px/1.2 Inter; color:#cfc6e8; white-space:nowrap; margin-left:-6px; }

.esq { position:absolute; left:52px; top:222px; width:540px; }
h1 { font-family:"${barlow.familia}"; font-weight:700; text-transform:uppercase; line-height:.9; letter-spacing:-.5px; font-style:italic; }
h1 .l1 { display:block; font-size:92px; color:#fff; white-space:nowrap; }
h1 .l2 { display:block; font-size:104px; color:var(--verde); white-space:nowrap; text-shadow:0 0 30px rgba(${rgb1},.35); }
.sub { margin-top:32px; font:500 26px/1.35 Inter; color:#e6ecf7; max-width:520px; }
.sub b { color:var(--amarelo); }

.figs { margin-top:48px; display:flex; flex-direction:column; gap:30px; width:520px; }
.fig { display:flex; align-items:center; gap:18px; padding:16px 20px; border-radius:18px; background:rgba(9,22,48,.82); border:1.5px solid rgba(255,255,255,.14);
  box-shadow:0 12px 26px rgba(0,0,0,.35); backdrop-filter:blur(6px); }
.fig .ic { flex:none; width:60px; height:60px; border-radius:14px; display:grid; place-items:center; background:linear-gradient(135deg,var(--verde),var(--amarelo)); color:#fff; }
.fig .ic svg { width:36px; height:36px; stroke-width:2.4; }
.fig strong { display:block; font:700 30px/1 "${barlow.familia}"; text-transform:uppercase; letter-spacing:.3px; color:#fff; }
.fig span { display:block; margin-top:5px; font:400 20px/1.25 Inter; color:#c9d4ea; }

.cena { width:430px; height:930px; transform-origin:0 0; }
.cena.frente { left:622px; top:190px; transform:scale(.92); --giro:rotateY(-12deg) rotateX(3deg) rotateZ(2deg); z-index:4; }
.cena .aro { background:linear-gradient(135deg,#3b4454 0%,#0b0f18 20%,#2b3242 38%,#070a10 56%,#1f2533 74%,#05070b 100%) !important; }
${CSS_CELULAR}

.pe { position:absolute; left:46px; bottom:40px; right:46px; height:112px; display:flex; align-items:center; justify-content:center; gap:22px; padding:0 30px; border-radius:60px; z-index:5;
  background:linear-gradient(90deg,var(--verde),var(--amarelo)); color:${v.peTextoEscuro ? "#0b0b0f" : "#fff"}; box-shadow:0 16px 36px rgba(0,0,0,.45), 0 0 40px rgba(${rgb1},.4); }
.pe .ic { width:58px; height:58px; flex:none; }
.pe .ic svg { width:100%; height:100%; stroke-width:2.2; }
.pe small { display:block; font:600 22px/1 Inter; }
.pe b { display:block; margin-top:5px; font:800 36px/1 Inter; letter-spacing:-.8px; }

body.vertical .marca { top:100px; }
body.vertical .esq { top:360px; }
body.vertical .figs { gap:26px; margin-top:36px; }
body.vertical .cena.frente { top:330px; }
body.vertical .pe { bottom:300px; }
</style></head><body class="${formato}">
<div class="ceu"></div>
<div class="sombra"></div>
${celular(frente, "frente")}

<div class="marca"><img src="${url(logo(app))}"><b>${v.nomeMarca ?? app.nome}</b></div>

<div class="esq">
  <h1${c.tamanho ? ` style="font-size:${c.tamanho}px"` : ""}><span class="l1">${c.titulo}</span>${c.destaque ? `<span class="l2">${c.destaque}</span>` : ""}</h1>
  ${c.sub ? `<p class="sub">${c.sub}</p>` : ""}
  <div class="figs">${beneficios}</div>
  <div class="selo"><div class="ic">${icone("check")}</div><b>${selo[0]}</b>${selo[1] ? `<small>· ${selo[1]}</small>` : ""}</div>
</div>

<div class="pe"><div class="ic">${icone("globo")}</div><div><small>${v.pe ?? "Acesse grátis"}</small><b>${dominio(app)}</b></div></div>
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
