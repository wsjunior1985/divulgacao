// Gera carrosséis 4:5 com as telas reais e a identidade de cada app.
import { mkdirSync, renameSync, unlinkSync, statSync } from "node:fs";
import { resolve } from "node:path";
import sharp from "sharp";
import { gerarCard } from "./cards.js";
import { RAIZ } from "./base.js";
import { postsDoApp } from "./conteudo.js";

const TELAS = {
  aeroliso: ["tela-alertas", "tela-rota", "tela-insights"], aieat: ["tela-home", "tela-scanner", "tela-diario", "tela-historico"],
  barbarizando: ["tela-agenda", "tela-agendamento", "tela-servicos", "tela-relatorios"], convertendo: ["tela-converter", "tela-cotacoes", "tela-compras"],
  euquiz: ["tela-inicio", "tela-criar", "tela-jogar", "tela-professor"], fazopix: ["tela-formulario", "tela-qr-pronto", "tela-exportar"],
  gasonol: ["tela-calculadora", "tela-seletor", "tela-voz", "tela-gasolina", "tela-economia"], omeualbum: ["tela-estatisticas", "tela-grupos"],
  opalpiteiro: ["tela-app"], papelzinho: ["tela-eventos"], remedin: ["tela-hoje"], rifazinha: ["tela-rifa", "tela-vendas"],
  vaidarquanto: ["tela-inicio", "tela-carrinho", "tela-listas"], voutrocar: ["tela-inicio", "tela-ranking", "tela-comparar", "tela-metodologia"],
};
const ICONE = ["check", "alvo", "raio", "lista", "estrela", "globo"];
const TEMAS_ADIADOS = {
  // Temas eleitorais pedem revisão específica antes de entrar no calendário.
  opalpiteiro: new Set(["multicategoria", "seu-palpite"]),
  // Temas de ranking/preço precisam carregar fonte e período na peça.
  voutrocar: new Set(["ranking-atualizado", "qual-carro-comprar", "comparar", "por-categoria"]),
  // Evita publicar alíquotas/franquias que podem mudar sem revisão recente.
  convertendo: new Set(["iof-338", "franquia", "cotacao-nao-e-preco"]),
};

function dividirTitulo(titulo = "") {
  const m = String(titulo).match(/^(.*?)\*([^*]+)\*(.*)$/);
  return m ? { titulo: `${m[1]}${m[3]}`.trim(), destaque: m[2].trim() } : { titulo: String(titulo).trim(), destaque: "" };
}

function montarSlides(app, post) {
  const recursos = post.premium?.beneficios?.length ? post.premium.beneficios : post.card?.recursos ?? app.recursos ?? [];
  const telaLista = TELAS[app.id] ?? [];
  const lead = dividirTitulo(post.card?.titulo ?? app.tagline ?? app.nome);
  const linhas = recursos.map((r) => typeof r === "string" ? { titulo: r, texto: "" } : { titulo: r.titulo, texto: r.texto ?? r.descricao ?? "" });
  const telas = (slide) => slide === 0 && post.premium?.tela ? post.premium.tela : telaLista[Math.max(0, slide - 1) % Math.max(1, telaLista.length)];
  return Array.from({ length: 7 }, (_, i) => {
    let c;
    if (i === 0) c = { ...lead, sub: post.premium?.sub ?? app.tagline, tela: telas(i), beneficios: linhas.slice(0, 3) };
    else if (i === 1) c = { titulo: "Conheça os recursos", destaque: `do ${app.nome}`, sub: app.tagline, tela: telas(i), beneficios: linhas.slice(0, 3) };
    else if (i >= 2 && i <= 4 && linhas.length) {
      const b = linhas[(i - 2) % linhas.length];
      c = { titulo: b.titulo, destaque: "no seu dia a dia", sub: b.texto || app.tagline, tela: telas(i), beneficios: linhas.slice((i - 2) % linhas.length, (i - 2) % linhas.length + 3) };
    } else if (i === 5) c = { titulo: "Comece em", destaque: "poucos passos", sub: `Acesse ${app.url.replace(/^https?:\/\//, "").replace(/\/$/, "")} e conheça.`, tela: telas(i), beneficios: [{ titulo: "Abra o app", texto: "Direto pelo navegador" }, { titulo: "Explore", texto: "Veja os recursos disponíveis" }, { titulo: "Use no seu ritmo", texto: "No celular ou computador" }] };
    else c = { titulo: "Quer conhecer", destaque: `${app.nome}?`, sub: `Acesse ${app.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}`, tela: telas(i), beneficios: [{ titulo: "Salve este post", texto: "para consultar depois" }, { titulo: "Compartilhe", texto: "com quem pode aproveitar" }, { titulo: app.nome, texto: "acesse pelo link do perfil" }] };
    c.beneficios = (c.beneficios ?? []).slice(0, 3).map((b, j) => ({ icone: ICONE[(i + j) % ICONE.length], titulo: b.titulo, texto: b.texto ?? "" }));
    return { id: `${post.id}-slide-${i + 1}`, card: { titulo: `${c.titulo} *${c.destaque}*`, sub: c.sub }, premium: c, ...(post.visual ? { visual: post.visual } : {}) };
  });
}

/** Renderiza 7 JPEGs 1080×1350 no diretório versionado de cards. */
export async function gerarCarrossel({ app, post, identificador, variacao = 0 }) {
  const { chromium } = await import("playwright");
  const navegador = await chromium.launch();
  const destino = resolve(RAIZ, "assets/cards"); mkdirSync(destino, { recursive: true });
  const slides = montarSlides(app, post); const arquivos = [];
  const appVisual = app.id === "aieat"
    ? { ...app, visual: { ...app.visual, slogan: "Estimativas de refeições com IA" } }
    : app;
  try {
    for (let i = 0; i < slides.length; i++) {
      const nome = `${identificador}-slide-${i + 1}`;
      const r = await gerarCard({ app: appVisual, post: slides[i], formato: "feed", nome, variacao: variacao + i, navegador });
      const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="110" height="46"><rect x="1" y="1" width="108" height="44" rx="22" fill="#080b08" fill-opacity=".92" stroke="#ffffff" stroke-opacity=".8" stroke-width="2"/><text x="55" y="30" text-anchor="middle" font-family="Arial,sans-serif" font-size="21" font-weight="700" fill="#fff">${i + 1}/7</text></svg>`);
      const temp = resolve(destino, `${nome}-badge.jpg`);
      await sharp(r.caminho).composite([{ input: svg, left: 922, top: 34 }]).jpeg({ quality: 92, chromaSubsampling: "4:4:4" }).toFile(temp);
      unlinkSync(r.caminho); const final = resolve(destino, `${nome}.jpg`); renameSync(temp, final);
      arquivos.push({ relativo: `assets/cards/${nome}.jpg`, bytes: statSync(final).size });
      console.log(`carrossel ${app.id}: slide ${i + 1}/7 gerado`);
    }
  } finally { await navegador.close(); }
  return arquivos;
}

export function escolherPostSeguro(app, ciclo = 0, dia) {
  const adiados = TEMAS_ADIADOS[app.id] ?? new Set();
  const elegiveis = postsDoApp(app, dia).filter((post) => !adiados.has(post.id));
  if (!elegiveis.length) throw new Error(`nenhum tema liberado para carrossel: ${app.id}`);
  return elegiveis[((ciclo % elegiveis.length) + elegiveis.length) % elegiveis.length];
}

export { montarSlides };
