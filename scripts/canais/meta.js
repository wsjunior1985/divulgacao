// meta.js — Instagram (conta profissional) e Facebook (Página) via Graph API.
//
// Gratuito. Com o app da Meta em modo de desenvolvimento e você como dono, não
// precisa de App Review — a restrição do modo dev é publicar em contas de
// terceiros, não nas suas.
//
// Credenciais (SETUP.md):
//   META_ACCESS_TOKEN  token DA PÁGINA (derivado de um user token de longa
//                      duração; nesse caso não expira)
//   META_PAGE_ID       id da Página do Facebook
//   META_IG_USER_ID    id da conta profissional do Instagram (opcional — se
//                      faltar, é descoberto a partir da Página)

import { env, log, aviso, buscar } from "../lib/base.js";

const GRAPH = `https://graph.facebook.com/${env("META_API_VERSION", "v21.0")}`;

async function graph(caminho, parametros, metodo = "POST") {
  const corpo = new URLSearchParams(parametros);
  const res =
    metodo === "GET"
      ? await buscar(`${GRAPH}${caminho}?${corpo}`)
      : await buscar(`${GRAPH}${caminho}`, { method: "POST", body: corpo });
  const dados = await res.json().catch(() => ({}));
  if (dados.error) {
    const e = dados.error;
    throw new Error(`Graph API: ${e.message} (código ${e.code}${e.error_subcode ? `/${e.error_subcode}` : ""})`);
  }
  if (!res.ok) throw new Error(`Graph API HTTP ${res.status}`);
  return dados;
}

export function credenciais() {
  return {
    token: env("META_ACCESS_TOKEN"),
    pagina: env("META_PAGE_ID"),
    instagram: env("META_IG_USER_ID"),
  };
}

export function pronto(canal) {
  const { token, pagina, instagram } = credenciais();
  if (!token) return { ok: false, motivo: "META_ACCESS_TOKEN não definido" };
  if (canal === "facebook" && !pagina) return { ok: false, motivo: "META_PAGE_ID não definido" };
  if (canal === "instagram" && !instagram && !pagina) {
    return { ok: false, motivo: "META_IG_USER_ID (ou META_PAGE_ID) não definido" };
  }
  return { ok: true };
}

async function descobrirInstagram(pagina, token) {
  const dados = await graph(`/${pagina}`, { fields: "instagram_business_account", access_token: token }, "GET");
  const id = dados.instagram_business_account?.id;
  if (!id) {
    throw new Error(
      "a Página não tem conta profissional do Instagram vinculada — vincule em Meta Business Suite ou defina META_IG_USER_ID",
    );
  }
  return id;
}

/** Espera o container do Instagram sair de IN_PROGRESS antes de publicar. */
async function aguardarContainer(container, token) {
  for (let i = 0; i < 12; i++) {
    const { status_code } = await graph(
      `/${container}`,
      { fields: "status_code", access_token: token },
      "GET",
    );
    if (status_code === "FINISHED") return;
    if (status_code === "ERROR" || status_code === "EXPIRED") {
      throw new Error(`container do Instagram terminou em ${status_code}`);
    }
    await new Promise((r) => setTimeout(r, 5000));
  }
  throw new Error("container do Instagram não ficou pronto em 60s");
}

export async function publicarInstagram({ texto, imagens }) {
  const { token, pagina } = credenciais();
  const conta = credenciais().instagram || (await descobrirInstagram(pagina, token));
  if (!imagens?.length) throw new Error("Instagram exige pelo menos uma imagem");

  let container;
  if (imagens.length === 1) {
    ({ id: container } = await graph(`/${conta}/media`, {
      image_url: imagens[0],
      caption: texto,
      access_token: token,
    }));
  } else {
    const filhos = [];
    for (const imagem of imagens) {
      const { id } = await graph(`/${conta}/media`, {
        image_url: imagem,
        is_carousel_item: "true",
        access_token: token,
      });
      filhos.push(id);
    }
    ({ id: container } = await graph(`/${conta}/media`, {
      media_type: "CAROUSEL",
      children: filhos.join(","),
      caption: texto,
      access_token: token,
    }));
  }

  await aguardarContainer(container, token);
  const { id } = await graph(`/${conta}/media_publish`, {
    creation_id: container,
    access_token: token,
  });
  return { id, url: `https://www.instagram.com/p/${id}` };
}

export async function publicarFacebook({ texto, imagens, link }) {
  const { token, pagina } = credenciais();

  if (imagens?.length) {
    const { id, post_id } = await graph(`/${pagina}/photos`, {
      url: imagens[0],
      message: texto,
      access_token: token,
    });
    return { id: post_id ?? id, url: `https://www.facebook.com/${post_id ?? id}` };
  }

  const { id } = await graph(`/${pagina}/feed`, {
    message: texto,
    ...(link ? { link } : {}),
    access_token: token,
  });
  return { id, url: `https://www.facebook.com/${id}` };
}

/** Dias restantes do token — usado pelo verificador e pelo alerta automático. */
export async function validadeDoToken() {
  const { token } = credenciais();
  if (!token) return null;
  const appId = env("META_APP_ID");
  const appSecret = env("META_APP_SECRET");
  if (!appId || !appSecret) {
    aviso("META_APP_ID/META_APP_SECRET ausentes — não dá para checar a validade do token");
    return null;
  }
  const dados = await graph(
    "/debug_token",
    { input_token: token, access_token: `${appId}|${appSecret}` },
    "GET",
  );
  const expira = dados.data?.expires_at;
  if (expira === 0 || expira === undefined) return { expiraEm: null, permanente: true };
  const dias = Math.round((expira * 1000 - Date.now()) / 86400000);
  return { expiraEm: new Date(expira * 1000).toISOString(), dias, permanente: false };
}

export async function publicar({ canal, texto, imagens, link }) {
  if (canal === "instagram") {
    const r = await publicarInstagram({ texto, imagens });
    log(`instagram: publicado (${r.id})`);
    return r;
  }
  if (canal === "facebook") {
    const r = await publicarFacebook({ texto, imagens, link });
    log(`facebook: publicado (${r.id})`);
    return r;
  }
  throw new Error(`canal ${canal} não pertence ao adapter da Meta`);
}
