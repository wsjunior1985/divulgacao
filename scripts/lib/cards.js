// cards.js — desenha o card do post em SVG e rasteriza com sharp.
//
// Por que JPEG e não WebP: Instagram e Threads só aceitam JPEG (e PNG em alguns
// casos) na publicação por URL. WebP fica para os assets dos sites.
//
// Por que sem emoji dentro do card: o runner do GitHub Actions não tem fonte de
// emoji colorido garantida, e um quadrado vazio no card é pior que nenhum ícone.
// Os emojis ficam só no texto do post, que é renderizado pelo app de cada rede.

import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { RAIZ } from "./base.js";

const FONTE = "DejaVu Sans, Helvetica Neue, Helvetica, Arial, sans-serif";

/** Formatos: retrato para o feed, vertical para o TikTok. */
export const FORMATOS = {
  feed: { largura: 1080, altura: 1350 },
  vertical: { largura: 1080, altura: 1920 },
};

function escapar(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Quebra o texto em linhas que caibam na largura, medindo por largura média do glifo. */
function quebrar(texto, larguraDisponivel, tamanhoFonte, fatorGlifo = 0.54) {
  const maxChars = Math.max(8, Math.floor(larguraDisponivel / (tamanhoFonte * fatorGlifo)));
  const linhas = [];
  let atual = "";
  for (const palavra of texto.split(/\s+/)) {
    const candidata = atual ? `${atual} ${palavra}` : palavra;
    if (candidata.length <= maxChars) {
      atual = candidata;
    } else {
      if (atual) linhas.push(atual);
      atual = palavra;
    }
  }
  if (atual) linhas.push(atual);
  return linhas;
}

export function montarSvg({ app, titulo, sub, formato = "feed" }) {
  const { largura: L, altura: A } = FORMATOS[formato] ?? FORMATOS.feed;
  const m = app.marca;
  const margem = Math.round(L * 0.085);
  const util = L - margem * 2;

  // O título encolhe se for longo, para nunca estourar o card.
  let tamTitulo = formato === "vertical" ? 92 : 84;
  let linhasTitulo = quebrar(titulo, util, tamTitulo);
  while (linhasTitulo.length > 4 && tamTitulo > 52) {
    tamTitulo -= 6;
    linhasTitulo = quebrar(titulo, util, tamTitulo);
  }
  const tamSub = Math.round(tamTitulo * 0.52);
  const linhasSub = quebrar(sub, util, tamSub);

  const alturaTitulo = linhasTitulo.length * (tamTitulo * 1.18);
  const alturaSub = linhasSub.length * (tamSub * 1.3);
  const topo = (A - (alturaTitulo + alturaSub + 60)) / 2 + tamTitulo;

  const blocoTitulo = linhasTitulo
    .map(
      (linha, i) =>
        `<text x="${L / 2}" y="${topo + i * tamTitulo * 1.18}" text-anchor="middle" font-family="${FONTE}" font-size="${tamTitulo}" font-weight="bold" fill="${m.texto}">${escapar(linha)}</text>`,
    )
    .join("\n  ");

  const inicioSub = topo + alturaTitulo + 40;
  const blocoSub = linhasSub
    .map(
      (linha, i) =>
        `<text x="${L / 2}" y="${inicioSub + i * tamSub * 1.3}" text-anchor="middle" font-family="${FONTE}" font-size="${tamSub}" font-weight="normal" fill="${m.apoio}">${escapar(linha)}</text>`,
    )
    .join("\n  ");

  const dominio = new URL(app.url).host.replace(/^www\./, "");
  const larguraBotao = Math.max(420, dominio.length * 26 + 120);
  const yBotao = A - Math.round(A * 0.11);
  const inicial = escapar(app.nome.trim()[0].toUpperCase());

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${L}" height="${A}" viewBox="0 0 ${L} ${A}">
  <defs>
    <linearGradient id="fundo" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${m.fundoA}"/>
      <stop offset="1" stop-color="${m.fundoB}"/>
    </linearGradient>
    <radialGradient id="brilho" cx="0.85" cy="0.1" r="0.7">
      <stop offset="0" stop-color="${m.destaque}" stop-opacity="0.26"/>
      <stop offset="1" stop-color="${m.destaque}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${L}" height="${A}" fill="url(#fundo)"/>
  <rect width="${L}" height="${A}" fill="url(#brilho)"/>
  <rect x="0" y="0" width="${L}" height="12" fill="${m.destaque}"/>
  <circle cx="${margem + 30}" cy="${margem + 26}" r="34" fill="${m.destaque}"/>
  <text x="${margem + 30}" y="${margem + 40}" text-anchor="middle" font-family="${FONTE}" font-size="38" font-weight="bold" fill="${m.fundoA}">${inicial}</text>
  <text x="${margem + 86}" y="${margem + 40}" font-family="${FONTE}" font-size="44" font-weight="bold" fill="${m.texto}">${escapar(app.nome)}</text>
  ${blocoTitulo}
  ${blocoSub}
  <rect x="${(L - larguraBotao) / 2}" y="${yBotao}" width="${larguraBotao}" height="84" rx="42" fill="${m.destaque}"/>
  <text x="${L / 2}" y="${yBotao + 56}" text-anchor="middle" font-family="${FONTE}" font-size="36" font-weight="bold" fill="${m.fundoA}">${escapar(dominio)}</text>
</svg>`;
}

/** Rasteriza o card. Devolve o caminho relativo do JPEG gerado. */
export async function gerarCard({ app, titulo, sub, formato = "feed", nome }) {
  const { default: sharp } = await import("sharp");
  const svg = montarSvg({ app, titulo, sub, formato });
  const buffer = await sharp(Buffer.from(svg))
    .jpeg({ quality: 88, chromaSubsampling: "4:4:4" })
    .toBuffer();

  const relativo = `assets/cards/${nome}.jpg`;
  const caminho = resolve(RAIZ, relativo);
  mkdirSync(resolve(RAIZ, "assets/cards"), { recursive: true });
  writeFileSync(caminho, buffer);
  return { relativo, caminho, bytes: buffer.length };
}
