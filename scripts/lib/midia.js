// midia.js — transforma um card local em URL pública.
//
// Instagram, Facebook, Threads e TikTok não aceitam upload direto de arquivo no
// fluxo que usamos: eles BAIXAM a imagem de uma URL pública. Então o card
// precisa estar hospedado em algum lugar antes de publicar. Dois modos:
//
//   MEDIA_MODE=git       (padrão) commita o card no próprio repositório e usa
//                        https://raw.githubusercontent.com/<repo>/<sha>/<arquivo>.
//                        Grátis e estável — exige repositório PÚBLICO.
//   MEDIA_MODE=supabase  sobe para um bucket público do Supabase. Use se o
//                        repositório for privado.
//
// O Bluesky é a exceção: ele recebe o arquivo por upload (uploadBlob), então
// nem passa por aqui.

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { basename } from "node:path";
import { RAIZ, env, log, buscar } from "./base.js";

function git(args, opcoes = {}) {
  return execFileSync("git", args, { cwd: RAIZ, encoding: "utf8", ...opcoes }).trim();
}

function repositorio() {
  const explicito = env("REPO_GITHUB") || env("GITHUB_REPOSITORY");
  if (explicito) return explicito;
  try {
    const origem = git(["remote", "get-url", "origin"]);
    const m = origem.match(/github\.com[:/]([^/]+\/[^/.]+)(\.git)?$/);
    if (m) return m[1];
  } catch {
    /* sem remote configurado */
  }
  throw new Error(
    "não sei o repositório: defina REPO_GITHUB=usuario/divulgacao ou configure o remote origin",
  );
}

async function hospedarNoGit(caminhosRelativos) {
  const repo = repositorio();
  const branch = env("GITHUB_REF_NAME") || git(["rev-parse", "--abbrev-ref", "HEAD"]);

  git(["add", "--", ...caminhosRelativos]);
  const pendente = git(["status", "--porcelain", "--", ...caminhosRelativos]);
  if (pendente) {
    git(["-c", "user.name=divulgacao-bot", "-c", "user.email=divulgacao-bot@users.noreply.github.com",
      "commit", "-m", `chore: cards de ${new Date().toISOString().slice(0, 10)} [skip ci]`]);
  }

  // Empurra com rebase: duas execuções do cron podem se cruzar.
  let ultimoErro;
  for (let tentativa = 0; tentativa < 3; tentativa++) {
    try {
      git(["push", "origin", `HEAD:${branch}`], { stdio: "pipe" });
      ultimoErro = null;
      break;
    } catch (e) {
      ultimoErro = e;
      try {
        git(["pull", "--rebase", "origin", branch], { stdio: "pipe" });
      } catch {
        /* nada a rebasear */
      }
    }
  }
  if (ultimoErro) {
    throw new Error(
      `falhou ao publicar os cards no GitHub (${ultimoErro.message.split("\n")[0]}). ` +
        "Sem isso as redes não conseguem baixar a imagem. Use MEDIA_MODE=supabase se o repo for privado.",
    );
  }

  const sha = git(["rev-parse", "HEAD"]);
  return caminhosRelativos.map((rel) => `https://raw.githubusercontent.com/${repo}/${sha}/${rel}`);
}

async function hospedarNoSupabase(caminhosRelativos) {
  const url = env("SUPABASE_URL");
  const chave = env("SUPABASE_SERVICE_ROLE_KEY");
  const bucket = env("SUPABASE_BUCKET", "marketing");
  if (!url || !chave) {
    throw new Error("MEDIA_MODE=supabase exige SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY");
  }
  const publicas = [];
  for (const rel of caminhosRelativos) {
    const conteudo = readFileSync(`${RAIZ}/${rel}`);
    const nome = basename(rel);
    const res = await buscar(`${url}/storage/v1/object/${bucket}/${nome}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${chave}`,
        "Content-Type": "image/jpeg",
        "x-upsert": "true",
      },
      body: conteudo,
    });
    if (!res.ok) {
      throw new Error(`Supabase Storage ${res.status}: ${(await res.text()).slice(0, 200)}`);
    }
    publicas.push(`${url}/storage/v1/object/public/${bucket}/${nome}`);
  }
  return publicas;
}

/**
 * Recebe caminhos relativos ao repositório e devolve URLs públicas, na ordem.
 * URLs http(s) passam direto.
 */
export async function publicarMidia(caminhos) {
  if (!caminhos.length) return [];
  const jaPublicas = caminhos.every((c) => /^https?:\/\//.test(c));
  if (jaPublicas) return caminhos;

  const modo = env("MEDIA_MODE", "git");
  const locais = caminhos.filter((c) => !/^https?:\/\//.test(c));
  const urls = modo === "supabase" ? await hospedarNoSupabase(locais) : await hospedarNoGit(locais);
  log(`mídia publicada (${modo}): ${urls[0]}`);

  // Recompõe mantendo a ordem original.
  let i = 0;
  return caminhos.map((c) => (/^https?:\/\//.test(c) ? c : urls[i++]));
}
