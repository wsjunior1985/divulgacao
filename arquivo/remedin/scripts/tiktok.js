// tiktok.js — postagem automática no TikTok via Content Posting API (Photo Mode).
// Doc: https://developers.tiktok.com/doc/content-posting-api-get-started

import { log, error } from "./lib.js";

const API = "https://open.tiktokapis.com/v2";

export async function refreshTikTokToken() {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
  const refreshToken = process.env.TIKTOK_REFRESH_TOKEN;
  if (!clientKey || !clientSecret || !refreshToken) return null;
  const res = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });
  const data = await res.json();
  if (data.access_token) {
    log("tiktok: token renovado");
    return data.access_token;
  }
  warn(`tiktok: refresh falhou (${data.error || "erro desconhecido"})`);
  return null;
}

// Photo mode: TikTok publica fotos com título. Precisa do access_token.
export async function postTikTokPhoto({ caption, imageUrls }) {
  let token = process.env.TIKTOK_ACCESS_TOKEN;
  if (!token) {
    token = await refreshTikTokToken();
  }
  if (!token) {
    log("tiktok: pulado (TIKTOK_ACCESS_TOKEN não definido)");
    return { posted: [] };
  }

  const postInfo = {
    title: (caption || "Remedin — lembrete de medicamentos 💊").slice(0, 2200),
    privacy_level:
      "SELF_ONLY" === process.env.TIKTOK_PRIVACY
        ? process.env.TIKTOK_PRIVACY
        : "PUBLIC_TO_EVERYONE",
    disable_duet: false,
    disable_comment: false,
    disable_stitch: false,
  };

  const photos = [];
  for (const url of imageUrls) {
    const res = await fetch(url);
    const buf = Buffer.from(await res.arrayBuffer());
    photos.push(buf);
  }

  const initBody = JSON.stringify({
    post_info: postInfo,
    source_info: { source: "FILE_UPLOAD" },
  });
  const init = await fetch(`${API}/post/publish/photo/init/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: initBody,
  });
  const initData = await init.json();
  if (initData.error) throw new Error(`TikTok init error: ${initData.error.message}`);
  const publishId = initData.data?.publish_id;
  const uploadUrls = initData.data?.upload_urls || [];
  if (!publishId) throw new Error("TikTok: publish_id ausente");

  // Upload de cada foto no URL retornado (content-type octet-stream).
  for (let i = 0; i < photos.length; i++) {
    const upUrl = uploadUrls[i];
    if (!upUrl) throw new Error(`TikTok: upload_url ausente para a foto ${i + 1}`);
    const up = await fetch(upUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/octet-stream" },
      body: photos[i],
    });
    if (!up.ok) {
      const txt = await up.text();
      throw new Error(`TikTok: upload da foto ${i + 1} falhou (${up.status}) ${txt.slice(0, 200)}`);
    }
  }

  // Poll de status
  for (let i = 0; i < 10; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    const st = await fetch(`${API}/post/publish/status/fetch/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ publish_id: publishId }),
    });
    const stData = await st.json();
    const status = stData.data?.status;
    if (status === "PUBLISH_COMPLETE") {
      log(`tiktok: postado (publish_id ${publishId})`);
      return { posted: [{ channel: "tiktok", id: publishId }] };
    }
    if (status === "FAILED") {
      throw new Error("TikTok: publicação falhou");
    }
  }
  log(`tiktok: em processamento (publish_id ${publishId})`);
  return { posted: [{ channel: "tiktok", id: publishId }] };
}

export async function postTikTok({ channels, caption, mediaUrls }) {
  if (!channels.includes("tiktok")) return { posted: [] };
  if (!mediaUrls || !mediaUrls.length) {
    log("tiktok: pulado (sem imagem; TikTok exige mídia)");
    return { posted: [] };
  }
  try {
    return await postTikTokPhoto({ caption, imageUrls: mediaUrls });
  } catch (e) {
    error(`tiktok: ${e.message}`);
    throw e;
  }
}
