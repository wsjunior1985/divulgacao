#!/usr/bin/env node
// Agenda de carrosséis do Instagram: quatro projetos distintos por dia.
import { carregarEnv, lerJson, gravarJson, agoraBRT, log, ok, aviso, erro, env } from "./lib/base.js";
import { ORDEM_APPS, carregarApps, escolherPautaPorApp, montarTexto } from "./lib/conteudo.js";
import { escolherPostSeguro, gerarCarrossel } from "./lib/carrossel.js";
import { publicarMidia } from "./lib/midia.js";
import * as meta from "./canais/meta.js";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

carregarEnv();
const ARQUIVO_ESTADO = "estado/publicados.json";
const CRONS_DIARIOS = ["0 12 * * *", "0 16 * * *", "0 19 * * *", "0 21 * * *"];
const HORAS_BRT = CRONS_DIARIOS.map((cron) => Number(cron.split(" ")[1]) - 3);
const EPOCH_INICIAL = Date.UTC(2026, 10, 4);
const AVISOS = {
  aieat: "As informações nutricionais são estimativas e não substituem avaliação profissional.",
  remedin: "O app ajuda com lembretes; siga sempre a orientação do profissional de saúde.",
  rifazinha: "Antes de iniciar uma campanha, confira as regras aplicáveis à sua situação.",
  opalpiteiro: "Palpites são entretenimento; não há garantia de acerto ou premiação.",
};

function argumentos(argv) {
  const a = { dryRun: false, forcar: false, app: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--dry-run") a.dryRun = true;
    else if (argv[i] === "--forcar" || argv[i] === "--force") a.forcar = true;
    else if (argv[i] === "--app") a.app = argv[++i];
    else throw new Error(`argumento desconhecido: ${argv[i]}`);
  }
  return a;
}

function sequenciaDoDia(data, posicao) {
  const [ano, mes, dia] = data.split("-").map(Number);
  const dias = Math.round((Date.UTC(ano, mes - 1, dia) - EPOCH_INICIAL) / 86400000);
  if (dias < 0) throw new Error(`data anterior ao início da agenda: ${data}`);
  return dias * CRONS_DIARIOS.length + posicao;
}

function slotAgendado() {
  const cron = env("GITHUB_EVENT_SCHEDULE");
  if (!cron) {
    const agora = agoraBRT();
    let posicao = HORAS_BRT.findIndex((hora) => hora > agora.hora);
    let data = agora.dia;
    if (posicao < 0) {
      posicao = 0;
      const [ano, mes, dia] = data.split("-").map(Number);
      data = new Date(Date.UTC(ano, mes - 1, dia + 1)).toISOString().slice(0, 10);
    }
    return { data, sequencia: sequenciaDoDia(data, posicao) };
  }

  const posicao = CRONS_DIARIOS.indexOf(cron.trim());
  if (posicao < 0) throw new Error(`cron de carrossel não reconhecido: ${cron}`);
  const [minuto, hora] = CRONS_DIARIOS[posicao].split(" ").map(Number);
  const agora = new Date();
  const previsto = new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth(), agora.getUTCDate(), hora, minuto));
  if (previsto > agora) previsto.setUTCDate(previsto.getUTCDate() - 1);
  const atraso = (agora - previsto) / 60000;
  if (atraso > 120) throw new Error(`cron atrasou ${Math.floor(atraso)} minutos; slot ignorado`);
  const data = agoraBRT(previsto).dia;
  return { data, sequencia: sequenciaDoDia(data, posicao) };
}

function textoComAviso(pauta, campanha) {
  const texto = montarTexto({ ...pauta, canal: "instagram", campanha, conteudo: `carrossel-${pauta.app.id}-${pauta.post.id}` }).texto;
  const aviso = AVISOS[pauta.app.id];
  return aviso ? `${texto}\n\n${aviso}`.slice(0, 2200) : texto;
}

async function main() {
  const args = argumentos(process.argv.slice(2));
  const apps = carregarApps();
  const slot = slotAgendado();
  const ordem = ["gasonol", ...ORDEM_APPS.filter((id) => id !== "gasonol")];
  const appId = args.app ?? ordem[((slot.sequencia % ordem.length) + ordem.length) % ordem.length];
  const app = apps.find((a) => a.id === appId);
  if (!app) throw new Error(`app desconhecido: ${appId}`);
  const ciclo = Math.floor(slot.sequencia / ordem.length);
  const pautaBase = escolherPautaPorApp(ciclo, apps, appId);
  const pauta = { ...pautaBase, post: escolherPostSeguro(app, ciclo) };
  const identificador = `carrossel-${app.id}-${pauta.post.id}-${slot.data}`;
  const campanha = env("CAMPANHA", `divulgacao-${slot.data.slice(0, 7)}`);
  const estado = lerJson(ARQUIVO_ESTADO, { posts: {} });
  if (estado.posts[identificador]?.instagram?.status === "ok" && !args.forcar) {
    log(`${app.nome}: carrossel deste slot já foi publicado; sem nova publicação.`); return;
  }
  const check = meta.pronto("instagram");
  if (!check.ok && !args.dryRun) throw new Error(`Instagram não está pronto: ${check.motivo}`);
  const legenda = textoComAviso(pauta, campanha);
  log(`slot ${slot.data} · ${app.nome} · tema ${pauta.post.id} · Instagram`);
  log(`legenda:\n${legenda}`);
  const piloto = slot.sequencia === 0 && app.id === "gasonol" && pauta.post.id === "regra-70"
    ? Array.from({ length: 7 }, (_, i) => `carrosseis/2026-11-03-gasonol-recriar-referencia/slides/${String(i + 1).padStart(2, "0")}-gasonol.jpg`)
    : null;
  const slides = piloto?.every((p) => existsSync(resolve(p)))
    ? piloto.map((relativo) => ({ relativo }))
    : await gerarCarrossel({ app, post: pauta.post, identificador, variacao: slot.sequencia % 3 });
  if (piloto && slides[0]?.relativo === piloto[0]) log("usando o carrossel GASONOL que você aprovou.");
  log(`${slides.length} slides 1080×1350 gerados.`);
  if (args.dryRun) { log("dry-run: nenhuma imagem enviada, publicação ou estado gravado."); return; }
  let resultado;
  try {
    const urls = await publicarMidia(slides.map((s) => s.relativo));
    resultado = { status: "ok", ...(await meta.publicar({ canal: "instagram", texto: legenda, imagens: urls })) };
  }
  catch (e) { resultado = { status: "erro", mensagem: e.message }; }
  estado.posts[identificador] ??= {};
  estado.posts[identificador].instagram = {
    ...resultado, formato: "carrossel", slides: slides.length,
    tipo: "carrossel", appId: app.id, temaId: pauta.post.id,
    landingUrl: pauta.app.url,
    utm: { source: "instagram", medium: "social", campaign: campanha, content: `carrossel-${app.id}-${pauta.post.id}` },
    em: new Date().toISOString(), erro: resultado.mensagem ?? null,
  };
  estado.atualizadoEm = new Date().toISOString(); gravarJson(ARQUIVO_ESTADO, estado);
  if (resultado.status === "ok") ok(`carrossel publicado: ${resultado.url ?? resultado.id}`);
  else { erro(`falha ao publicar: ${resultado.mensagem}`); process.exitCode = 1; }
}

main().catch((e) => { aviso(e.message || String(e)); process.exit(1); });
