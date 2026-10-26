// midia-video.js — hospeda o mp4 num bucket público do Supabase (Storage).
// Vídeo não vai para o git: engordaria o histórico do repositório público.
import { readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { RAIZ, env, log, buscar } from "./base.js";

export async function hospedarVideo(relativo) {
  const url = env("SUPABASE_URL");
  const chave = env("SUPABASE_SERVICE_ROLE_KEY");
  const bucket = env("SUPABASE_VIDEO_BUCKET", "marketing-videos");
  if (!url || !chave) throw new Error("hospedagem de vídeo exige SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY");
  const nome = `videos/${basename(relativo)}`;
  const res = await buscar(`${url}/storage/v1/object/${bucket}/${nome}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${chave}`, "Content-Type": "video/mp4", "x-upsert": "true" },
    body: readFileSync(resolve(RAIZ, relativo)),
  });
  if (!res.ok) throw new Error(`Supabase Storage ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const publica = `${url}/storage/v1/object/public/${bucket}/${nome}`;
  log(`vídeo hospedado: ${publica}`);
  return publica;
}
