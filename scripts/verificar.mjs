#!/usr/bin/env node
// verificar.mjs — diagnóstico das credenciais. Faz chamadas de LEITURA em cada
// rede para provar que o token funciona de verdade, sem publicar nada.
//
//   node scripts/verificar.mjs
//
// Sai com código 1 se nenhum canal estiver funcionando — é assim que o workflow
// de monitoramento sabe que precisa abrir um alerta.

import { execFileSync } from "node:child_process";
import { carregarEnv, env, buscar, ok, aviso, erro, log } from "./lib/base.js";
import * as meta from "./canais/meta.js";
import * as threads from "./canais/threads.js";
import * as bluesky from "./canais/bluesky.js";
import * as tiktok from "./canais/tiktok.js";
import { carregarApps } from "./lib/conteudo.js";

carregarEnv();

const resultados = [];
const registrar = (canal, estado, detalhe) => resultados.push({ canal, estado, detalhe });

async function checarMeta() {
  const cred = meta.credenciais();
  if (!cred.token) return registrar("meta", "off", "META_ACCESS_TOKEN ausente");
  try {
    const res = await buscar(
      `https://graph.facebook.com/v21.0/me?fields=id,name&access_token=${encodeURIComponent(cred.token)}`,
    );
    const dados = await res.json();
    if (dados.error) return registrar("meta", "erro", dados.error.message);
    registrar("facebook", "ok", `${dados.name} (${dados.id})`);

    const validade = await meta.validadeDoToken().catch(() => null);
    if (validade?.permanente) log("token da Meta: sem expiração 👍");
    else if (validade?.dias !== undefined) {
      (validade.dias <= 10 ? aviso : log)(`token da Meta expira em ${validade.dias} dia(s)`);
    }

    const igId = cred.instagram;
    if (igId) {
      const r = await buscar(
        `https://graph.facebook.com/v21.0/${igId}?fields=username,followers_count&access_token=${encodeURIComponent(cred.token)}`,
      );
      const d = await r.json();
      if (d.error) registrar("instagram", "erro", d.error.message);
      else registrar("instagram", "ok", `@${d.username}${d.followers_count !== undefined ? ` · ${d.followers_count} seguidores` : ""}`);
    } else if (cred.pagina) {
      const r = await buscar(
        `https://graph.facebook.com/v21.0/${cred.pagina}?fields=instagram_business_account&access_token=${encodeURIComponent(cred.token)}`,
      );
      const d = await r.json();
      const id = d.instagram_business_account?.id;
      if (id) registrar("instagram", "ok", `vinculado à Página (id ${id}) — defina META_IG_USER_ID para poupar 1 chamada`);
      else registrar("instagram", "erro", "nenhuma conta profissional vinculada à Página");
    } else {
      registrar("instagram", "off", "META_IG_USER_ID e META_PAGE_ID ausentes");
    }
  } catch (e) {
    registrar("meta", "erro", e.message);
  }
}

async function checarThreads() {
  const pronto = threads.pronto();
  if (!pronto.ok) return registrar("threads", "off", pronto.motivo);
  try {
    const res = await buscar(
      `https://graph.threads.net/v1.0/me?fields=id,username&access_token=${encodeURIComponent(env("THREADS_ACCESS_TOKEN"))}`,
    );
    const d = await res.json();
    if (d.error) return registrar("threads", "erro", d.error.message);
    registrar("threads", "ok", `@${d.username}`);
  } catch (e) {
    registrar("threads", "erro", e.message);
  }
}

async function checarBluesky() {
  const pronto = bluesky.pronto();
  if (!pronto.ok) return registrar("bluesky", "off", pronto.motivo);
  try {
    const s = await bluesky.sessao();
    registrar("bluesky", "ok", `@${s.handle}`);
  } catch (e) {
    registrar("bluesky", "erro", e.message);
  }
}

async function checarTikTok() {
  const pronto = tiktok.pronto();
  if (!pronto.ok) return registrar("tiktok", "off", pronto.motivo);
  try {
    const renovado = await tiktok.renovarToken();
    const token = renovado?.token ?? env("TIKTOK_ACCESS_TOKEN");
    const res = await buscar("https://open.tiktokapis.com/v2/user/info/?fields=display_name,username", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const d = await res.json();
    if (d.error?.code && d.error.code !== "ok") return registrar("tiktok", "erro", d.error.message || d.error.code);
    const privacidade = env("TIKTOK_PRIVACY", "SELF_ONLY");
    registrar(
      "tiktok",
      privacidade === "SELF_ONLY" ? "parcial" : "ok",
      `${d.data?.user?.display_name ?? "conta ok"}${privacidade === "SELF_ONLY" ? " · posts saem PRIVADOS até a auditoria" : ""}`,
    );
  } catch (e) {
    registrar("tiktok", "erro", e.message);
  }
}

function checarConteudo() {
  try {
    const apps = carregarApps();
    const total = apps.reduce((s, a) => s + a.posts.length, 0);
    registrar("conteúdo", "ok", `${apps.length} apps · ${total} posts no rodízio`);
  } catch (e) {
    registrar("conteúdo", "erro", e.message);
  }
}

function remoteDoGit() {
  try {
    const origem = execFileSync("git", ["remote", "get-url", "origin"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return origem.match(/github\.com[:/]([^/]+\/[^/.\s]+)/)?.[1] ?? null;
  } catch {
    return null;
  }
}

function checarMidia() {
  const modo = env("MEDIA_MODE", "git");
  if (modo === "supabase") {
    const falta = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"].filter((v) => !env(v));
    return registrar("mídia", falta.length ? "erro" : "ok", falta.length ? `falta ${falta.join(", ")}` : "Supabase Storage");
  }
  const repo = env("REPO_GITHUB") || env("GITHUB_REPOSITORY") || remoteDoGit();
  registrar(
    "mídia",
    repo ? "ok" : "erro",
    repo
      ? `GitHub raw (${repo}) — o repositório precisa ser público`
      : "sem repositório: defina REPO_GITHUB ou configure o remote origin (ou use MEDIA_MODE=supabase)",
  );
}

console.log("\nVerificando credenciais…\n");
checarConteudo();
checarMidia();
await checarMeta();
await checarThreads();
await checarBluesky();
await checarTikTok();

console.log();
const simbolo = { ok: "✓", parcial: "◐", off: "·", erro: "✗" };
for (const r of resultados) {
  console.log(`  ${simbolo[r.estado]} ${r.canal.padEnd(12)} ${r.detalhe}`);
}

const publicaveis = resultados.filter(
  (r) => ["ok", "parcial"].includes(r.estado) && !["conteúdo", "mídia", "meta"].includes(r.canal),
);
console.log(`\n${publicaveis.length} canal(is) prontos para publicar.\n`);
if (!publicaveis.length) process.exitCode = 1;
