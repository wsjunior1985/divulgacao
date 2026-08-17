// cards.js — desenha o card do post.
//
// Três decisões que definem o resultado:
//
// 1. TIPOGRAFIA EMBARCADA. A versão anterior usava a fonte do sistema, e isso
//    significava Helvetica no Mac e DejaVu no runner do GitHub — dois desenhos
//    diferentes, larguras diferentes, quebras de linha diferentes. Agora o
//    renderizador (resvg) recebe os arquivos da Inter que estão em
//    assets/fontes/, e o card sai idêntico em qualquer máquina.
//
// 2. IDENTIDADE REAL. Logo oficial do app e paleta vinda do index.css de cada
//    projeto (convertida de oklch em lib/cor.js). Nada é escolhido no olho.
//
// 3. LAYOUTS. Um card só para tudo cansa o feed. Aqui há três, escolhidos pelo
//    conteúdo do post: manchete, recursos e destaque numérico.

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createRequire } from "node:module";
import { RAIZ } from "./base.js";
import { paraHex, misturar, escurecer, clarear, textoSobre, contraste } from "./cor.js";

const FONTES = resolve(RAIZ, "assets/fontes");
const TITULO = "InterDisplay";
const CORPO = "Inter";

export const FORMATOS = {
  feed: { largura: 1080, altura: 1350 },
  vertical: { largura: 1080, altura: 1920 },
  quadrado: { largura: 1080, altura: 1080 },
};

const cacheLogo = new Map();

function logoBase64(app) {
  if (cacheLogo.has(app.id)) return cacheLogo.get(app.id);
  const caminho = resolve(RAIZ, `assets/logos/${app.id}.png`);
  const dados = `data:image/png;base64,${readFileSync(caminho).toString("base64")}`;
  cacheLogo.set(app.id, dados);
  return dados;
}

// Capturas reais das telas dos apps (scripts/capturar.mjs → assets/capturas/).
// Um app tem 3 variações (0, 1, 2); a variação escolhida roda determinística
// pelo slot. Sem captura, o card cai de volta no layout só de texto.
const cacheCaptura = new Map();

function capturaBase64(app, variacao) {
  const chave = `${app.id}:${variacao}`;
  if (cacheCaptura.has(chave)) return cacheCaptura.get(chave);

  const candidatos = Array.from({ length: 3 }, (_, i) => `assets/capturas/${app.id}-${i}.png`);
  // Nomeia as capturas do gasonol pelo fluxo (seletor/calculadora/resultado),
  // então descobre o arquivo por prefixo, em vez de assumir o sufixo numérico.
  const dirCapturas = resolve(RAIZ, "assets/capturas");
  const prefixos = existsSync(dirCapturas)
    ? readdirSync(dirCapturas).filter((f) => f.startsWith(`${app.id}-`) && f.endsWith(".png"))
    : [];
  const alvos = prefixos.length
    ? prefixos.map((f) => `assets/capturas/${f}`)
    : candidatos.filter((c) => existsSync(resolve(RAIZ, c)));

  const caminho = alvos.length ? alvos[((variacao ?? 0) % alvos.length + alvos.length) % alvos.length] : null;
  const dados = caminho ? `data:image/png;base64,${readFileSync(resolve(RAIZ, caminho)).toString("base64")}` : null;
  cacheCaptura.set(chave, dados);
  return dados;
}

function escapar(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Medição real, tirada do próprio arquivo da fonte. Estimar por média de glifo
// deixava títulos vazarem a margem (o "Você tomou o remédio hoje?" do Remedin
// era 6% mais largo que a conta previa). Com o advance width verdadeiro, a
// quebra de linha acerta sempre.
const cacheFonte = new Map();

function carregarFonte(tipo) {
  if (cacheFonte.has(tipo)) return cacheFonte.get(tipo);
  const arquivo = tipo === "display" ? "InterDisplay-ExtraBold.ttf" : "Inter-Medium.ttf";
  const opentype = createRequire(import.meta.url)("opentype.js");
  const fonte = opentype.parse(readFileSync(`${FONTES}/${arquivo}`).buffer);
  cacheFonte.set(tipo, fonte);
  return fonte;
}

function larguraTexto(texto, tamanho, tipo = "display") {
  const fonte = carregarFonte(tipo);
  const s = String(texto);
  // Soma o avanço de cada glifo em vez de chamar getAdvanceWidth: o shaper do
  // opentype.js quebra numa feature GSUB que a Inter 4.1 usa, e para medir
  // largura o resultado é o mesmo — ignorar o kerning só sobra margem.
  let unidades = 0;
  for (const c of s) unidades += fonte.charToGlyph(c).advanceWidth ?? fonte.unitsPerEm * 0.5;
  const largura = (unidades / fonte.unitsPerEm) * tamanho;

  // O letter-spacing negativo dos títulos encolhe a linha de verdade; sem
  // descontá-lo, o texto quebraria antes do necessário.
  const espacamento = tipo === "display" ? -0.019 * tamanho : 0;
  return largura + espacamento * Math.max(s.length - 1, 0);
}

function quebrar(texto, larguraMax, tamanho, tipo = "display") {
  const linhas = [];
  let atual = "";
  for (const palavra of String(texto).split(/\s+/)) {
    const candidata = atual ? `${atual} ${palavra}` : palavra;
    if (larguraTexto(candidata, tamanho, tipo) <= larguraMax) atual = candidata;
    else {
      if (atual) linhas.push(atual);
      atual = palavra;
    }
  }
  if (atual) linhas.push(atual);
  return linhas;
}

/** Ajusta o corpo do título até caber em no máximo `maxLinhas`. */
function ajustarTitulo(texto, larguraMax, inicial, minimo, maxLinhas) {
  let tamanho = inicial;
  let linhas = quebrar(texto, larguraMax, tamanho);
  while (linhas.length > maxLinhas && tamanho > minimo) {
    tamanho -= 4;
    linhas = quebrar(texto, larguraMax, tamanho);
  }
  return { tamanho, linhas };
}

/** Paleta derivada da marca: fundo profundo, superfícies e texto com contraste checado. */
function paleta(app) {
  const marca = paraHex(app.marca.destaque);
  const base = paraHex(app.marca.fundoA);
  const fundoTopo = misturar(base, marca, 0.14);
  const fundoBase = escurecer(misturar(base, marca, 0.05), 0.35);

  // O selo usa a cor da marca; se o branco não contrastar nela, escurece até contrastar.
  let selo = marca;
  for (let i = 0; i < 6 && contraste(selo, "#ffffff") < 4.5; i++) selo = escurecer(selo, 0.12);

  return {
    marca,
    fundoTopo,
    fundoBase,
    selo,
    textoSelo: textoSobre(selo),
    titulo: "#ffffff",
    apoio: clarear(misturar(marca, "#ffffff", 0.55), 0.15),
    linha: misturar(fundoTopo, "#ffffff", 0.14),
    cartao: misturar(fundoTopo, "#ffffff", 0.06),
  };
}

/** Fundo comum a todos os layouts: gradiente da marca, brilho e uma grade discreta. */
function fundo(L, A, p) {
  return `
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0.35" y2="1">
      <stop offset="0" stop-color="${p.fundoTopo}"/>
      <stop offset="1" stop-color="${p.fundoBase}"/>
    </linearGradient>
    <radialGradient id="brilho" cx="0.78" cy="0.06" r="0.75">
      <stop offset="0" stop-color="${p.marca}" stop-opacity="0.42"/>
      <stop offset="0.55" stop-color="${p.marca}" stop-opacity="0.08"/>
      <stop offset="1" stop-color="${p.marca}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="brilho2" cx="0.1" cy="0.92" r="0.6">
      <stop offset="0" stop-color="${p.apoio}" stop-opacity="0.16"/>
      <stop offset="1" stop-color="${p.apoio}" stop-opacity="0"/>
    </radialGradient>
    <pattern id="grade" width="54" height="54" patternUnits="userSpaceOnUse">
      <path d="M54 0H0V54" fill="none" stroke="#ffffff" stroke-opacity="0.028" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="${L}" height="${A}" fill="url(#g)"/>
  <rect width="${L}" height="${A}" fill="url(#grade)"/>
  <rect width="${L}" height="${A}" fill="url(#brilho)"/>
  <rect width="${L}" height="${A}" fill="url(#brilho2)"/>
  <rect x="0" y="0" width="${L}" height="8" fill="${p.marca}"/>`;
}

/** Cabeçalho: logo oficial + nome + selo de gratuidade. */
function cabecalho(app, p, margem, y = 0) {
  const logo = logoBase64(app);
  const alturaLogo = 92;
  const nome = escapar(app.nome);
  const larguraNome = larguraTexto(app.nome, 42, "corpo");
  const selo = app.selo ?? "GRÁTIS PARA COMEÇAR";
  const larguraSelo = larguraTexto(selo, 22, "corpo") + 44;

  return `
  <g transform="translate(${margem}, ${margem + y})">
    <rect x="-6" y="-6" width="${alturaLogo + 12}" height="${alturaLogo + 12}" rx="26" fill="#ffffff" fill-opacity="0.07"/>
    <image href="${logo}" x="0" y="0" width="${alturaLogo}" height="${alturaLogo}" preserveAspectRatio="xMidYMid meet"/>
    <text x="${alturaLogo + 28}" y="${alturaLogo * 0.44}" font-family="${CORPO}" font-size="42" font-weight="600" fill="${p.titulo}">${nome}</text>
    <g transform="translate(${alturaLogo + 28}, ${alturaLogo * 0.58})">
      <rect x="0" y="0" width="${larguraSelo}" height="34" rx="17" fill="${p.selo}"/>
      <text x="${larguraSelo / 2}" y="23" text-anchor="middle" font-family="${CORPO}" font-size="20" font-weight="600" letter-spacing="0.6" fill="${p.textoSelo}">${escapar(selo)}</text>
    </g>
  </g>`;
}

const ALTURA_RODAPE = 96;
/** Espaço entre o fim do texto e o rodapé — o respiro fica em cima, não embaixo. */
const RESPIRO = 76;

/** Rodapé: domínio em destaque, com a barra da marca e uma seta de chamada. */
function rodape(app, p, L, A, margem) {
  const dominio = new URL(app.url).host.replace(/^www\./, "");
  const y = A - margem - ALTURA_RODAPE;
  const largura = L - margem * 2;
  return `
  <g transform="translate(${margem}, ${y})">
    <rect x="0" y="0" width="${largura}" height="${ALTURA_RODAPE}" rx="30" fill="${p.cartao}" stroke="${p.linha}" stroke-width="1.5"/>
    <rect x="0" y="0" width="10" height="${ALTURA_RODAPE}" rx="5" fill="${p.marca}"/>
    <text x="40" y="60" font-family="${CORPO}" font-size="40" font-weight="600" fill="${p.titulo}">${escapar(dominio)}</text>
    <g transform="translate(${largura - 96}, ${ALTURA_RODAPE / 2 - 22})">
      <circle cx="22" cy="22" r="22" fill="${p.marca}" fill-opacity="0.18"/>
      <path d="M15 22h14M23 16l6 6-6 6" fill="none" stroke="${p.marca}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
  </g>`;
}

/** Onde o conteúdo termina: logo acima do rodapé. Os layouts crescem para cima. */
function baseDoConteudo(A, margem) {
  return A - margem - ALTURA_RODAPE - RESPIRO;
}

const ALTURA_CHIP = 56;

/**
 * Fileira de chips com as funcionalidades — ocupa a faixa entre o texto e o
 * rodapé, que antes ficava vazia, e faz o card dizer o que o app faz mesmo
 * quando o layout é de manchete.
 */
function chips(app, p, L, margem, yBase) {
  const lista = (app.chips ?? []).slice(0, 3);
  if (!lista.length) return { svg: "", altura: 0 };

  const util = L - margem * 2;
  const tam = 26;
  const linhas = [[]];
  let larguraLinha = 0;
  for (const item of lista) {
    const largura = larguraTexto(item, tam, "corpo") + 52;
    if (larguraLinha + largura > util && linhas.at(-1).length) {
      linhas.push([]);
      larguraLinha = 0;
    }
    linhas.at(-1).push({ item, largura });
    larguraLinha += largura + 14;
  }

  const altura = linhas.length * (ALTURA_CHIP + 14);
  const svg = linhas
    .map((linha, i) => {
      let x = margem;
      const y = yBase - altura + i * (ALTURA_CHIP + 14);
      return linha
        .map(({ item, largura }) => {
          const g = `<g transform="translate(${x}, ${y})">
      <rect x="0" y="0" width="${largura}" height="${ALTURA_CHIP}" rx="${ALTURA_CHIP / 2}" fill="${p.marca}" fill-opacity="0.12" stroke="${p.marca}" stroke-opacity="0.4" stroke-width="1.5"/>
      <circle cx="26" cy="${ALTURA_CHIP / 2}" r="5" fill="${p.marca}"/>
      <text x="44" y="${ALTURA_CHIP / 2 + 9}" font-family="${CORPO}" font-size="${tam}" font-weight="500" fill="${p.apoio}">${escapar(item)}</text>
    </g>`;
          x += largura + 14;
          return g;
        })
        .join("\n  ");
    })
    .join("\n  ");

  return { svg, altura };
}

function layoutManchete({ app, p, L, A, margem, titulo, sub }) {
  const util = L - margem * 2;
  const { tamanho, linhas } = ajustarTitulo(titulo, util, A > 1400 ? 108 : 96, 56, 4);
  const tamSub = Math.round(tamanho * 0.4);
  const linhasSub = quebrar(sub, util, tamSub, "corpo");

  const alturaTitulo = linhas.length * tamanho * 1.1;
  const alturaSub = linhasSub.length * tamSub * 1.34;
  const alturaRegua = 44; // filete da marca entre título e subtítulo
  const fileira = chips(app, p, L, margem, baseDoConteudo(A, margem));
  const base = baseDoConteudo(A, margem) - fileira.altura - (fileira.altura ? 30 : 0);
  // Cresce para cima a partir da base: o vazio sobra no topo, onde está o brilho.
  const primeiraBaseline = base - alturaSub - alturaRegua - alturaTitulo + tamanho * 0.82;

  const blocoTitulo = linhas
    .map((linha, i) =>
      `<text x="${margem}" y="${primeiraBaseline + i * tamanho * 1.1}" font-family="${TITULO}" font-size="${tamanho}" font-weight="800" letter-spacing="-2" fill="${p.titulo}">${escapar(linha)}</text>`)
    .join("\n  ");

  const yRegua = primeiraBaseline + (linhas.length - 1) * tamanho * 1.1 + tamanho * 0.42;
  const inicioSub = yRegua + alturaRegua + tamSub * 0.5;
  const blocoSub = linhasSub
    .map((linha, i) =>
      `<text x="${margem}" y="${inicioSub + i * tamSub * 1.34}" font-family="${CORPO}" font-size="${tamSub}" font-weight="500" fill="${p.apoio}">${escapar(linha)}</text>`)
    .join("\n  ");

  return `${blocoTitulo}
  <rect x="${margem}" y="${yRegua}" width="88" height="7" rx="3.5" fill="${p.marca}"/>
  ${blocoSub}
  ${fileira.svg}`;
}

function layoutRecursos({ app, p, L, A, margem, titulo, recursos }) {
  const util = L - margem * 2;
  const { tamanho, linhas } = ajustarTitulo(titulo, util, 82, 48, 3);
  const lista = recursos.slice(0, 4);
  const tamItem = 37;

  // Cada item ocupa o que precisa (1 ou 2 linhas) — nada de altura fixa que
  // deixa buraco quando o texto é curto.
  const alturasItens = lista.map((item) => {
    const n = Math.min(2, quebrar(item, util - 104, tamItem, "corpo").length);
    return Math.max(76, n * tamItem * 1.24 + 34);
  });

  const alturaTitulo = linhas.length * tamanho * 1.12;
  const alturaLista = alturasItens.reduce((s, h) => s + h, 0);
  const base = baseDoConteudo(A, margem);
  const topoTitulo = base - alturaLista - 54 - alturaTitulo + tamanho * 0.84;

  const blocoTitulo = linhas
    .map((linha, i) =>
      `<text x="${margem}" y="${topoTitulo + i * tamanho * 1.12}" font-family="${TITULO}" font-size="${tamanho}" font-weight="800" letter-spacing="-1.5" fill="${p.titulo}">${escapar(linha)}</text>`)
    .join("\n  ");

  let y = topoTitulo + (linhas.length - 1) * tamanho * 1.12 + 54 + tamanho * 0.3;
  const itens = lista
    .map((item, i) => {
      const linhasItem = quebrar(item, util - 104, tamItem, "corpo").slice(0, 2);
      const texto = linhasItem
        .map((linha, j) =>
          `<text x="92" y="${30 + j * tamItem * 1.24}" font-family="${CORPO}" font-size="${tamItem}" font-weight="500" fill="${p.titulo}">${escapar(linha)}</text>`)
        .join("");
      const g = `<g transform="translate(${margem}, ${y})">
      <circle cx="27" cy="18" r="27" fill="${p.marca}" fill-opacity="0.16"/>
      <path d="M15 18 l8 9 l16 -18" fill="none" stroke="${p.marca}" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/>
      ${texto}
    </g>`;
      y += alturasItens[i];
      return g;
    })
    .join("\n  ");

  return `${blocoTitulo}\n  ${itens}`;
}

function layoutDestaque({ app, p, L, A, margem, destaque, titulo, sub }) {
  const util = L - margem * 2;
  // O número é o herói: ocupa a largura útil, limitado para não virar tarja.
  const larguraUnitaria = Math.max(larguraTexto(destaque, 1, "display"), 0.1);
  const tamNumero = Math.min(288, Math.floor((util / larguraUnitaria) * 0.94));
  const { tamanho, linhas } = ajustarTitulo(titulo, util, 68, 42, 3);
  const tamSub = 34;
  const linhasSub = quebrar(sub, util, tamSub, "corpo").slice(0, 2);

  // Altura real de um numeral: ~0,72 do corpo. Era daqui que vinha a colisão
  // entre o número e o título.
  const alturaNumero = tamNumero * 0.72;
  const alturaTitulo = linhas.length * tamanho * 1.12;
  const alturaSub = linhasSub.length * tamSub * 1.3;

  const base = baseDoConteudo(A, margem);
  const baselineNumero = base - alturaSub - 18 - alturaTitulo - 40;
  const topoTitulo = baselineNumero + 40 + tamanho * 0.84;

  const blocoTitulo = linhas
    .map((linha, i) =>
      `<text x="${margem}" y="${topoTitulo + i * tamanho * 1.12}" font-family="${TITULO}" font-size="${tamanho}" font-weight="800" letter-spacing="-1.5" fill="${p.titulo}">${escapar(linha)}</text>`)
    .join("\n  ");

  const inicioSub = topoTitulo + (linhas.length - 1) * tamanho * 1.12 + 18 + tamSub * 1.1;
  const blocoSub = linhasSub
    .map((linha, i) =>
      `<text x="${margem}" y="${inicioSub + i * tamSub * 1.3}" font-family="${CORPO}" font-size="${tamSub}" font-weight="500" fill="${p.apoio}">${escapar(linha)}</text>`)
    .join("\n  ");

  return `
  <text x="${margem}" y="${baselineNumero}" font-family="${TITULO}" font-size="${tamNumero}" font-weight="800" letter-spacing="-8" fill="${p.marca}">${escapar(destaque)}</text>
  <rect x="${margem}" y="${baselineNumero - alturaNumero - 34}" width="88" height="7" rx="3.5" fill="${p.apoio}" fill-opacity="0.55"/>
  ${blocoTitulo}
  ${blocoSub}`;
}

const ASPECTO_TELA = 844 / 390; // 9:19.5 do viewport de captura

/**
 * Mockup premium de celular com a captura real do app dentro. Moldura metálica,
 * botões laterais, reflexo de vidro e brilho na cor da marca — tudo em
 * gradientes, sem depender de filtros do resvg (que têm suporte irregular).
 */
function telefone(app, p, captura, cx, cy, w) {
  if (!captura) return "";
  const id = `tel-${app.id}`;
  const h = w * ASPECTO_TELA;
  const b = Math.max(8, Math.round(w * 0.032));
  const W = Math.round(w + b * 2);
  const H = Math.round(h + b * 2);
  const R = Math.round(w * 0.1);
  const r = Math.max(12, R - b);
  const x = Math.round(cx - W / 2);
  const y = Math.round(cy - H / 2);

  return `
  <g>
    <defs>
      <linearGradient id="${id}-corpo" x1="0" y1="0" x2="0.5" y2="1">
        <stop offset="0" stop-color="#3b3b44"/>
        <stop offset="0.5" stop-color="#1a1a20"/>
        <stop offset="1" stop-color="#0c0c10"/>
      </linearGradient>
      <linearGradient id="${id}-borda" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#ffffff" stop-opacity="0.5"/>
        <stop offset="0.2" stop-color="#ffffff" stop-opacity="0.12"/>
        <stop offset="1" stop-color="#ffffff" stop-opacity="0.05"/>
      </linearGradient>
      <linearGradient id="${id}-reflexo" x1="0" y1="0" x2="0.45" y2="1">
        <stop offset="0" stop-color="#ffffff" stop-opacity="0.10"/>
        <stop offset="0.4" stop-color="#ffffff" stop-opacity="0"/>
      </linearGradient>
      <radialGradient id="${id}-glow" cx="0.5" cy="0.42" r="0.62">
        <stop offset="0" stop-color="${p.marca}" stop-opacity="0.34"/>
        <stop offset="0.6" stop-color="${p.marca}" stop-opacity="0.08"/>
        <stop offset="1" stop-color="${p.marca}" stop-opacity="0"/>
      </radialGradient>
      <clipPath id="${id}-tela">
        <rect x="${x + b}" y="${y + b}" width="${w}" height="${h}" rx="${r}"/>
      </clipPath>
    </defs>

    <rect x="${x - 70}" y="${y - 60}" width="${W + 140}" height="${H + 120}" fill="url(#${id}-glow)"/>
    <rect x="${x}" y="${y + 22}" width="${W}" height="${H}" rx="${R}" fill="#000000" fill-opacity="0.28"/>
    <rect x="${x}" y="${y + 40}" width="${W}" height="${H}" rx="${R}" fill="#000000" fill-opacity="0.12"/>

    <rect x="${x}" y="${y}" width="${W}" height="${H}" rx="${R}" fill="url(#${id}-corpo)"/>
    <rect x="${x + 1.5}" y="${y + 1.5}" width="${W - 3}" height="${H - 3}" rx="${R - 1.5}" fill="none" stroke="url(#${id}-borda)" stroke-width="1.5"/>

    <rect x="${x + W}" y="${y + Math.round(H * 0.3)}" width="${Math.round(b * 1.6)}" height="${Math.round(H * 0.08)}" rx="${Math.round(b * 0.8)}" fill="#0a0a0e"/>
    <rect x="${x - Math.round(b * 1.6)}" y="${y + Math.round(H * 0.22)}" width="${Math.round(b * 1.6)}" height="${Math.round(H * 0.06)}" rx="${Math.round(b * 0.8)}" fill="#0a0a0e"/>
    <rect x="${x - Math.round(b * 1.6)}" y="${y + Math.round(H * 0.3)}" width="${Math.round(b * 1.6)}" height="${Math.round(H * 0.06)}" rx="${Math.round(b * 0.8)}" fill="#0a0a0e"/>

    <rect x="${x + b}" y="${y + b}" width="${w}" height="${h}" rx="${r}" fill="#000000"/>
    <g clip-path="url(#${id}-tela)">
      <image href="${captura}" x="${x + b}" y="${y + b}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice"/>
      <rect x="${x + b}" y="${y + b}" width="${w}" height="${h}" fill="url(#${id}-reflexo)"/>
    </g>
    <rect x="${x + b}" y="${y + b}" width="${w}" height="${h}" rx="${r}" fill="none" stroke="#000000" stroke-opacity="0.4" stroke-width="1.5"/>
  </g>`;
}

/** Lista compacta de recursos (1 linha por item), para a base do card com celular. */
function blocoRecursosCompacto(app, p, L, margem, yBase, recursos) {
  const util = L - margem * 2;
  const lista = recursos.slice(0, 3);
  const tam = 28;
  const altItem = 52;
  const altura = lista.length * altItem;
  const svg = lista
    .map((item, i) => {
      const linha = quebrar(item, util - 88, tam, "corpo")[0] ?? item;
      const y = yBase - altura + i * altItem;
      return `<g transform="translate(${margem}, ${y})">
      <circle cx="20" cy="26" r="20" fill="${p.marca}" fill-opacity="0.16"/>
      <path d="M12 26 l6 7 l12 -14" fill="none" stroke="${p.marca}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="54" y="35" font-family="${CORPO}" font-size="${tam}" font-weight="500" fill="${p.titulo}">${escapar(linha)}</text>
    </g>`;
    })
    .join("\n  ");
  return { svg, altura };
}

/**
 * Manchete + hero conciliados: o celular com o app real é o visual central, e o
 * título/subtítulo crescem na base — com chips (padrão), lista de recursos ou o
 * número em destaque conforme o card.
 */
function layoutHero(contexto, captura) {
  const { app, p, L, A, margem, titulo, sub, recursos, destaque } = contexto;
  const util = L - margem * 2;
  const base = baseDoConteudo(A, margem);
  const fimCabecalho = margem + 112;

  let baixo = { svg: "", altura: 0 };
  if (!destaque) {
    baixo = recursos.length ? blocoRecursosCompacto(app, p, L, margem, base, recursos) : chips(app, p, L, margem, base);
  }
  const yDepoisBaixo = base - baixo.altura - (baixo.altura ? 26 : 0);

  const tamSub = 30;
  const linhasSub = quebrar(sub, util, tamSub, "corpo").slice(0, 2);
  const alturaSub = linhasSub.length * tamSub * 1.32;

  const alturaStat = destaque ? 92 : 0;

  const { tamanho, linhas } = ajustarTitulo(titulo, util, 64, 44, 2);
  const alturaTitulo = linhas.length * tamanho * 1.1;
  const alturaRegua = 40;

  const subTop = yDepoisBaixo - alturaSub;
  const yRegua = subTop - alturaRegua;
  const titleTop = yRegua - alturaTitulo;
  const textoTop = titleTop - alturaStat;

  const phoneBottom = textoTop - 18;
  const phoneTop = fimCabecalho + 14;
  const regiaoH = phoneBottom - phoneTop;

  let pw = Math.floor(regiaoH / ASPECTO_TELA);
  pw = Math.min(pw, Math.floor(util * 0.58));
  const cx = margem + util / 2;
  const cy = phoneTop + regiaoH / 2;

  const blocoTitulo = linhas
    .map((linha, i) =>
      `<text x="${margem}" y="${titleTop + i * tamanho * 1.1 + tamanho * 0.82}" font-family="${TITULO}" font-size="${tamanho}" font-weight="800" letter-spacing="-1.5" fill="${p.titulo}">${escapar(linha)}</text>`)
    .join("\n  ");

  const blocoSub = linhasSub
    .map((linha, i) =>
      `<text x="${margem}" y="${subTop + i * tamSub * 1.32 + tamSub * 0.8}" font-family="${CORPO}" font-size="${tamSub}" font-weight="500" fill="${p.apoio}">${escapar(linha)}</text>`)
    .join("\n  ");

  const blocoStat = destaque
    ? `<text x="${margem}" y="${textoTop + 66}" font-family="${TITULO}" font-size="72" font-weight="800" letter-spacing="-3" fill="${p.marca}">${escapar(destaque)}</text>
  <rect x="${margem}" y="${textoTop + 78}" width="88" height="7" rx="3.5" fill="${p.apoio}" fill-opacity="0.55"/>`
    : "";

  return `${telefone(app, p, captura, cx, cy, pw)}
  ${blocoStat}
  ${blocoTitulo}
  <rect x="${margem}" y="${yRegua}" width="88" height="7" rx="3.5" fill="${p.marca}"/>
  ${blocoSub}
  ${baixo.svg}`;
}

export function montarSvg({ app, post, formato = "feed", variacao = 0 }) {
  const { largura: L, altura: A } = FORMATOS[formato] ?? FORMATOS.feed;
  const p = paleta(app);
  const margem = Math.round(L * 0.082);
  const card = post.card ?? {};

  const contexto = {
    app,
    p,
    L,
    A,
    margem,
    titulo: card.titulo ?? "",
    sub: card.sub ?? "",
    recursos: card.recursos ?? app.recursos ?? [],
    destaque: card.destaque,
  };

  const captura = capturaBase64(app, variacao);

  let corpo;
  if (captura) {
    corpo = layoutHero(contexto, captura);
  } else if (card.destaque) {
    corpo = layoutDestaque(contexto);
  } else if (card.layout === "recursos" && contexto.recursos.length) {
    corpo = layoutRecursos(contexto);
  } else {
    corpo = layoutManchete(contexto);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${L}" height="${A}" viewBox="0 0 ${L} ${A}">
  ${fundo(L, A, p)}
  ${cabecalho(app, p, margem)}
  ${corpo}
  ${rodape(app, p, L, A, margem)}
</svg>`;
}

/** Rasteriza com resvg, que recebe as fontes do repositório — sem depender do sistema. */
export async function gerarCard({ app, post, formato = "feed", nome, titulo, sub, variacao = 0 }) {
  const { Resvg } = await import("@resvg/resvg-js");
  const postFinal = post ?? { card: { titulo, sub } };
  const svg = montarSvg({ app, post: postFinal, formato, variacao });

  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: FORMATOS[formato]?.largura ?? 1080 },
    font: {
      fontFiles: [
        `${FONTES}/Inter-Regular.ttf`,
        `${FONTES}/Inter-Medium.ttf`,
        `${FONTES}/Inter-SemiBold.ttf`,
        `${FONTES}/InterDisplay-Bold.ttf`,
        `${FONTES}/InterDisplay-ExtraBold.ttf`,
      ],
      loadSystemFonts: false,
      defaultFontFamily: CORPO,
    },
  });

  const png = resvg.render().asPng();

  // As redes querem JPEG; o resvg só entrega PNG, então o sharp fecha a conta.
  const { default: sharp } = await import("sharp");
  const buffer = await sharp(png).jpeg({ quality: 92, chromaSubsampling: "4:4:4" }).toBuffer();

  const relativo = `assets/cards/${nome}.jpg`;
  mkdirSync(resolve(RAIZ, "assets/cards"), { recursive: true });
  writeFileSync(resolve(RAIZ, relativo), buffer);
  return { relativo, caminho: resolve(RAIZ, relativo), bytes: buffer.length };
}
