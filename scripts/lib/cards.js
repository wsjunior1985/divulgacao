// cards.js — desenha o card do post no padrão premium.
//
// O card é uma página HTML/CSS renderizada no Chromium (Playwright) e salva em
// JPEG. Cada app pode ter o próprio layout, feito a partir da referência visual
// aprovada (`visual.layout` em apps/<app>.json → scripts/lib/cards/<layout>.js);
// sem ele, vale a vitrine, o layout aprovado no GASONOL. As peças comuns (fontes
// locais, celular 3D com tela real, luz de fundo) ficam em cards/comum.js.
//
// Conteúdo por tema vem do bloco `premium` de cada post; sem ele, o card é
// derivado do `card` e dos `recursos` do app — nenhum tema fica sem card.

import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { RAIZ } from "./base.js";
import { vitrine } from "./cards/vitrine.js";
import { aieat } from "./cards/aieat.js";
import { convertendo } from "./cards/convertendo.js";
import { vaidarquanto } from "./cards/vaidarquanto.js";
import { remedin } from "./cards/remedin.js";

export { semMarcadores } from "./cards/comum.js";

export const FORMATOS = {
  feed: { largura: 1080, altura: 1350 },
  vertical: { largura: 1080, altura: 1920 },
};

const LAYOUTS = { vitrine, aieat, convertendo, vaidarquanto, remedin };

export function montarHtml({ app, post, formato = "feed", variacao = 0 }) {
  const { largura: L, altura: A } = FORMATOS[formato] ?? FORMATOS.feed;
  const layout = LAYOUTS[app.visual?.layout] ?? vitrine;
  return layout({ app, post, formato, L, A, variacao });
}

/**
 * Gera o card do post e salva em assets/cards/<nome>.jpg.
 *
 * @param {string} formato - "feed" (1080×1350) ou "vertical" (1080×1920)
 * @param {number} variacao - qual captura automática usar quando o tema não escolhe tela
 * @returns {Promise<{relativo, caminho, bytes}>}
 */
export async function gerarCard({ app, post, formato = "feed", nome, titulo, sub, variacao = 0 }) {
  const { chromium } = await import("playwright");
  const { default: sharp } = await import("sharp");
  const postFinal = post ?? { id: nome, card: { titulo, sub } };
  const { largura, altura } = FORMATOS[formato] ?? FORMATOS.feed;

  const temporario = resolve(RAIZ, "assets/tmp");
  mkdirSync(temporario, { recursive: true });
  const pagina = resolve(temporario, `${nome}.html`);
  writeFileSync(pagina, montarHtml({ app, post: postFinal, formato, variacao }));

  // Renderiza em 2x e reduz: o antialias do texto e dos traços sai mais limpo que em 1x.
  const navegador = await chromium.launch();
  try {
    const aba = await navegador.newPage({ viewport: { width: largura, height: altura }, deviceScaleFactor: 2 });
    await aba.goto(pathToFileURL(pagina).href, { waitUntil: "load" });
    await aba.waitForFunction(() => window.__pronto === true, null, { timeout: 15000 });
    const png = await aba.screenshot({ type: "png" });
    const buffer = await sharp(png).resize(largura, altura).jpeg({ quality: 92, chromaSubsampling: "4:4:4" }).toBuffer();

    const relativo = `assets/cards/${nome}.jpg`;
    mkdirSync(resolve(RAIZ, "assets/cards"), { recursive: true });
    writeFileSync(resolve(RAIZ, relativo), buffer);
    return { relativo, caminho: resolve(RAIZ, relativo), bytes: buffer.length };
  } finally {
    await navegador.close();
    rmSync(pagina, { force: true });
  }
}
