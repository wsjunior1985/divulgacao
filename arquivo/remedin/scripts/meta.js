// meta.js — postagem automática no Facebook e Instagram via Meta Graph API.
// Doc: https://developers.facebook.com/docs/graph-api

import { log, error } from "./lib.js";

const GRAPH = "https://graph.facebook.com/v21.0";

async function graph(path, params) {
  const url = `${GRAPH}${path}`;
  const qs = new URLSearchParams(params);
  const res = await fetch(`${url}?${qs}`);
  const data = await res.json();
  if (data.error) {
    const e = new Error(`Meta API error: ${data.error.message} (${data.error.code})`);
    e.code = data.error.code;
    throw e;
  }
  return data;
}

async function uploadImageFromFile(pageId, token, filePath, caption) {
  // Para Facebook, envia a imagem como multipart via /photos.
  const { readFileSync } = await import("node:fs");
  const { basename } = await import("node:path");
  const { fileTypeFromBuffer } = await import("./mime.js");
  const buffer = readFileSync(filePath);
  const mime = fileTypeFromBuffer(buffer);
  const form = new FormData();
  form.append("access_token", token);
  form.append("source", new Blob([buffer], { type: mime }), basename(filePath));
  if (caption) form.append("caption", caption);
  const res = await fetch(`${GRAPH}/${pageId}/photos`, { method: "POST", body: form });
  const data = await res.json();
  if (data.error) throw new Error(`Meta photos error: ${data.error.message}`);
  return data.id;
}

async function resolveInstagramUserId(pageId, token) {
  const data = await graph(`/${pageId}`, {
    fields: "instagram_business_account{id}",
    access_token: token,
  });
  return data.instagram_business_account?.id;
}

async function publishInstagramImage(igUserId, token, imageUrl, caption) {
  const media = await graph(`/${igUserId}/media`, {
    image_url: imageUrl,
    caption,
    access_token: token,
  });
  if (!media.id) throw new Error("Instagram: container id ausente");
  const pub = await graph(`/${igUserId}/media_publish`, {
    creation_id: media.id,
    access_token: token,
  });
  return pub.id;
}

async function publishInstagramCarousel(igUserId, token, imageUrls, caption) {
  const children = [];
  for (const url of imageUrls) {
    const c = await graph(`/${igUserId}/media`, {
      image_url: url,
      is_carousel_item: "true",
      access_token: token,
    });
    children.push(c.id);
  }
  const media = await graph(`/${igUserId}/media`, {
    media_type: "CAROUSEL",
    children: children.join(","),
    caption,
    access_token: token,
  });
  const pub = await graph(`/${igUserId}/media_publish`, {
    creation_id: media.id,
    access_token: token,
  });
  return pub.id;
}

async function publishFacebookImage(pageId, token, imageUrl, message) {
  // Publica a foto com legenda/link.
  const res = await fetch(`${GRAPH}/${pageId}/photos`, {
    method: "POST",
    body: new URLSearchParams({
      url: imageUrl,
      message,
      access_token: token,
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(`Meta FB photos error: ${data.error.message}`);
  return data.id;
}

async function publishFacebookLink(pageId, token, { link, message }) {
  const res = await fetch(`${GRAPH}/${pageId}/feed`, {
    method: "POST",
    body: new URLSearchParams({
      link,
      message,
      access_token: token,
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(`Meta FB feed error: ${data.error.message}`);
  return data.id;
}

// postMetaPublica um item do manifesto nos canais Meta configurados.
// mediaUrls devem ser URLs públicas (a Meta baixa por URL).
export async function postMeta({ channels, caption, mediaUrls, link }) {
  const token = process.env.META_ACCESS_TOKEN;
  const pageId = process.env.META_PAGE_ID;
  const igUserId = process.env.META_IG_USER_ID || null;
  if (!token || !pageId) {
    log("meta: pulado (META_ACCESS_TOKEN / META_PAGE_ID não definidos)");
    return { posted: [] };
  }
  const results = [];

  if (channels.includes("facebook")) {
    try {
      let fbId;
      if (mediaUrls && mediaUrls.length) {
        fbId = await publishFacebookImage(pageId, token, mediaUrls[0], caption);
      } else {
        fbId = await publishFacebookLink(pageId, token, {
          link: link ?? "https://remedin.lovable.app",
          message: caption,
        });
      }
      results.push({ channel: "facebook", id: fbId });
      log(`facebook: postado (${fbId})`);
    } catch (e) {
      error(`facebook: ${e.message}`);
      throw e;
    }
  }

  if (channels.includes("instagram")) {
    const resolvedIg = igUserId || (await resolveInstagramUserId(pageId, token));
    if (!resolvedIg) {
      log("instagram: pulado (conta IG vinculada não encontrada)");
    } else if (!mediaUrls || !mediaUrls.length) {
      log("instagram: pulado (sem imagem; IG não aceita texto puro)");
    } else {
      try {
        let igId;
        if (mediaUrls.length === 1) {
          igId = await publishInstagramImage(resolvedIg, token, mediaUrls[0], caption);
        } else {
          igId = await publishInstagramCarousel(resolvedIg, token, mediaUrls, caption);
        }
        results.push({ channel: "instagram", id: igId });
        log(`instagram: postado (${igId})`);
      } catch (e) {
        error(`instagram: ${e.message}`);
        throw e;
      }
    }
  }

  return { posted: results };
}
