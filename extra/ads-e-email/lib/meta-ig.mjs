// Publicador do Instagram via Meta Graph API (conta profissional).
// Fluxo: cria um container de mídia e depois publica. Requer:
//  - App da Meta com produto Instagram + permissão instagram_content_publish
//  - Conta Instagram profissional conectada ao app
//  - Token de longa duração
// Veja marketing/SETUP.md.
import { requireEnv } from "./env.mjs";

const GRAPH = "https://graph.facebook.com/v21.0";

export function instagramReady() {
  const token = requireEnv("IG_ACCESS_TOKEN", "token de longa duração do Instagram");
  const userId = requireEnv("IG_USER_ID", "ID da conta profissional (perfil > Configurações > API)");
  const image = requireEnv(
    "IG_IMAGE_URL",
    "URL pública da imagem do post (ex: screenshot do app)",
  );
  return {
    ok: token.ok && userId.ok && image.ok,
    error: token.error ?? userId.error ?? image.error,
  };
}

/**
 * Publica um post de imagem (container único). Retorna o media id.
 * @param {{caption:string}} post
 */
export async function publishInstagram(post, { dryRun = false } = {}) {
  const token = requireEnv("IG_ACCESS_TOKEN");
  const userId = requireEnv("IG_USER_ID");
  const image = requireEnv("IG_IMAGE_URL");
  const missing = [token, userId, image].filter((x) => !x.ok);
  if (missing.length) return { ok: false, error: missing.map((x) => x.error).join(" ") };

  if (dryRun) {
    console.log("[dry-run] Instagram: publicaria post com imagem", image.value);
    console.log(post.caption);
    return { ok: true, dryRun: true };
  }

  // 1. Container
  const containerRes = await fetch(
    `${GRAPH}/${userId.value}/media?image_url=${encodeURIComponent(image.value)}&caption=${encodeURIComponent(post.caption)}&access_token=${encodeURIComponent(token.value)}`,
    { method: "POST" },
  );
  const container = await containerRes.json();
  if (!containerRes.ok || !container?.id) {
    return { ok: false, error: `Instagram container: ${containerRes.status} ${JSON.stringify(container).slice(0, 300)}` };
  }

  // 2. Publicar
  const pubRes = await fetch(
    `${GRAPH}/${userId.value}/media_publish?creation_id=${container.id}&access_token=${encodeURIComponent(token.value)}`,
    { method: "POST" },
  );
  const published = await pubRes.json();
  if (!pubRes.ok || !published?.id) {
    return { ok: false, error: `Instagram publish: ${pubRes.status} ${JSON.stringify(published).slice(0, 300)}` };
  }
  return { ok: true, id: published.id };
}
