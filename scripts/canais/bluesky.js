// bluesky.js — AT Protocol. Gratuito e sem processo de aprovação: basta uma
// senha de aplicativo (Configurações → Privacidade e segurança → Senhas de app).
//
// Detalhes que mordem:
//  - o post tem limite de 300 GRAFEMAS (não bytes);
//  - link e hashtag só viram clicáveis se você mandar "facets" com os offsets
//    em BYTES UTF-8 — texto com acento e emoji desalinha se contar caracteres;
//  - blob de imagem tem teto de ~1 MB, bem menor que o do Instagram.
//
// Credenciais:
//   BLUESKY_IDENTIFIER  seu handle (ex.: waldeapps.bsky.social)
//   BLUESKY_APP_PASSWORD  senha de aplicativo (formato xxxx-xxxx-xxxx-xxxx)

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { RAIZ, env, log, buscar } from "../lib/base.js";

const SERVICO = env("BLUESKY_SERVICE", "https://bsky.social");
const LIMITE_BLOB = 950_000; // teto real é ~1 MB; deixamos folga

export function pronto() {
  if (!env("BLUESKY_IDENTIFIER")) return { ok: false, motivo: "BLUESKY_IDENTIFIER não definido" };
  if (!env("BLUESKY_APP_PASSWORD")) return { ok: false, motivo: "BLUESKY_APP_PASSWORD não definido" };
  return { ok: true };
}

export async function sessao() {
  const res = await buscar(`${SERVICO}/xrpc/com.atproto.server.createSession`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identifier: env("BLUESKY_IDENTIFIER"),
      password: env("BLUESKY_APP_PASSWORD"),
    }),
  });
  const dados = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      `Bluesky login: ${dados.message || res.status}. Use uma SENHA DE APLICATIVO, não a senha da conta.`,
    );
  }
  return { jwt: dados.accessJwt, did: dados.did, handle: dados.handle };
}

const bytes = (s) => new TextEncoder().encode(s).length;

/** Facets de link e hashtag, com offsets em bytes UTF-8. */
export function montarFacets(texto) {
  const facets = [];
  const posByte = (indice) => bytes(texto.slice(0, indice));

  const links = /https?:\/\/[^\s<>()"]+[^\s<>()".,;:!?]/g;
  for (const m of texto.matchAll(links)) {
    facets.push({
      index: { byteStart: posByte(m.index), byteEnd: posByte(m.index + m[0].length) },
      features: [{ $type: "app.bsky.richtext.facet#link", uri: m[0] }],
    });
  }

  const tags = /(^|\s)(#[\p{L}\p{N}_]+)/gu;
  for (const m of texto.matchAll(tags)) {
    const inicio = m.index + m[1].length;
    facets.push({
      index: { byteStart: posByte(inicio), byteEnd: posByte(inicio + m[2].length) },
      features: [{ $type: "app.bsky.richtext.facet#tag", tag: m[2].slice(1) }],
    });
  }

  return facets.sort((a, b) => a.index.byteStart - b.index.byteStart);
}

async function enviarBlob(jwt, caminhoRelativo) {
  let conteudo = readFileSync(resolve(RAIZ, caminhoRelativo));
  if (conteudo.length > LIMITE_BLOB) {
    const { default: sharp } = await import("sharp");
    for (const qualidade of [80, 70, 60, 50]) {
      conteudo = await sharp(conteudo).resize({ width: 1000 }).jpeg({ quality: qualidade }).toBuffer();
      if (conteudo.length <= LIMITE_BLOB) break;
    }
    if (conteudo.length > LIMITE_BLOB) throw new Error("card não coube no limite de 1 MB do Bluesky");
  }

  const res = await buscar(`${SERVICO}/xrpc/com.atproto.repo.uploadBlob`, {
    method: "POST",
    headers: { "Content-Type": "image/jpeg", Authorization: `Bearer ${jwt}` },
    body: conteudo,
  });
  const dados = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Bluesky uploadBlob: ${dados.message || res.status}`);
  return dados.blob;
}

export async function publicar({ texto, imagensLocais, alt }) {
  const { jwt, did, handle } = await sessao();

  const registro = {
    $type: "app.bsky.feed.post",
    text: texto,
    createdAt: new Date().toISOString(),
    langs: ["pt-BR"],
    facets: montarFacets(texto),
  };

  if (imagensLocais?.length) {
    const imagens = [];
    for (const caminho of imagensLocais.slice(0, 4)) {
      imagens.push({ image: await enviarBlob(jwt, caminho), alt: alt ?? "" });
    }
    registro.embed = { $type: "app.bsky.embed.images", images: imagens };
  }

  const res = await buscar(`${SERVICO}/xrpc/com.atproto.repo.createRecord`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt}` },
    body: JSON.stringify({ repo: did, collection: "app.bsky.feed.post", record: registro }),
  });
  const dados = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Bluesky createRecord: ${dados.message || res.status}`);

  const rkey = dados.uri.split("/").pop();
  log(`bluesky: publicado (${rkey})`);
  return { id: dados.uri, url: `https://bsky.app/profile/${handle}/post/${rkey}` };
}
