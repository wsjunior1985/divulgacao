// threads.js — Threads API (Meta). Gratuita, host próprio: graph.threads.net.
//
// O token do Threads é SEPARADO do token do Facebook/Instagram: o app precisa do
// produto "Threads API" e o login é feito pelo fluxo do Threads. Dura 60 dias e
// se renova sozinho pelo endpoint refresh_access_token (ver renovar-tokens.mjs).
//
// Credenciais:
//   THREADS_USER_ID       id do usuário no Threads
//   THREADS_ACCESS_TOKEN  token de longa duração (60 dias, renovável)

import { env, log, buscar, dormir } from "../lib/base.js";

const API = "https://graph.threads.net/v1.0";

async function chamar(caminho, parametros, metodo = "POST") {
  const corpo = new URLSearchParams(parametros);
  const res =
    metodo === "GET"
      ? await buscar(`${API}${caminho}?${corpo}`)
      : await buscar(`${API}${caminho}`, { method: "POST", body: corpo });
  const dados = await res.json().catch(() => ({}));
  if (dados.error) throw new Error(`Threads API: ${dados.error.message}`);
  if (!res.ok) throw new Error(`Threads API HTTP ${res.status}`);
  return dados;
}

export function pronto() {
  if (!env("THREADS_ACCESS_TOKEN")) return { ok: false, motivo: "THREADS_ACCESS_TOKEN não definido" };
  if (!env("THREADS_USER_ID")) return { ok: false, motivo: "THREADS_USER_ID não definido" };
  return { ok: true };
}

export async function publicar({ texto, imagens, link }) {
  const token = env("THREADS_ACCESS_TOKEN");
  const usuario = env("THREADS_USER_ID");
  const imagem = imagens?.[0];

  const { id: container } = await chamar(`/${usuario}/threads`, {
    media_type: imagem ? "IMAGE" : "TEXT",
    ...(imagem ? { image_url: imagem } : {}),
    text: texto,
    // link_attachment só vale para posts de texto; com imagem, o link fica no corpo.
    ...(link && !imagem ? { link_attachment: link } : {}),
    access_token: token,
  });

  // A doc pede ~30s entre criar e publicar o container.
  await dormir(Number(env("THREADS_ESPERA_MS", "30000")));

  const { id } = await chamar(`/${usuario}/threads_publish`, {
    creation_id: container,
    access_token: token,
  });
  log(`threads: publicado (${id})`);
  return { id, url: `https://www.threads.net/@me/post/${id}` };
}

/** Renova o token de 60 dias. Só funciona se ele tiver ao menos 24h de vida. */
export async function renovarToken() {
  const token = env("THREADS_ACCESS_TOKEN");
  if (!token) return null;
  const dados = await chamar(
    "/refresh_access_token",
    { grant_type: "th_refresh_token", access_token: token },
    "GET",
  );
  if (!dados.access_token) return null;
  return { token: dados.access_token, expiraEmSegundos: dados.expires_in };
}
