// buffer.js — publica pelo Buffer, que é como o X sai de graça.
//
// A API do X é paga desde fevereiro de 2026 (US$ 0,015 por post, US$ 0,20 com
// link). O Buffer publica no X sem cobrar porque a cota de API é dele, não
// nossa — e era exatamente assim que o perfil @waldeapps vinha sendo alimentado.
//
// O plano gratuito limita canais e tamanho de fila, então aqui NÃO se enfileira
// uma semana de uma vez: cada execução agenda só o post do slot, poucos minutos
// à frente. A fila fica sempre curta e nunca seca — que foi como o fluxo antigo
// morreu, com a fila acabando sem ninguém reabastecer.
//
// Credenciais:
//   BUFFER_ACCESS_TOKEN  publish.buffer.com/settings/api
//   BUFFER_SERVICOS      opcional: quais serviços usar (padrão "twitter")

import { env, log, aviso, buscar } from "../lib/base.js";

const API = "https://api.buffer.com";

export function pronto() {
  if (!env("BUFFER_ACCESS_TOKEN")) return { ok: false, motivo: "BUFFER_ACCESS_TOKEN não definido" };
  return { ok: true };
}

async function consultar(query) {
  const res = await buscar(API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env("BUFFER_ACCESS_TOKEN")}`,
    },
    body: JSON.stringify({ query }),
  });
  const dados = await res.json().catch(() => ({}));
  if (dados.errors?.length) throw new Error(`Buffer: ${dados.errors.map((e) => e.message).join("; ")}`);
  if (!res.ok) throw new Error(`Buffer HTTP ${res.status}`);
  if (!dados.data) throw new Error("Buffer respondeu sem dados");
  return dados.data;
}

/** O texto entra dentro da query GraphQL, então precisa escapar de verdade. */
function escapar(texto) {
  return texto
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");
}

export async function organizacao() {
  const dados = await consultar("query { account { organizations { id name } } }");
  const org = dados.account?.organizations?.[0];
  if (!org) throw new Error("nenhuma organização no Buffer");
  return org;
}

export async function canais(organizationId) {
  const dados = await consultar(
    `query { channels(input: { organizationId: "${organizationId}" }) { id name displayName service isQueuePaused } }`,
  );
  return dados.channels ?? [];
}

export async function agendados(organizationId, channelId) {
  const dados = await consultar(
    `query { posts(first: 50, input: {
       organizationId: "${organizationId}"
       filter: { status: [scheduled], channelIds: ["${channelId}"] }
     }) { edges { node { id dueAt } } } }`,
  );
  return dados.posts?.edges?.map((e) => e.node) ?? [];
}

async function criarPost({ channelId, texto, dueAt, imagem }) {
  const assets = imagem?.startsWith("https://") ? `assets: [{ image: { url: "${escapar(imagem)}" } }]` : "";
  const dados = await consultar(`mutation {
    createPost(input: {
      text: "${escapar(texto)}"
      channelId: "${channelId}"
      schedulingType: automatic
      mode: customScheduled
      dueAt: "${dueAt}"
      ${assets}
    }) {
      ... on PostActionSuccess { post { id text dueAt } }
      ... on MutationError { message }
    }
  }`);
  const r = dados.createPost;
  if (r?.message) throw new Error(r.message);
  if (!r?.post) throw new Error("resposta inesperada do Buffer");
  return r.post;
}

/** Remove um post da fila. Usado para testar a escrita sem publicar nada. */
export async function removerPost(id) {
  const dados = await consultar(`mutation {
    deletePost(input: { id: "${id}" }) {
      __typename
      ... on MutationError { message }
    }
  }`);
  if (dados.deletePost?.message) throw new Error(dados.deletePost.message);
  return true;
}

/**
 * Enfileira o post nos canais Buffer pedidos. Agenda alguns minutos à frente
 * porque o Buffer recusa dueAt no passado, e é o próprio Buffer que publica.
 */
export async function publicar({ texto, imagens, servicos }) {
  const alvos = (servicos ?? env("BUFFER_SERVICOS", "twitter").split(","))
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const org = await organizacao();
  const disponiveis = await canais(org.id);
  const usar = disponiveis.filter((c) => alvos.includes(c.service.toLowerCase()));

  if (!usar.length) {
    throw new Error(
      `nenhum canal ${alvos.join("/")} conectado no Buffer (conectados: ${disponiveis.map((c) => c.service).join(", ") || "nenhum"})`,
    );
  }

  const atrasoMin = Number(env("BUFFER_ATRASO_MIN", "5"));
  const dueAt = new Date(Date.now() + atrasoMin * 60_000).toISOString();
  const resultados = [];

  for (const canal of usar) {
    if (canal.isQueuePaused) {
      aviso(`buffer/${canal.service}: fila pausada no painel — o post foi criado mas não sai até despausar`);
    }
    const post = await criarPost({ channelId: canal.id, texto, dueAt, imagem: imagens?.[0] });
    log(`buffer/${canal.service}: agendado para ${post.dueAt} (${post.id})`);
    resultados.push({ servico: canal.service, id: post.id, dueAt: post.dueAt });
  }

  return {
    id: resultados.map((r) => r.id).join(","),
    url: "https://publish.buffer.com/",
    detalhes: resultados,
  };
}
