// tiktok.js — Content Posting API, modo foto (PHOTO). Gratuita, mas com um
// portão: enquanto o app não passa pela auditoria do Content Posting, TODO post
// sai como SELF_ONLY (só você vê). Por isso TIKTOK_PRIVACY começa em SELF_ONLY:
// é o único valor que a API aceita antes da auditoria, e mandar outro faz o post
// falhar. Depois de aprovado, troque para PUBLIC_TO_EVERYONE.
//
// Credenciais:
//   TIKTOK_CLIENT_KEY / TIKTOK_CLIENT_SECRET   do app em developers.tiktok.com
//   TIKTOK_REFRESH_TOKEN                       do fluxo OAuth (escopo video.publish)
//   TIKTOK_ACCESS_TOKEN                        opcional: dura 24h e é derivado do refresh

import { env, log, aviso, buscar, dormir } from "../lib/base.js";

const API = "https://open.tiktokapis.com/v2";

export function pronto() {
  const temRefresh = env("TIKTOK_REFRESH_TOKEN") && env("TIKTOK_CLIENT_KEY") && env("TIKTOK_CLIENT_SECRET");
  if (!temRefresh && !env("TIKTOK_ACCESS_TOKEN")) {
    return { ok: false, motivo: "TIKTOK_REFRESH_TOKEN + CLIENT_KEY/SECRET (ou TIKTOK_ACCESS_TOKEN) não definidos" };
  }
  return { ok: true };
}

/** O access token do TikTok dura 24h, então o normal é sempre renovar pelo refresh. */
export async function renovarToken() {
  const clientKey = env("TIKTOK_CLIENT_KEY");
  const clientSecret = env("TIKTOK_CLIENT_SECRET");
  const refresh = env("TIKTOK_REFRESH_TOKEN");
  if (!clientKey || !clientSecret || !refresh) return null;

  const res = await buscar(`${API}/oauth/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: refresh,
    }),
  });
  const dados = await res.json().catch(() => ({}));
  if (!dados.access_token) {
    throw new Error(`TikTok refresh: ${dados.error_description || dados.error || res.status}`);
  }
  // O refresh token também rotaciona — quem não guardar o novo perde o acesso.
  return {
    token: dados.access_token,
    refresh: dados.refresh_token ?? refresh,
    expiraEmSegundos: dados.expires_in,
  };
}

async function tokenAtivo() {
  const renovado = await renovarToken().catch((e) => {
    aviso(`tiktok: refresh falhou (${e.message}) — tentando com TIKTOK_ACCESS_TOKEN`);
    return null;
  });
  if (renovado?.token) return renovado.token;
  const direto = env("TIKTOK_ACCESS_TOKEN");
  if (!direto) throw new Error("sem access token válido para o TikTok");
  return direto;
}

async function chamar(caminho, token, corpo) {
  const res = await buscar(`${API}${caminho}`, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=UTF-8", Authorization: `Bearer ${token}` },
    body: JSON.stringify(corpo),
  });
  const dados = await res.json().catch(() => ({}));
  const erro = dados.error;
  if (erro && erro.code && erro.code !== "ok") {
    throw new Error(`TikTok: ${erro.message || erro.code}`);
  }
  if (!res.ok) throw new Error(`TikTok HTTP ${res.status}`);
  return dados;
}

export async function publicar({ texto, imagens, link }) {
  const token = await tokenAtivo();
  const privacidade = env("TIKTOK_PRIVACY", "SELF_ONLY");
  if (privacidade === "SELF_ONLY") {
    aviso("tiktok: publicando como SELF_ONLY (privado) — troque TIKTOK_PRIVACY após a auditoria");
  }
  if (!imagens?.length) throw new Error("TikTok exige ao menos uma imagem no modo foto");

  const titulo = texto.split("\n")[0].slice(0, 90);
  const inicio = await chamar("/post/publish/content/init/", token, {
    post_info: {
      title: titulo,
      description: texto.slice(0, 4000),
      privacy_level: privacidade,
      disable_comment: false,
      auto_add_music: true,
    },
    source_info: {
      source: "PULL_FROM_URL",
      photo_cover_index: 0,
      photo_images: imagens,
    },
    post_mode: "DIRECT_POST",
    media_type: "PHOTO",
  });

  const publishId = inicio.data?.publish_id;
  if (!publishId) throw new Error("TikTok: publish_id ausente na resposta");

  for (let i = 0; i < 10; i++) {
    await dormir(3000);
    const estado = await chamar("/post/publish/status/fetch/", token, { publish_id: publishId });
    const status = estado.data?.status;
    if (status === "PUBLISH_COMPLETE") {
      log(`tiktok: publicado (${publishId})`);
      return { id: publishId, url: "https://www.tiktok.com/" };
    }
    if (status === "FAILED") {
      throw new Error(`TikTok: publicação falhou (${estado.data?.fail_reason || "motivo não informado"})`);
    }
  }

  log(`tiktok: ainda processando (${publishId}) — o TikTok conclui sozinho`);
  return { id: publishId, url: "https://www.tiktok.com/", pendente: true };
}
