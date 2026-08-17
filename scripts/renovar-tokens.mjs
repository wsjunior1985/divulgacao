#!/usr/bin/env node
// renovar-tokens.mjs — mantém os tokens vivos sem você precisar lembrar.
//
// O que expira:
//   Threads  60 dias, renovável a qualquer momento pelo próprio token
//   TikTok   access token de 24h + refresh token que ROTACIONA a cada uso —
//            se o novo refresh não for guardado, o acesso morre
//   Meta     token de Página derivado de user token longo: não expira
//
// Com GH_PAT definido (PAT com permissão de escrita em Secrets), este script
// grava os tokens novos direto nos GitHub Secrets e o sistema segue sozinho.
// Sem GH_PAT, ele só avisa — e o workflow abre uma issue.
//
//   node scripts/renovar-tokens.mjs            renova e grava
//   node scripts/renovar-tokens.mjs --dry-run  só mostra o que faria

import { carregarEnv, env, log, ok, aviso, erro, buscar } from "./lib/base.js";
import * as threads from "./canais/threads.js";
import * as tiktok from "./canais/tiktok.js";
import * as meta from "./canais/meta.js";

carregarEnv();

const dryRun = process.argv.includes("--dry-run");
const repo = env("REPO_GITHUB") || env("GITHUB_REPOSITORY");
const pat = env("GH_PAT");

const pendencias = [];

async function gravarSecret(nome, valor) {
  if (dryRun) return log(`[dry-run] gravaria o secret ${nome} (${valor.length} caracteres)`);
  if (!pat || !repo) {
    pendencias.push(
      `**${nome}** precisa ser atualizado à mão (defina o secret \`GH_PAT\` para automatizar isto).`,
    );
    return aviso(`${nome}: sem GH_PAT/REPO_GITHUB — atualize o secret manualmente`);
  }

  const cabecalhos = {
    Authorization: `Bearer ${pat}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const resChave = await buscar(`https://api.github.com/repos/${repo}/actions/secrets/public-key`, {
    headers: cabecalhos,
  });
  if (!resChave.ok) throw new Error(`GitHub public-key ${resChave.status}: ${(await resChave.text()).slice(0, 160)}`);
  const { key, key_id } = await resChave.json();

  const sodium = (await import("libsodium-wrappers")).default;
  await sodium.ready;
  const cifrado = sodium.to_base64(
    sodium.crypto_box_seal(sodium.from_string(valor), sodium.from_base64(key, sodium.base64_variants.ORIGINAL)),
    sodium.base64_variants.ORIGINAL,
  );

  const res = await buscar(`https://api.github.com/repos/${repo}/actions/secrets/${nome}`, {
    method: "PUT",
    headers: { ...cabecalhos, "Content-Type": "application/json" },
    body: JSON.stringify({ encrypted_value: cifrado, key_id }),
  });
  if (!res.ok) throw new Error(`GitHub secret ${nome}: ${res.status} ${(await res.text()).slice(0, 160)}`);
  ok(`secret ${nome} atualizado`);
}

async function renovarThreads() {
  if (!threads.pronto().ok) return log("threads: sem credenciais — nada a renovar");
  try {
    const novo = await threads.renovarToken();
    if (!novo?.token) return aviso("threads: a API não devolveu token novo");
    const dias = Math.round((novo.expiraEmSegundos ?? 0) / 86400);
    log(`threads: token renovado, válido por ~${dias} dias`);
    await gravarSecret("THREADS_ACCESS_TOKEN", novo.token);
  } catch (e) {
    erro(`threads: ${e.message}`);
    pendencias.push(`**Threads**: a renovação falhou (${e.message}). Refaça o login em developers.facebook.com.`);
  }
}

async function renovarTikTok() {
  if (!tiktok.pronto().ok) return log("tiktok: sem credenciais — nada a renovar");

  // O refresh do TikTok ROTACIONA: usar o atual invalida ele e devolve outro.
  // Sem onde gravar o novo, renovar seria trocar um token válido por um token
  // perdido — pior que não renovar. Só seguimos se dá para persistir.
  if (!pat || !repo) {
    aviso("tiktok: pulando a renovação — sem GH_PAT o refresh token novo se perderia e o acesso quebraria");
    pendencias.push(
      "**TikTok**: a renovação automática está desligada porque falta o secret `GH_PAT` " +
        "(o refresh token do TikTok rotaciona a cada uso e precisa ser gravado de volta). " +
        "Configure o GH_PAT — SETUP.md, bloco 5 — ou renove à mão pelo painel.",
    );
    return;
  }

  try {
    const novo = await tiktok.renovarToken();
    if (!novo?.token) return aviso("tiktok: a API não devolveu token novo");
    log("tiktok: token renovado");
    await gravarSecret("TIKTOK_ACCESS_TOKEN", novo.token);
    if (novo.refresh && novo.refresh !== env("TIKTOK_REFRESH_TOKEN")) {
      // O refresh rotaciona: guardar o novo é o que impede a corrente de quebrar.
      await gravarSecret("TIKTOK_REFRESH_TOKEN", novo.refresh);
    }
  } catch (e) {
    erro(`tiktok: ${e.message}`);
    pendencias.push(`**TikTok**: a renovação falhou (${e.message}). Refaça o OAuth em developers.tiktok.com.`);
  }
}

async function checarMeta() {
  try {
    const validade = await meta.validadeDoToken();
    if (!validade) return;
    if (validade.permanente) return ok("meta: token sem expiração");
    log(`meta: token expira em ${validade.dias} dia(s)`);
    if (validade.dias <= 10) {
      pendencias.push(
        `**Meta**: o token da Página expira em ${validade.dias} dia(s). Gere um novo (SETUP.md, etapa 2) e atualize o secret \`META_ACCESS_TOKEN\`. ` +
          "Dica: um token de Página derivado de user token de longa duração não expira — vale refazer assim.",
      );
    }
  } catch (e) {
    aviso(`meta: não deu para checar a validade (${e.message})`);
  }
}

await renovarThreads();
await renovarTikTok();
await checarMeta();

if (pendencias.length) {
  console.log(`\n::pendencias::${JSON.stringify(pendencias)}`);
  // Grava para o workflow ler e abrir a issue.
  const { writeFileSync } = await import("node:fs");
  writeFileSync("pendencias.md", `${pendencias.map((p) => `- ${p}`).join("\n")}\n`);
  aviso(`${pendencias.length} pendência(s) exigem sua ação`);
} else {
  ok("todos os tokens em dia");
}
