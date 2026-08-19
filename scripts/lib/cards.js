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
// 3. LAYOUTS. O padrão é a vitrine: marca no topo, manchete com a palavra-chave
//    na cor do app, os quatro recursos com ícone próprio, dois aparelhos em
//    perspectiva com telas reais e rodapé com CTA e selos. Os layouts antigos
//    (manchete, recursos, destaque, hero) continuam como rede de segurança para
//    quando falta material — captura ausente ou tema sem recursos.

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createRequire } from "node:module";
import { RAIZ } from "./base.js";
import { paraHex, misturar, escurecer, clarear, textoSobre, contraste } from "./cor.js";
import { icone } from "./icones.js";

const FONTES = resolve(RAIZ, "assets/fontes");
const CORPO = "Inter";

/**
 * Fontes de display, uma por app. O rodízio publica um app por slot, então
 * cinco posts seguidos já saem com cinco tipografias diferentes — a variedade
 * aparece no feed sem que um mesmo app mude de cara de um post para o outro,
 * que leria como erro e não como intenção.
 *
 * `familia` é o nome que o resvg enxerga (name ID 16, ou ID 1 quando não há):
 * atenção que a Inter Display se chama "Inter Display", COM espaço. O código
 * pedia "InterDisplay", que não casa com nada e caía no fallback da Inter de
 * texto — media com um desenho e desenhava com outro.
 */
const DISPLAYS = {
  inter: { familia: "Inter Display", arquivo: "InterDisplay-ExtraBold.ttf", peso: 800, tracking: -1.8 },
  sora: { familia: "Sora", arquivo: "Sora-ExtraBold.ttf", peso: 800, tracking: -1.6 },
  manrope: { familia: "Manrope", arquivo: "Manrope-ExtraBold.ttf", peso: 800, tracking: -1.8 },
  fraunces: { familia: "Fraunces", arquivo: "Fraunces-Bold.ttf", peso: 700, tracking: -0.6 },
  grotesk: { familia: "Space Grotesk", arquivo: "SpaceGrotesk-Bold.ttf", peso: 700, tracking: -1.4 },
  jakarta: { familia: "Plus Jakarta Sans", arquivo: "PlusJakartaSans-ExtraBold.ttf", peso: 800, tracking: -1.8 },
};

// A fonte da vez. É estado de módulo porque `montarSvg` é síncrono e desenha um
// card por vez: passar a família por parâmetro obrigaria a atravessá-la por
// vinte funções de desenho sem nenhum ganho.
let display = DISPLAYS.inter;
const usarDisplay = (id) => {
  display = DISPLAYS[id] ?? DISPLAYS.inter;
};

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

/** Caminhos das capturas de um app, em ordem estável. */
function listaCapturas(app) {
  const candidatos = Array.from({ length: 3 }, (_, i) => `assets/capturas/${app.id}-${i}.png`);
  // Nomeia as capturas do gasonol pelo fluxo (seletor/calculadora/resultado),
  // então descobre o arquivo por prefixo, em vez de assumir o sufixo numérico.
  const dirCapturas = resolve(RAIZ, "assets/capturas");
  const prefixos = existsSync(dirCapturas)
    ? readdirSync(dirCapturas)
        .filter((f) => f.startsWith(`${app.id}-`) && f.endsWith(".png"))
        .sort()
    : [];
  return prefixos.length
    ? prefixos.map((f) => `assets/capturas/${f}`)
    : candidatos.filter((c) => existsSync(resolve(RAIZ, c)));
}

function capturaBase64(app, variacao) {
  const chave = `${app.id}:${variacao}`;
  if (cacheCaptura.has(chave)) return cacheCaptura.get(chave);

  const alvos = listaCapturas(app);
  const caminho = alvos.length ? alvos[((variacao ?? 0) % alvos.length + alvos.length) % alvos.length] : null;
  const dados = caminho ? `data:image/png;base64,${readFileSync(resolve(RAIZ, caminho)).toString("base64")}` : null;
  cacheCaptura.set(chave, dados);
  return dados;
}

/**
 * As `n` capturas a partir da variação, sem repetir enquanto houver telas
 * diferentes — é o que alimenta a pilha de celulares do layout vitrine.
 */
function capturasBase64(app, variacao, n = 2) {
  const total = listaCapturas(app).length;
  if (!total) return [];
  return Array.from({ length: Math.min(n, total) }, (_, i) => capturaBase64(app, (variacao ?? 0) + i)).filter(Boolean);
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
  const arquivo = tipo === "display" ? display.arquivo : "Inter-Medium.ttf";
  if (cacheFonte.has(arquivo)) return cacheFonte.get(arquivo);
  const opentype = createRequire(import.meta.url)("opentype.js");
  const fonte = opentype.parse(readFileSync(`${FONTES}/${arquivo}`).buffer);
  cacheFonte.set(arquivo, fonte);
  return fonte;
}

/**
 * Largura de um texto. `tracking` sobrescreve a compensação embutida de
 * letter-spacing: o layout vitrine posiciona palavra por palavra e precisa do
 * avanço exato, senão o erro por caractere acumula e as palavras se encostam
 * (era o "Feijoada,PF," sem espaço).
 */
function larguraTexto(texto, tamanho, tipo = "display", tracking = null) {
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
  if (tracking !== null) return largura + tracking * s.length;
  const espacamento = tipo === "display" ? -0.019 * tamanho : 0;
  return largura + espacamento * Math.max(s.length - 1, 0);
}

function quebrar(texto, larguraMax, tamanho, tipo = "display", tracking = null) {
  const linhas = [];
  let atual = "";
  for (const palavra of String(texto).split(/\s+/)) {
    const candidata = atual ? `${atual} ${palavra}` : palavra;
    if (larguraTexto(candidata, tamanho, tipo, tracking) <= larguraMax) atual = candidata;
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
    acentos: acentos(marca),
  };
}

// Os cards de referência dão uma cor diferente para cada recurso da lista, e é
// isso que impede a fileira de virar um bloco monocromático. Puxar cada cor
// para a marca (35%) mantém as cinco variantes reconhecíveis como do mesmo app.
const ACENTOS_BASE = ["#6366f1", "#0ea5e9", "#22c55e", "#f59e0b", "#ec4899"];

function acentos(marca) {
  return ACENTOS_BASE.map((cor) => misturar(cor, marca, 0.35));
}

/**
 * Aceita recurso como string (formato antigo) ou como
 * `{ icone, titulo, descricao }` — assim os apps podem migrar um a um sem que o
 * renderizador precise saber em qual formato cada um está.
 */
function textoDosRecursos(lista) {
  return normalizarRecursos(lista).map((r) => r.descricao || r.titulo || "");
}

function normalizarRecursos(lista) {
  return (lista ?? []).map((item) =>
    typeof item === "string"
      ? { icone: "check", titulo: null, descricao: item }
      : { icone: item.icone ?? "check", titulo: item.titulo ?? null, descricao: item.descricao ?? "" });
}

/**
 * Fundo comum a todos os layouts. A barra sólida da marca no topo saiu: um
 * filete chapado de 8px lia como aviso de sistema, não como acabamento. No
 * lugar entram um degradê que se apaga na horizontal e uma vinheta que fecha os
 * cantos — é ela que dá a profundidade que faltava para o card parecer impresso.
 */
function fundo(L, A, p) {
  return `
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0.35" y2="1">
      <stop offset="0" stop-color="${p.fundoTopo}"/>
      <stop offset="1" stop-color="${p.fundoBase}"/>
    </linearGradient>
    <radialGradient id="brilho" cx="0.74" cy="0.08" r="0.88">
      <stop offset="0" stop-color="${p.marca}" stop-opacity="0.34"/>
      <stop offset="0.45" stop-color="${p.marca}" stop-opacity="0.10"/>
      <stop offset="1" stop-color="${p.marca}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="brilho2" cx="0.06" cy="0.88" r="0.7">
      <stop offset="0" stop-color="${p.apoio}" stop-opacity="0.14"/>
      <stop offset="1" stop-color="${p.apoio}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="vinheta" cx="0.5" cy="0.44" r="0.78">
      <stop offset="0.55" stop-color="#000000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000000" stop-opacity="0.42"/>
    </radialGradient>
    <linearGradient id="filete" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${p.marca}" stop-opacity="0.9"/>
      <stop offset="0.45" stop-color="${p.marca}" stop-opacity="0.28"/>
      <stop offset="1" stop-color="${p.marca}" stop-opacity="0"/>
    </linearGradient>
    <pattern id="grade" width="60" height="60" patternUnits="userSpaceOnUse">
      <path d="M60 0H0V60" fill="none" stroke="#ffffff" stroke-opacity="0.022" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="${L}" height="${A}" fill="url(#g)"/>
  <rect width="${L}" height="${A}" fill="url(#grade)"/>
  <rect width="${L}" height="${A}" fill="url(#brilho)"/>
  <rect width="${L}" height="${A}" fill="url(#brilho2)"/>
  <rect width="${L}" height="${A}" fill="url(#vinheta)"/>
  <rect x="0" y="0" width="${L}" height="3" fill="url(#filete)"/>`;
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
function chips(app, p, x, util, yBase) {
  const lista = (app.chips ?? []).slice(0, 3);
  if (!lista.length) return { svg: "", altura: 0 };

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
      let cx = x;
      const y = yBase - altura + i * (ALTURA_CHIP + 14);
      return linha
        .map(({ item, largura }) => {
          const g = `<g transform="translate(${cx}, ${y})">
      <rect x="0" y="0" width="${largura}" height="${ALTURA_CHIP}" rx="${ALTURA_CHIP / 2}" fill="${p.marca}" fill-opacity="0.12" stroke="${p.marca}" stroke-opacity="0.4" stroke-width="1.5"/>
      <circle cx="26" cy="${ALTURA_CHIP / 2}" r="5" fill="${p.marca}"/>
      <text x="44" y="${ALTURA_CHIP / 2 + 9}" font-family="${CORPO}" font-size="${tam}" font-weight="500" fill="${p.apoio}">${escapar(item)}</text>
    </g>`;
          cx += largura + 14;
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
  const fileira = chips(app, p, margem, util, baseDoConteudo(A, margem));
  const base = baseDoConteudo(A, margem) - fileira.altura - (fileira.altura ? 30 : 0);
  // Cresce para cima a partir da base: o vazio sobra no topo, onde está o brilho.
  const primeiraBaseline = base - alturaSub - alturaRegua - alturaTitulo + tamanho * 0.82;

  const blocoTitulo = linhas
    .map((linha, i) =>
      `<text x="${margem}" y="${primeiraBaseline + i * tamanho * 1.1}" font-family="${display.familia}" font-size="${tamanho}" font-weight="${display.peso}" letter-spacing="-2" fill="${p.titulo}">${escapar(linha)}</text>`)
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
  // Estes layouts são de uma linha por recurso: do formato rico aproveitam a
  // descrição, que é a frase completa.
  const lista = textoDosRecursos(recursos).slice(0, 4);
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
      `<text x="${margem}" y="${topoTitulo + i * tamanho * 1.12}" font-family="${display.familia}" font-size="${tamanho}" font-weight="${display.peso}" letter-spacing="-1.5" fill="${p.titulo}">${escapar(linha)}</text>`)
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
      `<text x="${margem}" y="${topoTitulo + i * tamanho * 1.12}" font-family="${display.familia}" font-size="${tamanho}" font-weight="${display.peso}" letter-spacing="-1.5" fill="${p.titulo}">${escapar(linha)}</text>`)
    .join("\n  ");

  const inicioSub = topoTitulo + (linhas.length - 1) * tamanho * 1.12 + 18 + tamSub * 1.1;
  const blocoSub = linhasSub
    .map((linha, i) =>
      `<text x="${margem}" y="${inicioSub + i * tamSub * 1.3}" font-family="${CORPO}" font-size="${tamSub}" font-weight="500" fill="${p.apoio}">${escapar(linha)}</text>`)
    .join("\n  ");

  return `
  <text x="${margem}" y="${baselineNumero}" font-family="${display.familia}" font-size="${tamNumero}" font-weight="${display.peso}" letter-spacing="-8" fill="${p.marca}">${escapar(destaque)}</text>
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
function telefone(app, p, captura, cx, cy, w, opcoes = {}) {
  if (!captura) return "";
  // Cada instância precisa de ids próprios: a pilha do layout vitrine desenha
  // dois aparelhos, e defs com o mesmo id fazem o segundo herdar o gradiente do
  // primeiro (o de trás saía com o brilho do da frente).
  const { sufixo = "", rotacao = 0, sombra = 1, brilho = 1 } = opcoes;
  const id = `tel-${app.id}${sufixo}`;
  const h = w * ASPECTO_TELA;
  const b = Math.max(8, Math.round(w * 0.032));
  const W = Math.round(w + b * 2);
  const H = Math.round(h + b * 2);
  const R = Math.round(w * 0.1);
  const r = Math.max(12, R - b);
  const x = Math.round(cx - W / 2);
  const y = Math.round(cy - H / 2);

  return `
  <g transform="rotate(${rotacao} ${cx} ${cy})">
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

    ${brilho ? `<rect x="${x - 70}" y="${y - 60}" width="${W + 140}" height="${H + 120}" fill="url(#${id}-glow)"/>` : ""}
    <rect x="${x}" y="${y + 22}" width="${W}" height="${H}" rx="${R}" fill="#000000" fill-opacity="${0.28 * sombra}"/>
    <rect x="${x}" y="${y + 40}" width="${W}" height="${H}" rx="${R}" fill="#000000" fill-opacity="${0.12 * sombra}"/>

    <rect x="${x}" y="${y}" width="${W}" height="${H}" rx="${R}" fill="url(#${id}-corpo)"/>
    <rect x="${x + 1.5}" y="${y + 1.5}" width="${W - 3}" height="${H - 3}" rx="${R - 1.5}" fill="none" stroke="url(#${id}-borda)" stroke-width="1.5"/>

    <rect x="${x + b}" y="${y + b}" width="${w}" height="${h}" rx="${r}" fill="#000000"/>
    <g clip-path="url(#${id}-tela)">
      <image href="${captura}" x="${x + b}" y="${y + b}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice"/>
      <rect x="${x + b}" y="${y + b}" width="${w}" height="${h}" fill="url(#${id}-reflexo)"/>
    </g>
    <rect x="${x + b}" y="${y + b}" width="${w}" height="${h}" rx="${r}" fill="none" stroke="#000000" stroke-opacity="0.4" stroke-width="1.5"/>
  </g>`;
}

/** Lista compacta de recursos (1 linha por item), para a base do card com celular. */
function blocoRecursosCompacto(app, p, x, largura, yBase, recursos) {
  const lista = textoDosRecursos(recursos).slice(0, 3);
  const tam = 28;
  const altItem = 52;
  const altura = lista.length * altItem;
  const svg = lista
    .map((item, i) => {
      const linha = quebrar(item, largura - 88, tam, "corpo")[0] ?? item;
      const y = yBase - altura + i * altItem;
      return `<g transform="translate(${x}, ${y})">
      <circle cx="20" cy="26" r="20" fill="${p.marca}" fill-opacity="0.16"/>
      <path d="M12 26 l6 7 l12 -14" fill="none" stroke="${p.marca}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="54" y="35" font-family="${CORPO}" font-size="${tam}" font-weight="500" fill="${p.titulo}">${escapar(linha)}</text>
    </g>`;
    })
    .join("\n  ");
  return { svg, altura };
}

/**
 * Manchete + hero conciliados em duas colunas: o celular com o app real fica
 * lateralizado de um lado (alternando por slot) e o texto do outro — título,
 * subtítulo e o bloco inferior (chips, recursos ou número em destaque).
 */
function layoutHero(contexto, captura, lado = 0) {
  const { app, p, L, A, margem, titulo, sub, recursos, destaque } = contexto;
  const util = L - margem * 2;
  const base = baseDoConteudo(A, margem);
  const topo = margem + 124;
  const alturaRegiao = base - topo;

  const gap = Math.round(util * 0.05);
  const larguraTexto = Math.round(util * 0.54);
  const larguraFone = util - gap - larguraTexto;

  let pw = Math.min(larguraFone, Math.floor((alturaRegiao * 0.96) / ASPECTO_TELA));
  const ph = pw * ASPECTO_TELA;
  const phoneTop = topo + (alturaRegiao - ph) / 2;
  const cy = phoneTop + ph / 2;

  const telefoneEsquerda = lado === 0;
  const xFone = telefoneEsquerda ? margem + (larguraFone - pw) / 2 : margem + larguraTexto + gap + (larguraFone - pw) / 2;
  const xTexto = telefoneEsquerda ? margem + larguraFone + gap : margem;
  const cx = xFone + pw / 2;

  const tamSub = 30;
  const linhasSub = quebrar(sub, larguraTexto, tamSub, "corpo").slice(0, 2);
  const alturaSub = linhasSub.length * tamSub * 1.32;

  const alturaStat = destaque ? 92 : 0;

  const { tamanho, linhas } = ajustarTitulo(titulo, larguraTexto, 60, 38, 4);
  const alturaTitulo = linhas.length * tamanho * 1.12;
  const alturaRegua = 36;

  let baixo = { svg: "", altura: 0 };
  if (!destaque) {
    baixo = recursos.length
      ? blocoRecursosCompacto(app, p, xTexto, larguraTexto, 0, recursos)
      : chips(app, p, xTexto, larguraTexto, 0);
  }
  const gapBaixo = baixo.altura ? 24 : 0;

  const alturaBlocoTexto = alturaStat + alturaTitulo + alturaRegua + alturaSub + gapBaixo + baixo.altura;
  const topoTexto = topo + Math.max(0, (alturaRegiao - alturaBlocoTexto) / 2);

  let cursor = topoTexto;
  const statTop = cursor;
  cursor += alturaStat;
  const titleTop = cursor;
  cursor += alturaTitulo;
  const yRegua = cursor;
  cursor += alturaRegua;
  const subTop = cursor;
  cursor += alturaSub + gapBaixo;
  const yBaseBaixo = cursor + baixo.altura;

  const blocoTitulo = linhas
    .map((linha, i) =>
      `<text x="${xTexto}" y="${titleTop + i * tamanho * 1.12 + tamanho * 0.82}" font-family="${display.familia}" font-size="${tamanho}" font-weight="${display.peso}" letter-spacing="-1.5" fill="${p.titulo}">${escapar(linha)}</text>`)
    .join("\n  ");

  const blocoSub = linhasSub
    .map((linha, i) =>
      `<text x="${xTexto}" y="${subTop + i * tamSub * 1.32 + tamSub * 0.8}" font-family="${CORPO}" font-size="${tamSub}" font-weight="500" fill="${p.apoio}">${escapar(linha)}</text>`)
    .join("\n  ");

  const blocoStat = destaque
    ? `<text x="${xTexto}" y="${statTop + 66}" font-family="${display.familia}" font-size="72" font-weight="${display.peso}" letter-spacing="-3" fill="${p.marca}">${escapar(destaque)}</text>
  <rect x="${xTexto}" y="${statTop + 78}" width="88" height="7" rx="3.5" fill="${p.apoio}" fill-opacity="0.55"/>`
    : "";

  const baixoPosicionado = baixo.svg ? `<g transform="translate(0, ${yBaseBaixo})">${baixo.svg}</g>` : "";

  return `${telefone(app, p, captura, cx, cy, pw)}
  ${blocoStat}
  ${blocoTitulo}
  <rect x="${xTexto}" y="${yRegua}" width="88" height="7" rx="3.5" fill="${p.marca}"/>
  ${blocoSub}
  ${baixoPosicionado}`;
}

// ---------------------------------------------------------------------------
// Layout vitrine — o desenho novo, calcado nas artes de referência: marca
// grande no topo, manchete com a palavra-chave colorida, lista de recursos com
// ícone próprio, pilha de celulares em perspectiva e rodapé com CTA e selos.
// ---------------------------------------------------------------------------

/**
 * Um título pode marcar a palavra-chave entre asteriscos — "Controle suas
 * calorias com *inteligência*" — e ela sai na cor da marca. Sem marcador, o
 * título inteiro fica branco, então nada quebra nos textos antigos.
 */
function segmentar(texto) {
  const partes = [];
  const re = /\*([^*]+)\*/g;
  let i = 0;
  let m;
  while ((m = re.exec(texto))) {
    if (m.index > i) partes.push({ texto: texto.slice(i, m.index), destaque: false });
    partes.push({ texto: m[1], destaque: true });
    i = m.index + m[0].length;
  }
  if (i < texto.length) partes.push({ texto: texto.slice(i), destaque: false });
  return partes.length ? partes : [{ texto, destaque: false }];
}

export const semMarcadores = (texto) => String(texto ?? "").replace(/\*/g, "");

/**
 * Avanço real de um pedaço de texto. O letter-spacing do SVG entra na conta
 * porque os segmentos são posicionados um a um: sem isso o erro acumula e a
 * palavra destacada encosta na anterior.
 */
function avanco(texto, tamanho, tipo, espaco) {
  // O espaço fica fora do tracking negativo do título: as fontes de display têm
  // espaço estreito, e encolhê-lo ainda mais colava as palavras, que aqui são
  // posicionadas uma a uma.
  if (/^\s+$/.test(texto)) return larguraTexto(texto, tamanho, tipo, 0);
  return larguraTexto(texto, tamanho, tipo, espaco);
}

/** Quebra preservando, palavra a palavra, de qual segmento cada uma veio. */
function quebrarRico(texto, larguraMax, tamanho, tipo = "display", espaco = 0) {
  const palavras = [];
  for (const seg of segmentar(texto)) {
    for (const pedaco of seg.texto.split(/(\s+)/)) {
      if (pedaco === "") continue;
      palavras.push({ texto: pedaco, destaque: seg.destaque, espaco: /^\s+$/.test(pedaco) });
    }
  }

  const linhas = [[]];
  let largura = 0;
  for (const palavra of palavras) {
    const w = avanco(palavra.texto, tamanho, tipo, espaco);
    if (palavra.espaco && !linhas.at(-1).length) continue;
    if (!palavra.espaco && largura + w > larguraMax && linhas.at(-1).length) {
      while (linhas.at(-1).length && linhas.at(-1).at(-1).espaco) linhas.at(-1).pop();
      linhas.push([]);
      largura = 0;
    }
    linhas.at(-1).push({ ...palavra, largura: w });
    largura += w;
  }
  return linhas.filter((l) => l.length);
}

/** Diminui o corpo do título até caber em `maxLinhas`, como o ajustarTitulo. */
function ajustarTituloRico(texto, larguraMax, inicial, minimo, maxLinhas, espaco) {
  let tamanho = inicial;
  let linhas = quebrarRico(texto, larguraMax, tamanho, "display", espaco);
  while (linhas.length > maxLinhas && tamanho > minimo) {
    tamanho -= 2;
    linhas = quebrarRico(texto, larguraMax, tamanho, "display", espaco);
  }
  return { tamanho, linhas };
}

function desenharRico(linhas, x, primeiraBaseline, tamanho, entrelinha, opcoes = {}) {
  const { fonte = display.familia, peso = display.peso, espaco = -2, cor = "#ffffff", corDestaque = "#ffffff" } = opcoes;
  return linhas
    .map((linha, i) => {
      let cx = x;
      const y = primeiraBaseline + i * entrelinha;
      const partes = linha.map((tk) => {
        const svg = tk.espaco
          ? ""
          : `<text x="${cx}" y="${y}" font-family="${fonte}" font-size="${tamanho}" font-weight="${peso}" letter-spacing="${espaco}" fill="${tk.destaque ? corDestaque : cor}">${escapar(tk.texto)}</text>`;
        cx += tk.largura;
        return svg;
      });
      return partes.join("");
    })
    .join("\n  ");
}

/**
 * Marca no topo. Com o selo de "100% gratuito" fora, a faixa inteira ficou para
 * a identidade: ladrilho maior, nome no maior corpo que couber e tagline com
 * entressombra própria. É o nome do app que precisa ser lido primeiro.
 */
function cabecalhoVitrine(app, p, margem, larguraMax) {
  const logo = logoBase64(app);
  const lado = 156;
  const xTexto = margem + lado + 34;
  const disponivel = larguraMax - lado - 34;
  const tagline = app.tagline ? String(app.tagline).toUpperCase() : "";

  let tamNome = 92;
  while (tamNome > 44 && larguraTexto(app.nome, tamNome, "display", -3) > disponivel) tamNome -= 2;

  const TRACKING_TAG = 3.4;
  const tamTag = 25;
  const linhasTag = tagline ? quebrar(tagline, disponivel, tamTag, "corpo", TRACKING_TAG).slice(0, 2) : [];

  // O bloco de texto é centrado na altura do ladrilho, para o nome não flutuar
  // acima do logo quando a tagline ocupa só uma linha.
  const alturaTexto = tamNome * 0.74 + (linhasTag.length ? 18 + linhasTag.length * 30 : 0);
  const topoTexto = margem + (lado - alturaTexto) / 2;
  const baseNome = topoTexto + tamNome * 0.74;

  const blocoTag = linhasTag
    .map((linha, i) =>
      `<text x="${xTexto}" y="${baseNome + 18 + 22 + i * 30}" font-family="${CORPO}" font-size="${tamTag}" font-weight="500" letter-spacing="${TRACKING_TAG}" fill="${p.apoio}" fill-opacity="0.88">${escapar(linha)}</text>`)
    .join("\n    ");

  // Nem todo logo do PWA vem com transparência — o do GASONOL e o do Vai dar
  // quanto? são PNG opaco. Recortar em canto arredondado faz o quadrado sólido
  // ler como ladrilho de ícone de app em vez de caixa preta solta no card.
  return `
  <g>
    <defs>
      <clipPath id="logo-${app.id}">
        <rect x="${margem}" y="${margem}" width="${lado}" height="${lado}" rx="36"/>
      </clipPath>
      <linearGradient id="brilho-logo" x1="0" y1="0" x2="0.4" y2="1">
        <stop offset="0" stop-color="#ffffff" stop-opacity="0.20"/>
        <stop offset="0.5" stop-color="#ffffff" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <rect x="${margem + 6}" y="${margem + 12}" width="${lado}" height="${lado}" rx="36" fill="#000000" fill-opacity="0.30"/>
    <image href="${logo}" x="${margem}" y="${margem}" width="${lado}" height="${lado}" preserveAspectRatio="xMidYMid meet" clip-path="url(#logo-${app.id})"/>
    <rect x="${margem}" y="${margem}" width="${lado}" height="${lado}" rx="36" fill="url(#brilho-logo)"/>
    <rect x="${margem + 0.75}" y="${margem + 0.75}" width="${lado - 1.5}" height="${lado - 1.5}" rx="35" fill="none" stroke="#ffffff" stroke-opacity="0.16" stroke-width="1.5"/>
    <text x="${xTexto}" y="${baseNome}" font-family="${display.familia}" font-size="${tamNome}" font-weight="${display.peso}" letter-spacing="-3" fill="${p.titulo}">${escapar(app.nome)}</text>
    ${blocoTag}
  </g>`;
}

const ALTURA_CABECALHO = 156;

/**
 * Dois aparelhos sobrepostos e levemente girados. O de trás é menor, sem brilho
 * e com sombra fraca — é o que cria profundidade sem competir com o da frente.
 */
// Arranjos da pilha, escolhidos pela variação do slot (0, 1, 2) — o mesmo
// índice que já decide qual captura entra. Sem isso, os 40 cards repetiam a
// mesma composição de aparelhos e o feed ficava monótono.
//
// `meiaCaixa` é a metade da largura do aparelho já com moldura e giro (0,53 da
// largura da tela). É o que permite medir a caixa da pilha antes de desenhar.
const MEIA_CAIXA = 0.53;

const ARRANJOS = [
  // dois aparelhos, o de trás subindo à direita
  { dois: true, escala: 0.78, desvioX: 0.44, desvioY: -0.20, giroFrente: -3, giroFundo: 9 },
  // um só, maior e quase reto — dá respiro entre os cards com dois
  { dois: false, escala: 1, desvioX: 0, desvioY: 0, giroFrente: -2, giroFundo: 0 },
  // dois aparelhos, o de trás descendo à direita
  { dois: true, escala: 0.76, desvioX: 0.42, desvioY: 0.22, giroFrente: 3, giroFundo: -8 },
];

const arranjoDaVez = (variacao, temDois) => {
  const a = ARRANJOS[((variacao ?? 0) % ARRANJOS.length + ARRANJOS.length) % ARRANJOS.length];
  return a.dois && !temDois ? ARRANJOS[1] : a;
};

/** Largura da caixa da pilha, em múltiplos da largura do aparelho da frente. */
const larguraDaPilha = (a) =>
  a.dois ? MEIA_CAIXA + a.desvioX + a.escala * MEIA_CAIXA : MEIA_CAIXA * 2;

/** Altura da caixa da pilha, em múltiplos da ALTURA do aparelho da frente. */
const alturaDaPilha = (a) =>
  a.dois ? Math.max(1, 0.5 + Math.abs(a.desvioY) / ASPECTO_TELA + a.escala * 0.5) : 1;

/** Deslocamento do centro da caixa em relação ao centro do aparelho da frente. */
const centroDaPilha = (a) =>
  a.dois ? (a.desvioX + a.escala * MEIA_CAIXA - MEIA_CAIXA) / 2 : 0;

function pilhaTelefones(app, p, capturas, cx, cy, largura, a) {
  if (!capturas.length) return "";

  const fundo =
    a.dois && capturas[1]
      ? telefone(app, p, capturas[1], cx + largura * a.desvioX, cy + largura * a.desvioY, Math.round(largura * a.escala), {
          sufixo: "-b",
          rotacao: a.giroFundo,
          sombra: 0.55,
          brilho: 0,
        })
      : "";

  const frente = telefone(app, p, capturas[0], cx, cy, largura, { sufixo: "-a", rotacao: a.giroFrente });
  return `${fundo}\n  ${frente}`;
}

const ALTURA_ITEM_BASE = 30;

/** Mede a lista de recursos sem desenhar — o layout precisa da altura antes. */
function medirRecursos(lista, largura, tamTitulo, tamDesc) {
  return lista.map((item) => {
    const linhas = item.descricao ? quebrar(item.descricao, largura - 92, tamDesc, "corpo").slice(0, 2).length : 0;
    return (item.titulo ? tamTitulo * 1.18 : 0) + linhas * tamDesc * 1.3 + ALTURA_ITEM_BASE;
  });
}

/** Recurso = círculo colorido com ícone branco + título em caixa alta + descrição. */
function listaRecursos(p, x, y, largura, lista, tamTitulo, tamDesc) {
  let cursor = y;
  return lista
    .map((item, i) => {
      const cor = p.acentos[i % p.acentos.length];
      const linhasDesc = item.descricao
        ? quebrar(item.descricao, largura - 92, tamDesc, "corpo").slice(0, 2)
        : [];
      const r = 30;
      const topo = cursor;
      const cyIcone = topo + r;

      const titulo = item.titulo
        ? `<text x="92" y="${r + tamTitulo * 0.36}" font-family="${display.familia}" font-size="${tamTitulo}" font-weight="${display.peso}" letter-spacing="0.2" fill="${p.titulo}">${escapar(String(item.titulo).toUpperCase())}</text>`
        : "";
      const yDesc = (item.titulo ? r + tamTitulo * 0.36 + tamDesc * 1.24 : r + tamDesc * 0.34);
      const desc = linhasDesc
        .map((linha, j) =>
          `<text x="92" y="${yDesc + j * tamDesc * 1.3}" font-family="${CORPO}" font-size="${tamDesc}" font-weight="400" fill="${p.apoio}">${escapar(linha)}</text>`)
        .join("\n      ");

      // Disco com degradê e aro claro no lugar do preenchimento chapado: é o
      // que faz o ícone parecer botão em relevo, e não adesivo colado.
      const g = `<g transform="translate(${x}, ${topo})">
      <defs>
        <linearGradient id="ac-${i}" x1="0" y1="0" x2="0.5" y2="1">
          <stop offset="0" stop-color="${clarear(cor, 0.26)}"/>
          <stop offset="1" stop-color="${escurecer(cor, 0.16)}"/>
        </linearGradient>
      </defs>
      <circle cx="${r}" cy="${r}" r="${r + 8}" fill="${cor}" fill-opacity="0.14"/>
      <circle cx="${r}" cy="${r + 2}" r="${r}" fill="#000000" fill-opacity="0.28"/>
      <circle cx="${r}" cy="${r}" r="${r}" fill="url(#ac-${i})"/>
      <circle cx="${r}" cy="${r}" r="${r - 0.8}" fill="none" stroke="#ffffff" stroke-opacity="0.22" stroke-width="1.6"/>
      ${icone(item.icone, { x: r - 17, y: r - 17, tamanho: 34, cor: "#ffffff", peso: 2 })}
      ${titulo}
      ${desc}
    </g>`;

      cursor += (item.titulo ? tamTitulo * 1.18 : 0) + linhasDesc.length * tamDesc * 1.3 + ALTURA_ITEM_BASE;
      void cyIcone;
      return g;
    })
    .join("\n  ");
}

const ALTURA_RODAPE_VITRINE = 108;

/** Rodapé: CTA com o domínio à esquerda e os selos do app à direita. */
function rodapeVitrine(app, p, L, A, margem) {
  const dominio = new URL(app.url).host.replace(/^www\./, "");
  const y = A - margem - ALTURA_RODAPE_VITRINE;
  const util = L - margem * 2;
  const selos = (app.selos ?? []).slice(0, 3);

  const larguraCta = selos.length ? Math.round(util * 0.5) : util;
  const raio = ALTURA_RODAPE_VITRINE / 2;
  const tamDominio = (() => {
    // 96 do ícone à esquerda + 96 da seta à direita, e 16 de folga.
    let t = 42;
    while (t > 24 && larguraTexto(dominio, t, "corpo") > larguraCta - 208) t -= 2;
    return t;
  })();

  const blocoSelos = selos
    .map((selo, i) => {
      const larguraColuna = (util - larguraCta - 28) / selos.length;
      const cx = margem + larguraCta + 28 + larguraColuna * i + larguraColuna / 2;
      const linhas = quebrar(String(selo.titulo).toUpperCase(), larguraColuna - 8, 18, "corpo").slice(0, 2);
      const texto = linhas
        .map((linha, j) =>
          `<text x="${cx}" y="${y + 74 + j * 22}" text-anchor="middle" font-family="${CORPO}" font-size="18" font-weight="600" letter-spacing="1.2" fill="${p.apoio}">${escapar(linha)}</text>`)
        .join("");
      return `${icone(selo.icone, { x: cx - 16, y: y + 16, tamanho: 32, cor: p.marca, peso: 2 })}${texto}`;
    })
    .join("\n  ");

  return `
  <g>
    <defs>
      <linearGradient id="cta" x1="0" y1="0" x2="1" y2="0.6">
        <stop offset="0" stop-color="${p.marca}"/>
        <stop offset="1" stop-color="${escurecer(misturar(p.marca, p.acentos[0], 0.35), 0.12)}"/>
      </linearGradient>
    </defs>
    <rect x="${margem}" y="${y}" width="${larguraCta}" height="${ALTURA_RODAPE_VITRINE}" rx="${raio}" fill="url(#cta)"/>
    ${icone("globo", { x: margem + 40, y: y + raio - 18, tamanho: 36, cor: "#ffffff", peso: 1.8 })}
    <text x="${margem + 96}" y="${y + raio + tamDominio * 0.36}" font-family="${CORPO}" font-size="${tamDominio}" font-weight="600" fill="#ffffff">${escapar(dominio)}</text>
    <g transform="translate(${margem + larguraCta - 74}, ${y + raio - 22})">
      <circle cx="22" cy="22" r="22" fill="#ffffff" fill-opacity="0.2"/>
      <path d="M15 22h14M23 16l6 6-6 6" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
    ${blocoSelos}
  </g>`;
}

function layoutVitrine(contexto, capturas, variacao = 0) {
  const { app, p, L, A, margem, titulo, sub, destaque } = contexto;
  const util = L - margem * 2;
  const recursos = normalizarRecursos(contexto.recursos);

  const topo = margem + ALTURA_CABECALHO + 56;
  const base = A - margem - ALTURA_RODAPE_VITRINE - 56;
  const alturaRegiao = base - topo;

  const colunaTexto = Math.round(util * 0.54);
  const gap = 40;
  const colunaFone = L - margem - colunaTexto - gap - 24;

  // O número em destaque vira o primeiro elemento da coluna, acima da manchete
  // — é ele que carrega a cor quando o post é de dado ("3,38%", "8/8h").
  const tamDestaque = destaque ? 86 : 0;
  const alturaDestaque = destaque ? tamDestaque * 0.92 : 0;

  const espacoTitulo = display.tracking;
  const tamSub = 27;
  const linhasSub = sub ? quebrar(semMarcadores(sub), colunaTexto, tamSub, "corpo").slice(0, 2) : [];
  const alturaSub = linhasSub.length ? linhasSub.length * tamSub * 1.3 + 22 : 0;

  const tamTituloItem = 26;
  const tamDescItem = 25;
  const somaLista = (l) => medirRecursos(l, colunaTexto, tamTituloItem, tamDescItem).reduce((s, h) => s + h, 0);

  // Quem cede é o título, não a lista. Os quatro recursos são a identidade do
  // app e aparecem em todo card; o corpo da manchete pode encolher de 78 até 42
  // para abrir espaço. Só quando nem no menor corpo cabe é que um recurso sai —
  // antes era o contrário, e quase todo card saía com três.
  const tamMaximo = destaque ? 62 : 78;
  let lista = recursos.slice(0, 4);
  let tamanho = null;
  let linhas = null;

  for (;;) {
    const orcamento = alturaRegiao - somaLista(lista) - 46 - alturaDestaque - alturaSub;
    for (let t = tamMaximo; t >= 42; t -= 2) {
      const candidatas = quebrarRico(titulo, colunaTexto, t, "display", espacoTitulo);
      if (candidatas.length <= 4 && candidatas.length * t * 1.08 <= orcamento) {
        tamanho = t;
        linhas = candidatas;
        break;
      }
    }
    if (linhas || lista.length <= 2) break;
    lista = lista.slice(0, -1);
  }

  if (!linhas) {
    // Título muito longo para qualquer combinação: cai no ajuste antigo e
    // aceita passar do orçamento, que é melhor do que não desenhar o título.
    ({ tamanho, linhas } = ajustarTituloRico(titulo, colunaTexto, tamMaximo, 42, 4, espacoTitulo));
  }

  const entrelinha = tamanho * 1.08;
  const alturaTitulo = linhas.length * entrelinha;
  const alturaLista = somaLista(lista);
  const alturaBloco = alturaDestaque + alturaTitulo + alturaSub + 46 + alturaLista;
  const yTexto = topo + Math.max(0, (alturaRegiao - alturaBloco) / 2);

  const blocoDestaque = destaque
    ? `<text x="${margem}" y="${yTexto + tamDestaque * 0.74}" font-family="${display.familia}" font-size="${tamDestaque}" font-weight="${display.peso}" letter-spacing="-4" fill="${p.marca}">${escapar(destaque)}</text>`
    : "";

  const yTitulo = yTexto + alturaDestaque;
  const blocoTitulo = desenharRico(linhas, margem, yTitulo + tamanho * 0.82, tamanho, entrelinha, {
    espaco: espacoTitulo,
    cor: p.titulo,
    corDestaque: p.marca,
  });

  const ySub = yTitulo + alturaTitulo + 14;
  const blocoSub = linhasSub
    .map((linha, i) =>
      `<text x="${margem}" y="${ySub + i * tamSub * 1.3 + tamSub * 0.8}" font-family="${CORPO}" font-size="${tamSub}" font-weight="400" fill="${p.apoio}">${escapar(linha)}</text>`)
    .join("\n  ");

  const yLista = yTitulo + alturaTitulo + alturaSub + 46;
  const blocoLista = listaRecursos(p, margem, yLista, colunaTexto, lista, tamTituloItem, tamDescItem);

  // Celulares: centralizados na coluna da direita, com folga para o giro.
  // A pilha cabe inteira dentro da margem direita — nada de sangrar na borda,
  // que era o que fazia o aparelho parecer cortado pelo card. Os dois limites
  // valem ao mesmo tempo: a faixa livre à direita e a altura da região.
  const arranjo = arranjoDaVez(variacao, capturas.length > 1);
  const faixaX = L - margem - (margem + colunaTexto + gap);
  const larguraFone = Math.floor(
    Math.min(
      faixaX / larguraDaPilha(arranjo),
      (alturaRegiao * 0.94) / (ASPECTO_TELA * alturaDaPilha(arranjo))));
  // Centraliza a caixa da pilha na faixa, e não o aparelho da frente.
  const centroFaixa = margem + colunaTexto + gap + faixaX / 2;
  const cxFone = Math.round(centroFaixa - centroDaPilha(arranjo) * larguraFone);
  const cyFone = topo + alturaRegiao / 2 - (larguraFone * arranjo.desvioY) / 2;

  return `${pilhaTelefones(app, p, capturas, cxFone, cyFone, larguraFone, arranjo)}
  ${blocoDestaque}
  ${blocoTitulo}
  ${blocoSub}
  ${blocoLista}`;
}

export function montarSvg({ app, post, formato = "feed", variacao = 0, lado = 0 }) {
  usarDisplay(app.fonte);
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

  // Vitrine é o desenho padrão: só exige captura e recursos, que todo app tem.
  // Os layouts antigos continuam atendendo os casos em que falta material —
  // captura quebrada, tema sem recurso, card de número puro.
  const usaVitrine = captura && contexto.recursos.length && card.layout !== "classico";

  if (usaVitrine) {
    const capturas = capturasBase64(app, variacao, 2);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${L}" height="${A}" viewBox="0 0 ${L} ${A}">
  ${fundo(L, A, p)}
  ${cabecalhoVitrine(app, p, margem, L - margem * 2)}
  ${layoutVitrine(contexto, capturas, variacao)}
  ${rodapeVitrine(app, p, L, A, margem)}
</svg>`;
  }

  let corpo;
  if (captura) {
    corpo = layoutHero(contexto, captura, lado);
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
export async function gerarCard({ app, post, formato = "feed", nome, titulo, sub, variacao = 0, lado = 0 }) {
  const { Resvg } = await import("@resvg/resvg-js");
  const postFinal = post ?? { card: { titulo, sub } };
  const svg = montarSvg({ app, post: postFinal, formato, variacao, lado });

  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: FORMATOS[formato]?.largura ?? 1080 },
    font: {
      // Lista o diretório em vez de enumerar: cada app traz a sua display, e
      // esquecer um arquivo aqui não daria erro — cairia calado no fallback.
      fontFiles: readdirSync(FONTES)
        .filter((f) => /\.(ttf|otf)$/i.test(f))
        .map((f) => `${FONTES}/${f}`),
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
