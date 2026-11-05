#!/usr/bin/env node
// publicar.mjs — publica o post do slot atual em todos os canais habilitados.
//
//   node scripts/publicar.mjs --dry-run          mostra o que sairia, sem enviar
//   node scripts/publicar.mjs                    publica o slot de agora
//   node scripts/publicar.mjs --slot 3           publica um slot específico
//   node scripts/publicar.mjs --canais bluesky   restringe os canais
//   node scripts/publicar.mjs --forcar           republica um slot já publicado
//   node scripts/publicar.mjs --app gasonol       força um app em uma campanha manual
//
// A falha de um canal não derruba os outros: o resumo do fim diz o que saiu, o
// que foi pulado e o que quebrou, e o processo só sai com erro se TODOS falharem.

import { carregarEnv, canaisHabilitados, lerJson, gravarJson, agoraBRT, log, ok, aviso, erro, env } from "./lib/base.js";
import { carregarApps, escolherPauta, escolherPautaPorApp, indiceDoSlot, montarTexto, idDoPost } from "./lib/conteudo.js";
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
const HORARIOS = env("HORARIOS", "08,11,14,17,20,21,22")
  .split(",")
  .map((h) => Number(h.trim()))
  .filter((h) => Number.isInteger(h) && h >= 0 && h < 24);

function argumentos(argv) {
  const args = { dryRun: false, forcar: false, slot: null, canais: null, app: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") args.dryRun = true;
    else if (a === "--forcar" || a === "--force") args.forcar = true;
    else if (a === "--slot") args.slot = Number(argv[++i]);
    else if (a === "--canais") args.canais = argv[++i].split(",").map((c) => c.trim());
    else if (a === "--app") args.app = argv[++i];
    else throw new Error(`argumento desconhecido: ${a}`);
  }
  return args;
}

/** Descobre o slot de agora; execuções muito atrasadas não devem repetir pauta antiga. */
function slotDeAgora() {
  const { dia, hora, minuto } = agoraBRT();
  const ordenados = [...HORARIOS].sort((a, b) => a - b);
  let posicao = ordenados.findIndex((h, i) => hora >= h && (i === ordenados.length - 1 || hora < ordenados[i + 1]));
  const atrasoMinutos = posicao === -1 ? Infinity : hora * 60 + minuto - ordenados[posicao] * 60;
  if (atrasoMinutos < 0 || atrasoMinutos > 15) {
    throw new Error(`execução fora da janela de publicação (${dia} ${String(hora).padStart(2, "0")}:${String(minuto).padStart(2, "0")} BRT); use --slot para uma republicação manual`);
  }
  return { indice: indiceDoSlot(dia, posicao, ordenados.length), dia, horario: ordenados[posicao] };
}

/** Usa o cron de origem para que atrasos do GitHub não reaproveitem outro slot. */
function slotAgendado(expressao) {
  if (!expressao) return null;
  const partes = expressao.trim().split(/\s+/);
  const minutoUtc = Number(partes[0]);
  const horaUtc = Number(partes[1]);
  if (partes.length !== 5 || !Number.isInteger(minutoUtc) || !Number.isInteger(horaUtc)
      || minutoUtc < 0 || minutoUtc > 59 || horaUtc < 0 || horaUtc > 23
      || partes.slice(2).some((parte) => parte !== "*")) {
    throw new Error(`cron agendado não reconhecido: ${expressao}`);
  }

  const agora = new Date();
  const previsto = new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth(), agora.getUTCDate(), horaUtc, minutoUtc));
  if (previsto > agora) previsto.setUTCDate(previsto.getUTCDate() - 1);
  const atrasoMinutos = (agora.getTime() - previsto.getTime()) / 60000;
  if (atrasoMinutos > 120 && env("PERMITIR_ATRASO") !== "true") {
    throw new Error(`cron atrasou ${Math.floor(atrasoMinutos)} minutos; slot ignorado para evitar publicar conteúdo fora de hora`);
  }

  const { dia, hora } = agoraBRT(previsto);
  const posicao = [...HORARIOS].sort((a, b) => a - b).indexOf(hora);
  if (posicao < 0) throw new Error(`cron ${expressao} não corresponde a um horário BRT configurado (${hora}h)`);
  return { indice: indiceDoSlot(dia, posicao, HORARIOS.length), dia, horario: hora };
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

  const agendado = slotAgendado(env("GITHUB_EVENT_SCHEDULE"));
  const slot = args.slot !== null ? { indice: args.slot, dia: agoraBRT().dia } : agendado ?? slotDeAgora();
  const pauta = args.app ? escolherPautaPorApp(slot.indice, apps, args.app) : escolherPauta(slot.indice, apps);
  const { app, post, ciclo } = pauta;
  const identificador = idDoPost(pauta);
  const campanha = env("CAMPANHA", `divulgacao-${slot.dia.slice(0, 7)}`);
  const variacao = ((slot.indice % 3) + 3) % 3;

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
    alvos.map((canal) => [canal, montarTexto({ app, post, canal, campanha, ciclo, variacao })]),
  );

  const registrarCanal = (canal, resultado) => {
    estado.posts[identificador] ??= {};
    estado.posts[identificador][canal] = {
      status: resultado.status,
      id: resultado.id ?? null,
      url: resultado.url ?? null,
      landingUrl: textoPorCanal[canal]?.link ?? null,
      utm: {
        source: canal,
        medium: "social",
        campaign: campanha,
        content: textoPorCanal[canal]?.utmContent ?? null,
      },
      em: new Date().toISOString(),
      erro: resultado.mensagem ?? null,
    };
    estado.atualizadoEm = new Date().toISOString();
    gravarJson(ARQUIVO_ESTADO, estado);
  };

  // Cards: um retrato para o feed, um vertical se o TikTok estiver no páreo.
  const cardFeed = await gerarCard({ app, post, formato: "feed", nome: `${identificador}-feed`, variacao });
  log(`card feed: ${cardFeed.relativo} (${Math.round(cardFeed.bytes / 1024)} KB)`);

  let cardVertical = null;
  if (alvos.includes("tiktok")) {
    cardVertical = await gerarCard({ app, post, formato: "vertical", nome: `${identificador}-vertical`, variacao });
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
      const resultado = await publicarCanal(canal, { textoPorCanal, urlsCard, cardFeed, cardVertical, app, post, dryRun: args.dryRun });
      resultados.push(resultado);
      if (!args.dryRun) registrarCanal(canal, resultado);
    } catch (e) {
      erro(`${canal}: ${e.message}`);
      const resultado = { canal, status: "erro", mensagem: e.message };
      resultados.push(resultado);
      if (!args.dryRun) registrarCanal(canal, resultado);
    }
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
