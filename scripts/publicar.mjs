#!/usr/bin/env node
// publicar.mjs — publica o post do slot atual em todos os canais habilitados.
//
//   node scripts/publicar.mjs --dry-run          mostra o que sairia, sem enviar
//   node scripts/publicar.mjs                    publica o slot de agora
//   node scripts/publicar.mjs --slot 3           publica um slot específico
//   node scripts/publicar.mjs --canais bluesky   restringe os canais
//   node scripts/publicar.mjs --forcar           republica um slot já publicado
//
// A falha de um canal não derruba os outros: o resumo do fim diz o que saiu, o
// que foi pulado e o que quebrou, e o processo só sai com erro se TODOS falharem.

import { carregarEnv, canaisHabilitados, lerJson, gravarJson, agoraBRT, log, ok, aviso, erro, env } from "./lib/base.js";
import { carregarApps, escolherPauta, indiceDoSlot, montarTexto, idDoPost } from "./lib/conteudo.js";
import { gerarCard, semMarcadores } from "./lib/cards.js";
import { publicarMidia } from "./lib/midia.js";
import * as meta from "./canais/meta.js";
import * as threads from "./canais/threads.js";
import * as bluesky from "./canais/bluesky.js";
import * as tiktok from "./canais/tiktok.js";
import * as buffer from "./canais/buffer.js";

carregarEnv();

// "x" não fala com a API do X (que é paga): sai pelo Buffer, que publica de graça.
const CANAIS = ["instagram", "facebook", "threads", "bluesky", "tiktok", "x"];
const ARQUIVO_ESTADO = "estado/publicados.json";

/** Horários do dia, em hora cheia BRT. O cron do Actions dispara nesses horários. */
const HORARIOS = env("HORARIOS", "08,11,14,17,20,21")
  .split(",")
  .map((h) => Number(h.trim()))
  .filter((h) => Number.isInteger(h) && h >= 0 && h < 24);

function argumentos(argv) {
  const args = { dryRun: false, forcar: false, slot: null, canais: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") args.dryRun = true;
    else if (a === "--forcar" || a === "--force") args.forcar = true;
    else if (a === "--slot") args.slot = Number(argv[++i]);
    else if (a === "--canais") args.canais = argv[++i].split(",").map((c) => c.trim());
    else throw new Error(`argumento desconhecido: ${a}`);
  }
  return args;
}

/** Descobre qual slot corresponde a agora: o horário programado mais próximo já passado. */
function slotDeAgora() {
  const { dia, hora } = agoraBRT();
  const ordenados = [...HORARIOS].sort((a, b) => a - b);
  let posicao = ordenados.findIndex((h, i) => hora >= h && (i === ordenados.length - 1 || hora < ordenados[i + 1]));
  if (posicao === -1) posicao = 0; // antes do primeiro horário do dia: usa o primeiro
  return { indice: indiceDoSlot(dia, posicao, ordenados.length), dia, horario: ordenados[posicao] };
}

async function publicarCanal(canal, { textoPorCanal, urlsCard, cardFeed, cardVertical, app, post, dryRun }) {
  const { texto, link, linkLimpo } = textoPorCanal[canal];

  if (dryRun) {
    log(`— ${canal} —\n${texto}\n`);
    return { canal, status: "dry-run" };
  }

  switch (canal) {
    case "instagram":
    case "facebook":
      return { canal, status: "ok", ...(await meta.publicar({ canal, texto, imagens: [urlsCard.feed], link })) };
    case "threads":
      return { canal, status: "ok", ...(await threads.publicar({ texto, imagens: [urlsCard.feed], link })) };
    case "bluesky":
      return {
        canal,
        status: "ok",
        ...(await bluesky.publicar({
          texto,
          imagensLocais: [cardFeed.relativo],
          alt: `${app.nome}: ${semMarcadores(post.card.titulo)}`,
          link,
          linkLimpo,
        })),
      };
    case "tiktok":
      return { canal, status: "ok", ...(await tiktok.publicar({ texto, imagens: [urlsCard.vertical], link })) };
    case "x":
      return {
        canal,
        status: "ok",
        ...(await buffer.publicar({ texto, imagens: [urlsCard.feed], servicos: ["twitter"] })),
      };
    default:
      throw new Error(`canal sem adapter: ${canal}`);
  }
}

function prontidao(canal) {
  if (canal === "instagram" || canal === "facebook") return meta.pronto(canal);
  if (canal === "threads") return threads.pronto();
  if (canal === "bluesky") return bluesky.pronto();
  if (canal === "tiktok") return tiktok.pronto();
  if (canal === "x") return buffer.pronto();
  return { ok: false, motivo: "canal desconhecido" };
}

async function main() {
  const args = argumentos(process.argv.slice(2));
  const apps = carregarApps();

  const slot = args.slot !== null ? { indice: args.slot, dia: agoraBRT().dia } : slotDeAgora();
  const pauta = escolherPauta(slot.indice, apps);
  const { app, post, ciclo } = pauta;
  const identificador = idDoPost(pauta);

  const estado = lerJson(ARQUIVO_ESTADO, { posts: {} });
  const jaFeito = estado.posts[identificador] ?? {};

  const solicitados = args.canais ?? canaisHabilitados(CANAIS);
  const alvos = [];
  for (const canal of solicitados) {
    if (!CANAIS.includes(canal)) throw new Error(`canal desconhecido: ${canal}`);
    if (jaFeito[canal]?.status === "ok" && !args.forcar) {
      log(`${canal}: já publicado neste slot — pulando (use --forcar)`);
      continue;
    }
    const check = prontidao(canal);
    if (!check.ok && !args.dryRun) {
      aviso(`${canal}: desligado (${check.motivo})`);
      continue;
    }
    alvos.push(canal);
  }

  log(`slot ${slot.indice} · ${app.nome} · tema "${post.id}" · canais: ${alvos.join(", ") || "nenhum"}`);
  if (!alvos.length) {
    log("nada a fazer.");
    return;
  }

  const textoPorCanal = Object.fromEntries(
    alvos.map((canal) => [canal, montarTexto({ app, post, canal, campanha: env("CAMPANHA", "alwayson"), ciclo })]),
  );

  // Cards: um retrato para o feed, um vertical se o TikTok estiver no páreo.
  const variacao = ((slot.indice % 3) + 3) % 3;
  const lado = ((slot.indice % 2) + 2) % 2;
  const cardFeed = await gerarCard({ app, post, formato: "feed", nome: `${identificador}-feed`, variacao, lado });
  log(`card feed: ${cardFeed.relativo} (${Math.round(cardFeed.bytes / 1024)} KB)`);

  let cardVertical = null;
  if (alvos.includes("tiktok")) {
    cardVertical = await gerarCard({ app, post, formato: "vertical", nome: `${identificador}-vertical`, variacao, lado });
    log(`card vertical: ${cardVertical.relativo} (${Math.round(cardVertical.bytes / 1024)} KB)`);
  }

  // O Bluesky manda o arquivo direto; os demais precisam de URL pública.
  const precisaUrl = alvos.some((c) => c !== "bluesky");
  let urlsCard = { feed: null, vertical: null };
  if (precisaUrl && !args.dryRun) {
    const locais = [cardFeed.relativo, ...(cardVertical ? [cardVertical.relativo] : [])];
    const urls = await publicarMidia(locais);
    urlsCard = { feed: urls[0], vertical: urls[1] ?? urls[0] };
  }

  const resultados = [];
  for (const canal of alvos) {
    try {
      resultados.push(
        await publicarCanal(canal, { textoPorCanal, urlsCard, cardFeed, cardVertical, app, post, dryRun: args.dryRun }),
      );
    } catch (e) {
      erro(`${canal}: ${e.message}`);
      resultados.push({ canal, status: "erro", mensagem: e.message });
    }
  }

  if (!args.dryRun) {
    estado.posts[identificador] = {
      ...jaFeito,
      ...Object.fromEntries(
        resultados.map((r) => [
          r.canal,
          { status: r.status, id: r.id ?? null, url: r.url ?? null, em: new Date().toISOString(), erro: r.mensagem ?? null },
        ]),
      ),
    };
    estado.atualizadoEm = new Date().toISOString();
    gravarJson(ARQUIVO_ESTADO, estado);
  }

  const sucessos = resultados.filter((r) => r.status === "ok");
  const falhas = resultados.filter((r) => r.status === "erro");
  if (sucessos.length) ok(`publicado em: ${sucessos.map((r) => r.canal).join(", ")}`);
  if (falhas.length) aviso(`falhou em: ${falhas.map((r) => r.canal).join(", ")}`);

  if (falhas.length && !sucessos.length) process.exitCode = 1;
}

main().catch((e) => {
  erro(e.message || String(e));
  process.exit(1);
});
