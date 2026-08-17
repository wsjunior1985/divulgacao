// conteudo.js — monta o post de cada canal a partir do perfil do app.
//
// A agenda é DETERMINÍSTICA: dado um índice de slot, sempre sai o mesmo app e o
// mesmo tema. Isso significa que nunca falta conteúdo (o rodízio recomeça
// sozinho) e que o dry-run mostra exatamente o que o cron vai publicar.

import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import { RAIZ, lerJson } from "./base.js";

/** Ordem fixa do rodízio — muda a ordem só se mudar esta lista. */
export const ORDEM_APPS = ["vaidarquanto", "aieat", "gasonol", "convertendo", "remedin"];

/** Época do rodízio: slot 0. Não mexa depois de publicar, ou o rodízio pula temas. */
const EPOCA = Date.UTC(2026, 7, 1); // 2026-08-01

export function carregarApps() {
  const arquivos = readdirSync(resolve(RAIZ, "apps")).filter((f) => f.endsWith(".json"));
  const porId = new Map();
  for (const arquivo of arquivos) {
    const perfil = lerJson(`apps/${arquivo}`);
    if (!perfil.id || !perfil.posts?.length) throw new Error(`perfil inválido: apps/${arquivo}`);
    porId.set(perfil.id, perfil);
  }
  const faltando = ORDEM_APPS.filter((id) => !porId.has(id));
  if (faltando.length) throw new Error(`perfis ausentes em apps/: ${faltando.join(", ")}`);
  return ORDEM_APPS.map((id) => porId.get(id));
}

/**
 * Índice do slot a partir da data e da posição do horário no dia.
 * Ex.: 2 horários/dia → o slot da tarde do dia D é D*2+1.
 */
export function indiceDoSlot(dia, posicaoNoDia, horariosPorDia) {
  const [ano, mes, d] = dia.split("-").map(Number);
  const dias = Math.round((Date.UTC(ano, mes - 1, d) - EPOCA) / 86400000);
  return dias * horariosPorDia + posicaoNoDia;
}

/**
 * Escolhe app e tema do slot. O app gira a cada slot; o tema só avança quando o
 * rodízio de apps fecha uma volta — assim nenhum app repete tema antes da hora.
 */
export function escolherPauta(indice, apps) {
  const total = apps.length;
  // Índices negativos (datas antes da época) precisam de módulo positivo.
  const i = ((indice % total) + total) % total;
  const volta = Math.floor(indice / total);
  const app = apps[i];
  const voltaPositiva = ((volta % app.posts.length) + app.posts.length) % app.posts.length;
  return { app, post: app.posts[voltaPositiva], indice };
}

/** Link do app com UTM do canal — é o que separa um canal do outro no funil. */
export function linkComUtm(app, canal, campanha = "alwayson") {
  const url = new URL(app.url);
  url.searchParams.set("utm_source", canal);
  url.searchParams.set("utm_medium", "social");
  url.searchParams.set("utm_campaign", campanha);
  return url.toString();
}

function hashtags(app, post) {
  const tags = post.hashtags ?? app.hashtags ?? [];
  return tags.join(" ");
}

/** Corta preservando palavra inteira e sem deixar pontuação órfã. */
function cortar(texto, limite) {
  if (texto.length <= limite) return texto;
  const corte = texto.slice(0, limite - 1);
  const espaco = corte.lastIndexOf(" ");
  return `${(espaco > limite * 0.6 ? corte.slice(0, espaco) : corte).replace(/[\s.,;:—-]+$/, "")}…`;
}

/**
 * Corta o CORPO e reanexa o link inteiro. Cortar o texto já montado poderia
 * decepar a URL no meio e matar o clique — que é a única coisa que o post
 * precisa entregar.
 */
function cortarPreservandoLink(modelo, link, limite) {
  const completo = modelo.replaceAll("{link}", link);
  if (!modelo.includes("{link}")) return cortar(completo, limite);
  if (completo.length <= limite) return completo;
  const [antes, depois = ""] = modelo.split("{link}");
  const sobra = limite - link.length - depois.length - 1;
  return `${cortar(antes.trim(), Math.max(20, sobra))} ${link}${depois}`.trim();
}

/**
 * Texto final por canal. Cada rede tem limite e etiqueta própria:
 *  - instagram: legenda longa + hashtags (link não é clicável, mas informa)
 *  - facebook:  legenda longa, link vira preview
 *  - threads:   500 caracteres, link vai como anexo (link_attachment)
 *  - bluesky:   300 caracteres — usa a versão curta do template
 *  - tiktok:    título do post em modo foto, hashtags ajudam a distribuição
 */
export function montarTexto({ app, post, canal, campanha }) {
  const link = linkComUtm(app, canal, campanha);
  const tags = hashtags(app, post);
  const base = post.texto.replaceAll("{link}", link);
  const curto = (post.curto ?? post.texto).replaceAll("{link}", link);

  switch (canal) {
    case "instagram":
      return { texto: cortar(`${base}\n\n${tags}`, 2200), link };
    case "facebook":
      return { texto: cortar(base, 5000), link };
    case "threads":
      // O link vai no CORPO, não em link_attachment: a Threads API só aceita
      // link_attachment em post de texto puro, e os nossos sempre levam card.
      return { texto: cortarPreservandoLink(post.texto, link, 500), link };
    case "bluesky":
      return { texto: cortarPreservandoLink(post.curto ?? post.texto, link, 300), link };
    case "x":
      // 280 é o limite da conta gratuita. O X conta qualquer URL como 23
      // caracteres, mas cortar pelo tamanho real só deixa margem — nunca falta.
      return { texto: cortarPreservandoLink(post.curto ?? post.texto, link, 280), link };
    case "tiktok":
      return { texto: cortar(`${curto}\n\n${tags}`, 2200), link };
    default:
      throw new Error(`canal sem formatação definida: ${canal}`);
  }
}

/** Identificador estável do slot — é a chave do estado anti-duplicata. */
export function idDoPost({ app, post, indice }) {
  return `${indice}-${app.id}-${post.id}`;
}
