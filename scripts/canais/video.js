// video.js — publica VÍDEO 9:16 (Reels, Threads, TikTok, Bluesky, X via Buffer).
//
// Os adapters de imagem (meta.js, threads.js…) ficam intactos; aqui só entra o
// que muda para vídeo: container de Reels, polling de processamento e upload.
// IG/Facebook/Threads baixam o mp4 de uma URL pública; TikTok e Bluesky recebem
// o arquivo por upload direto.

import { readFileSync, statSync } from "node:fs";
import { basename, resolve } from "node:path";
import { RAIZ, env, log, buscar, dormir } from "../lib/base.js";
import { credenciais as metaCred } from "./meta.js";
import { sessao as sessaoBluesky, montarFacets } from "./bluesky.js";

const GRAPH = `https://graph.facebook.com/${env("META_API_VERSION", "v21.0")}`;
const THREADS = "https://graph.threads.net/v1.0";
const TIKTOK = "https://open.tiktokapis.com/v2";
const abs = (rel) => resolve(RAIZ, rel);
const bytesUtf8 = (s) => new TextEncoder().encode(s).length;

async function json(res, rotulo) {
  const d = await res.json().catch(() => ({}));
  if (d.error) throw new Error(`${rotulo}: ${d.error.message ?? d.error.code ?? JSON.stringify(d.error)}`);
  if (!res.ok) throw new Error(`${rotulo} HTTP ${res.status}`);
  return d;
}

async function graph(base, caminho, params, metodo = "POST", rotulo = "Graph") {
  const corpo = new URLSearchParams(params);
  const res = metodo === "GET" ? await buscar(`${base}${caminho}?${corpo}`) : await buscar(`${base}${caminho}`, { method: "POST", body: corpo });
  return json(res, rotulo);
}

async function esperarContainer(base, id, token, { campo = "status_code", ok = "FINISHED", rotulo, tentativas = 40 }) {
  for (let i = 0; i < tentativas; i++) {
    const d = await graph(base, `/${id}`, { fields: campo, access_token: token }, "GET", rotulo);
    if (d[campo] === ok) return;
    if (d[campo] === "ERROR" || d[campo] === "EXPIRED") throw new Error(`${rotulo}: container em ${d[campo]}`);
    await dormir(6000);
  }
  throw new Error(`${rotulo}: vídeo não ficou pronto a tempo`);
}

export async function instagram({ legenda, urlVideo }) {
  const { token, pagina, instagram: ig } = metaCred();
  let conta = ig;
  if (!conta) {
    conta = (await graph(GRAPH, `/${pagina}`, { fields: "instagram_business_account", access_token: token }, "GET")).instagram_business_account?.id;
  }
  const { id: container } = await graph(GRAPH, `/${conta}/media`, {
    media_type: "REELS", video_url: urlVideo, caption: legenda, share_to_feed: "true", access_token: token,
  }, "POST", "Instagram");
  await esperarContainer(GRAPH, container, token, { rotulo: "Instagram" });
  const { id } = await graph(GRAPH, `/${conta}/media_publish`, { creation_id: container, access_token: token }, "POST", "Instagram");
  log(`instagram: reel publicado (${id})`);
  return { id, url: `https://www.instagram.com/reel/${id}` };
}

export async function facebook({ legenda, urlVideo }) {
  const { token, pagina } = metaCred();
  const { id } = await graph(GRAPH, `/${pagina}/videos`, { file_url: urlVideo, description: legenda, access_token: token }, "POST", "Facebook");
  log(`facebook: vídeo publicado (${id})`);
  return { id, url: `https://www.facebook.com/${id}` };
}

export async function threads({ legenda, urlVideo }) {
  const token = env("THREADS_ACCESS_TOKEN");
  const usuario = env("THREADS_USER_ID");
  const { id: container } = await graph(THREADS, `/${usuario}/threads`, {
    media_type: "VIDEO", video_url: urlVideo, text: legenda, access_token: token,
  }, "POST", "Threads");
  await esperarContainer(THREADS, container, token, {
    campo: "status",
    ok: "FINISHED",
    rotulo: "Threads",
  });
  const { id } = await graph(THREADS, `/${usuario}/threads_publish`, { creation_id: container, access_token: token }, "POST", "Threads");
  log(`threads: vídeo publicado (${id})`);
  return { id, url: `https://www.threads.net/@me/post/${id}` };
}

async function tokenTikTok() {
  const res = await buscar(`${TIKTOK}/oauth/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: env("TIKTOK_CLIENT_KEY"), client_secret: env("TIKTOK_CLIENT_SECRET"),
      grant_type: "refresh_token", refresh_token: env("TIKTOK_REFRESH_TOKEN"),
    }),
  });
  const d = await res.json().catch(() => ({}));
  if (!d.access_token) throw new Error(`TikTok refresh: ${d.error_description || d.error || res.status}`);
  return d.access_token;
}

export async function tiktok({ legenda, arquivo }) {
  const token = env("TIKTOK_ACCESS_TOKEN") || (await tokenTikTok());
  const tamanho = statSync(abs(arquivo)).size;
  const chamar = async (caminho, corpo) => {
    const res = await buscar(`${TIKTOK}${caminho}`, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=UTF-8", Authorization: `Bearer ${token}` },
      body: JSON.stringify(corpo),
    });
    const d = await res.json().catch(() => ({}));
    if (d.error?.code && d.error.code !== "ok") throw new Error(`TikTok: ${d.error.message || d.error.code}`);
    if (!res.ok) throw new Error(`TikTok HTTP ${res.status}`);
    return d;
  };
  const inicio = await chamar("/post/publish/video/init/", {
    post_info: {
      title: legenda.slice(0, 2200), privacy_level: env("TIKTOK_PRIVACY", "SELF_ONLY"),
      disable_comment: false, disable_duet: false, disable_stitch: false,
    },
    source_info: { source: "FILE_UPLOAD", video_size: tamanho, chunk_size: tamanho, total_chunk_count: 1 },
  });
  const { publish_id: publishId, upload_url: uploadUrl } = inicio.data ?? {};
  if (!publishId || !uploadUrl) throw new Error("TikTok: init sem publish_id/upload_url");
  const up = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": "video/mp4", "Content-Length": String(tamanho), "Content-Range": `bytes 0-${tamanho - 1}/${tamanho}` },
    body: readFileSync(abs(arquivo)),
  });
  if (!up.ok) throw new Error(`TikTok upload HTTP ${up.status}`);
  for (let i = 0; i < 20; i++) {
    await dormir(5000);
    const s = await chamar("/post/publish/status/fetch/", { publish_id: publishId });
    if (s.data?.status === "PUBLISH_COMPLETE") return { id: publishId, url: "https://www.tiktok.com/" };
    if (s.data?.status === "FAILED") throw new Error(`TikTok: falhou (${s.data.fail_reason || "sem motivo"})`);
  }
  return { id: publishId, url: "https://www.tiktok.com/", pendente: true };
}

export async function bluesky({ legenda, arquivo, alt, link, linkLimpo, aspecto = { width: 1080, height: 1920 } }) {
  const { jwt, did, handle } = await sessaoBluesky();
  // O aud do token precisa ser o DID do PDS real do usuário (não bsky.social).
  const doc = await json(await buscar(`https://plc.directory/${did}`), "Bluesky plc");
  const pds = new URL(doc.service?.find((x) => x.id === "#atproto_pds")?.serviceEndpoint).host;
  const aut = await json(
    await buscar(`${env("BLUESKY_SERVICE", "https://bsky.social")}/xrpc/com.atproto.server.getServiceAuth?` +
      new URLSearchParams({ aud: `did:web:${pds}`, lxm: "com.atproto.repo.uploadBlob", exp: String(Math.floor(Date.now() / 1000) + 1800) }),
      { headers: { Authorization: `Bearer ${jwt}` } }),
    "Bluesky serviceAuth",
  );
  const envio = await json(
    await buscar(`https://video.bsky.app/xrpc/app.bsky.video.uploadVideo?` + new URLSearchParams({ did, name: basename(arquivo) }), {
      method: "POST", headers: { Authorization: `Bearer ${aut.token}`, "Content-Type": "video/mp4" }, body: readFileSync(abs(arquivo)),
    }),
    "Bluesky uploadVideo",
  );
  let blob = envio.blob ?? envio.jobStatus?.blob;
  const jobId = envio.jobId ?? envio.jobStatus?.jobId;
  for (let i = 0; i < 40 && !blob; i++) {
    await dormir(3000);
    const st = await json(await buscar(`https://video.bsky.app/xrpc/app.bsky.video.getJobStatus?jobId=${jobId}`), "Bluesky jobStatus");
    if (st.jobStatus?.state === "JOB_STATE_FAILED") throw new Error(`Bluesky: processamento falhou (${st.jobStatus.error})`);
    blob = st.jobStatus?.blob;
  }
  if (!blob) throw new Error("Bluesky: vídeo não terminou de processar");

  const facets = montarFacets(legenda);
  const pos = linkLimpo ? legenda.indexOf(linkLimpo) : -1;
  if (pos >= 0 && link) {
    facets.push({
      index: { byteStart: bytesUtf8(legenda.slice(0, pos)), byteEnd: bytesUtf8(legenda.slice(0, pos + linkLimpo.length)) },
      features: [{ $type: "app.bsky.richtext.facet#link", uri: link }],
    });
  }
  const registro = {
    $type: "app.bsky.feed.post", text: legenda, createdAt: new Date().toISOString(), langs: ["pt-BR"],
    facets: facets.sort((a, b) => a.index.byteStart - b.index.byteStart),
    embed: { $type: "app.bsky.embed.video", video: blob, alt: alt ?? "", aspectRatio: aspecto },
  };
  const d = await json(
    await buscar(`${env("BLUESKY_SERVICE", "https://bsky.social")}/xrpc/com.atproto.repo.createRecord`, {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt}` },
      body: JSON.stringify({ repo: did, collection: "app.bsky.feed.post", record: registro }),
    }),
    "Bluesky createRecord",
  );
  const rkey = d.uri.split("/").pop();
  log(`bluesky: vídeo publicado (${rkey})`);
  return { id: d.uri, url: `https://bsky.app/profile/${handle}/post/${rkey}` };
}
