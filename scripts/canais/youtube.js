// youtube.js — publica Shorts no canal @WaldeApps pela YouTube Data API v3 (videos.insert, upload resumável).
//
// Segredos: YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, YOUTUBE_REFRESH_TOKEN (gerado uma vez por
// scripts/youtube-autorizar.mjs). Escopos: youtube.upload e youtube.readonly.
//
// Atenção: projetos de API NÃO auditados pelo Google têm os vídeos enviados por API travados em
// "private" até passar na auditoria de conformidade. O publicador lê o status real depois do upload
// e o devolve em `privacidade`, para o registro não afirmar que o vídeo está público quando não está.
import { readFileSync, statSync } from "node:fs";
import { env, log, buscar } from "../lib/base.js";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const UPLOAD_URL = "https://www.googleapis.com/upload/youtube/v3/videos";
const API_URL = "https://www.googleapis.com/youtube/v3";

export function pronto() {
  for (const nome of ["YOUTUBE_CLIENT_ID", "YOUTUBE_CLIENT_SECRET", "YOUTUBE_REFRESH_TOKEN"]) {
    if (!env(nome)) return { ok: false, motivo: `${nome} não definido` };
  }
  return { ok: true };
}

const limpar = (t) => String(t ?? "").replace(/<[^>]*>/g, "").replace(/[<>]/g, "").trim();
const cortarBytes = (t, max) => { while (Buffer.byteLength(t, "utf8") > max) t = t.slice(0, -1); return t; };

/** Título (até 100 caracteres) e descrição (até 5000 bytes) de um Short; o YouTube rejeita < e >. */
export function montarShort({ titulo, nome, legenda }) {
  const sufixo = " #Shorts";
  const base = limpar([titulo, nome].filter(Boolean).join(" | "));
  const corte = 100 - sufixo.length;
  const cabeca = base.length > corte ? `${base.slice(0, corte - 1).trimEnd()}…` : base;
  const rodape = "\n\n#Shorts";
  const descricao = `${cortarBytes(limpar(legenda), 4900 - rodape.length)}${rodape}`;
  return { titulo: `${cabeca}${sufixo}`, descricao };
}

export async function tokenDeAcesso() {
  const res = await buscar(TOKEN_URL, {
    signal: AbortSignal.timeout(30000),
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env("YOUTUBE_CLIENT_ID"), client_secret: env("YOUTUBE_CLIENT_SECRET"),
      refresh_token: env("YOUTUBE_REFRESH_TOKEN"), grant_type: "refresh_token",
    }),
  });
  const d = await res.json().catch(() => ({}));
  if (!d.access_token) {
    const dica = d.error === "invalid_grant" ? " (token revogado ou expirado: com a tela de consentimento em modo Teste ele vale só 7 dias; publique o app em produção e rode scripts/youtube-autorizar.mjs)" : "";
    throw new Error(`YouTube OAuth: ${d.error_description ?? d.error ?? `HTTP ${res.status}`}${dica}`);
  }
  return d.access_token;
}

export async function publicarShort({ titulo, descricao, arquivo }) {
  const token = await tokenDeAcesso();
  const privacidadePedida = env("YOUTUBE_PRIVACY", "public");
  const metadados = {
    snippet: { title: titulo, description: descricao, categoryId: env("YOUTUBE_CATEGORIA", "28"), defaultLanguage: "pt-BR" },
    status: { privacyStatus: privacidadePedida, selfDeclaredMadeForKids: false, embeddable: true },
  };
  const tamanho = statSync(arquivo).size;
  const inicio = await fetch(`${UPLOAD_URL}?uploadType=resumable&part=snippet,status`, {
    signal: AbortSignal.timeout(60000),
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`, "Content-Type": "application/json; charset=UTF-8",
      "X-Upload-Content-Type": "video/mp4", "X-Upload-Content-Length": String(tamanho),
    },
    body: JSON.stringify(metadados),
  });
  if (!inicio.ok) throw new Error(`YouTube iniciar upload ${inicio.status}: ${(await inicio.text()).slice(0, 240)}`);
  const destino = inicio.headers.get("location");
  if (!destino) throw new Error("YouTube: resposta sem URL de upload");

  const envio = await buscar(destino, {
    method: "PUT", headers: { "Content-Type": "video/mp4", "Content-Length": String(tamanho) }, body: readFileSync(arquivo),
  });
  const video = await envio.json().catch(() => ({}));
  if (!envio.ok || !video.id) throw new Error(`YouTube upload ${envio.status}: ${JSON.stringify(video.error ?? video).slice(0, 240)}`);

  // Status real: projeto não auditado fica "private" mesmo pedindo "public".
  let privacidade = null;
  try {
    const st = await (await fetch(`${API_URL}/videos?part=status&id=${video.id}`, { signal: AbortSignal.timeout(30000), headers: { Authorization: `Bearer ${token}` } })).json();
    privacidade = st.items?.[0]?.status?.privacyStatus ?? null;
  } catch { /* o upload já deu certo; só não deu para confirmar o status */ }
  if (privacidade && privacidade !== privacidadePedida) {
    const aviso = `youtube: pedido "${privacidadePedida}", mas o vídeo ficou "${privacidade}" (projeto de API sem auditoria?)`;
    log(aviso);
    if (process.env.GITHUB_ACTIONS) console.log(`::warning::${aviso}`);
  }
  log(`youtube: short publicado (${video.id}, ${privacidade ?? "status desconhecido"})`);
  return { id: video.id, url: `https://www.youtube.com/shorts/${video.id}`, privacidade };
}
