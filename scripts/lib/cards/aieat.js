// aieat.js — layout do AI-Eat, a partir da referência aprovada: marca com slogan no
// topo, selo recortado, título com a palavra final em gradiente ciano→roxo, quatro
// benefícios em círculos coloridos, frase em pílula contornada, três celulares
// pretos em leque à direita e, no pé, o site e o "Disponível como PWA".
import { icone } from "../icones.js";
import { CSS_BASE, CSS_CELULAR, celular, conteudo, dominio, fontesCss, logo, rgb, scriptLuz, semente, tela, tema, url } from "./comum.js";

const CORES = ["#7c4dff", "#2f80ed", "#27ae60", "#f2a31b"];

export function aieat({ app, post, formato, L, A, variacao }) {
  const t = tema(app);
  const c = conteudo(app, post, 4);
  const [principal, fundo, frente] = c.telas ?? [c.tela ?? "tela-home", "tela-scanner", "tela-diario"];
  const frase = c.frase ?? t.frase ?? ["Simples, rápido e inteligente!", "Sua jornada saudável começa agora."];
  const selo = t.selo ?? ["Grátis", "para começar"];
  const beneficios = c.beneficios
    .map((b, i) => `<div class="beneficio"><div class="ic" style="--cor:${CORES[i % CORES.length]}">${icone(b.icone)}</div>
      <div><strong>${b.titulo}</strong>${b.texto ? `<span>${b.texto}</span>` : ""}</div></div>`)
    .join("");
  const extras = t.selos
    .map((s) => `<div class="extra"><div class="ic">${icone(s.icone)}</div>${s.titulo}</div>`)
    .join("");

  return `<!doctype html><html><head><meta charset="utf-8"><style>
${fontesCss(t.display)}
:root { --acento:${t.acento}; --acento-rgb:${rgb(t.acento)}; --calor-rgb:${rgb(t.calor)}; }
${CSS_BASE}
html,body { width:${L}px; height:${A}px; background:#07060d; }

.marca { position:absolute; left:44px; top:40px; display:flex; align-items:center; gap:26px; }
.marca img { width:176px; height:176px; filter:drop-shadow(0 12px 36px rgba(140,60,255,.45)); }
.marca b { display:block; font:800 100px/1 "${t.display.familia}"; letter-spacing:-3px; }
.marca small { display:block; margin-top:14px; font:500 23px/1.35 Inter; letter-spacing:5px; text-transform:uppercase; color:#e8e4f5; }
.marca small i { font-style:normal; font-weight:800; color:#b27cff; }

.selo { position:absolute; right:34px; top:26px; width:206px; height:206px; transform:rotate(-8deg); z-index:6; }
.selo svg.fundo { position:absolute; inset:0; filter:drop-shadow(0 10px 30px rgba(120,60,255,.5)); }
.selo div { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; color:#fff; }
.selo .estrela { width:34px; height:34px; margin-bottom:4px; }
.selo strong { font:800 40px/1 Inter; letter-spacing:-1px; }
.selo span { margin-top:6px; font:700 19px/1.1 Inter; text-transform:uppercase; letter-spacing:1px; max-width:150px; }

.esq { position:absolute; left:48px; top:262px; width:462px; display:flex; flex-direction:column; }
h1 { font:800 78px/1.06 "${t.display.familia}"; letter-spacing:-2.5px; text-shadow:0 4px 30px rgba(0,0,0,.6); }
h1.linhas { white-space:nowrap; }
h1 .l2 { display:block; white-space:nowrap; background:linear-gradient(90deg,#5fdcef 0%,#8b7cff 45%,#b45cf0 100%); -webkit-background-clip:text; color:transparent; padding-bottom:6px; }
.sub { margin-top:14px; font:400 25px/1.35 Inter; color:#dcd8ea; }
.sub b { color:#c89bff; }

.beneficios { margin-top:30px; display:flex; flex-direction:column; gap:22px; }
.beneficio { display:flex; align-items:center; gap:22px; }
.beneficio > div:last-child { min-width:0; }
.beneficio .ic { flex:none; width:86px; height:86px; border-radius:50%; display:grid; place-items:center; color:#fff;
  background:radial-gradient(circle at 30% 25%, color-mix(in srgb, var(--cor) 70%, #fff), var(--cor) 55%, color-mix(in srgb, var(--cor) 70%, #000));
  box-shadow:0 10px 28px color-mix(in srgb, var(--cor) 45%, transparent), inset 0 2px 0 rgba(255,255,255,.25); }
.beneficio .ic svg { width:42px; height:42px; }
.beneficio strong { display:block; font:800 22px/1.15 Inter; text-transform:uppercase; letter-spacing:.3px; }
.beneficio span { display:block; margin-top:5px; font:400 21px/1.3 Inter; color:#dcd8ea; }

.frase { margin-top:34px; padding:18px 26px; border-radius:48px; border:3px solid transparent;
  background:linear-gradient(#0d0a18,#0d0a18) padding-box, linear-gradient(90deg,#7c4dff,#c04cf0,#7c4dff) border-box;
  box-shadow:0 0 34px rgba(160,80,255,.35); }
.frase strong { display:flex; align-items:center; gap:12px; font:700 26px/1.2 Inter; white-space:nowrap; }
.frase strong svg { width:30px; height:30px; color:#fff; }
.frase span { display:block; margin-top:6px; font:400 22px/1.25 Inter; color:#e8e4f5; white-space:nowrap; }

.pe { position:absolute; left:48px; bottom:44px; display:flex; gap:16px; }
.caixa { display:flex; align-items:center; gap:18px; padding:18px 26px 18px 20px; border-radius:18px; border:2px solid rgba(255,255,255,.14);
  background:linear-gradient(135deg,rgba(40,30,70,.7),rgba(10,9,20,.85)); }
.caixa .ic { width:52px; height:52px; color:#8fb8ff; }
.caixa .ic svg { width:100%; height:100%; }
.caixa small { display:block; font:500 21px/1.1 Inter; color:#d6d2e4; }
.caixa b { display:block; margin-top:6px; font:800 29px/1 Inter; letter-spacing:-.4px; }
.extras { position:absolute; right:28px; bottom:40px; display:flex; gap:10px; }
.extra { width:112px; display:flex; flex-direction:column; align-items:center; gap:10px; text-align:center; font:700 15px/1.2 Inter; text-transform:uppercase; }
.extra .ic { width:46px; height:46px; color:#b27cff; filter:drop-shadow(0 0 8px rgba(178,124,255,.6)); }
.extra .ic svg { width:100%; height:100%; }

/* Três aparelhos em leque, pretos, com a base de 430×930 escalada. */
.cena { width:430px; height:930px; transform-origin:0 0; }
.cena.fundo { left:808px; top:230px; transform:scale(.66); --giro:rotateY(-24deg) rotateX(4deg) rotateZ(7deg); z-index:1; filter:brightness(.8); }
.cena.principal { left:520px; top:236px; transform:scale(.84); --giro:rotateY(-12deg) rotateX(4deg) rotateZ(3deg); z-index:2; }
.cena.frente { left:806px; top:640px; transform:scale(.6); --giro:rotateY(-20deg) rotateX(3deg) rotateZ(9deg); z-index:3; }
.brilho { position:absolute; left:560px; top:180px; width:560px; height:1000px; border-radius:50%;
  background:radial-gradient(closest-side, rgba(150,70,255,.35), rgba(120,60,255,.10) 60%, transparent); filter:blur(30px); }
${CSS_CELULAR}

/* Vertical (TikTok): mais ar entre os blocos e o pé acima da legenda sobreposta. */
body.vertical .marca { top:90px; }
body.vertical .selo { top:70px; }
body.vertical .esq { top:340px; }
body.vertical h1 { font-size:86px; }
body.vertical .beneficios { gap:30px; margin-top:40px; }
body.vertical .frase { margin-top:44px; }
body.vertical .cena.fundo { top:390px; }
body.vertical .cena.principal { top:380px; transform:scale(.9); }
body.vertical .cena.frente { top:860px; transform:scale(.64); }
body.vertical .brilho { top:360px; }
body.vertical .pe { bottom:380px; }
body.vertical .extras { bottom:380px; }
</style></head><body class="${formato}">
<canvas id="luz" width="${L}" height="${A}"></canvas>
<div class="brilho"></div>
${celular(tela(app, fundo, variacao + 1), "fundo preto")}
${celular(tela(app, principal, variacao), "principal preto")}
${celular(tela(app, frente, variacao + 2), "frente preto")}

<div class="marca"><img src="${url(logo(app))}"><div><b>${t.nomeMarca ?? app.nome}</b><small>${t.slogan ?? app.tagline}</small></div></div>
<div class="selo">
  <svg class="fundo" viewBox="0 0 100 100"><defs><linearGradient id="gs" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#27c46a"/><stop offset=".55" stop-color="#5b6cf0"/><stop offset="1" stop-color="#9b4cf0"/></linearGradient></defs>
  <path fill="url(#gs)" d="${Array.from({ length: 48 }, (_, i) => { const a = (i / 48) * Math.PI * 2, r = i % 2 ? 46 : 50; return `${i ? "L" : "M"}${(50 + r * Math.cos(a)).toFixed(2)} ${(50 + r * Math.sin(a)).toFixed(2)}`; }).join(" ")}Z"/></svg>
  <div><svg class="estrela" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linejoin="round"><path d="M12 3.2l2.7 5.6 6.1.8-4.5 4.3 1.2 6.1L12 17.1l-5.5 2.9 1.2-6.1L3.2 9.6l6.1-.8z"/></svg>
  <strong>${selo[0]}</strong><span>${selo[1]}</span></div>
</div>

<div class="esq">
  <h1${String(c.titulo).includes("<br>") ? ' class="linhas"' : ""}${c.tamanho ? ` style="font-size:${c.tamanho}px"` : ""}>${c.titulo}${c.destaque ? `<span class="l2">${c.destaque}</span>` : ""}</h1>
  ${c.sub && post.premium?.mostrarSub ? `<p class="sub">${c.sub}</p>` : ""}
  <div class="beneficios">${beneficios}</div>
  <div class="frase"><strong><svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 2l1.8 5.2L17 9l-5.2 1.8L10 16l-1.8-5.2L3 9l5.2-1.8zM18.5 13l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9z"/></svg>${frase[0]}</strong><span>${frase[1]}</span></div>
</div>

<div class="pe">
  <div class="caixa"><div class="ic">${icone("globo")}</div><div><small>Acesse agora</small><b>${dominio(app)}</b></div></div>
  <div class="caixa"><div class="ic">${icone("celular")}</div><div><small>Disponível como</small><b>PWA (Web App)</b></div></div>
</div>
<div class="extras">${extras}</div>
<div class="grao"></div>

<script>
${scriptLuz({ L, A, t, semente: semente(app, post), fundo: "#07060d", intensidade: 0.75 })}
// Encaixe: o título diminui até a coluna inteira caber acima do pé do card.
document.fonts.ready.then(() => {
  const esq = document.querySelector(".esq"), h1 = document.querySelector("h1");
  const limite = document.querySelector(".pe").getBoundingClientRect().top - 30;
  let tam = parseFloat(getComputedStyle(h1).fontSize);
  for (let i = 0; i < 30 && (esq.getBoundingClientRect().bottom > limite || h1.scrollWidth > esq.clientWidth); i++) { tam -= 3; h1.style.fontSize = tam + "px"; }
  // Frase: encolhe até caber na pílula.
  const frase = document.querySelector(".frase");
  for (let i = 0, f = 26; i < 12 && frase.scrollWidth > frase.clientWidth; i++) { f -= 1; frase.style.fontSize = f + "px"; frase.querySelector("strong").style.fontSize = f + "px"; frase.querySelector("span").style.fontSize = (f - 4) + "px"; }
  window.__pronto = true;
});
</script>
</body></html>`;
}
