#!/usr/bin/env node
// youtube-autorizar.mjs — autoriza o canal do YouTube uma única vez e guarda o refresh token.
//
//   node scripts/youtube-autorizar.mjs
//
// Pré-requisito: YOUTUBE_CLIENT_ID e YOUTUBE_CLIENT_SECRET no .env.local (credencial OAuth do tipo
// "App para computador" no Google Cloud). O script sobe um servidor em 127.0.0.1, imprime a URL de
// autorização, recebe o código no redirecionamento e grava YOUTUBE_REFRESH_TOKEN no .env.local.
// O token nunca é impresso. Gravar nos segredos do GitHub: gh secret set YOUTUBE_REFRESH_TOKEN.
import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import { appendFileSync, chmodSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { carregarEnv, env, RAIZ } from "./lib/base.js";

carregarEnv();
const id = env("YOUTUBE_CLIENT_ID"), segredo = env("YOUTUBE_CLIENT_SECRET");
if (!id || !segredo) { console.error("Defina YOUTUBE_CLIENT_ID e YOUTUBE_CLIENT_SECRET no .env.local."); process.exit(1); }

const ESCOPOS = ["https://www.googleapis.com/auth/youtube.upload", "https://www.googleapis.com/auth/youtube.readonly"].join(" ");
const estado = randomUUID();

const servidor = createServer(async (req, res) => {
  const url = new URL(req.url, "http://127.0.0.1");
  if (url.pathname !== "/" || !url.searchParams.has("state")) { res.writeHead(404); return res.end(); }
  const finalizar = (texto, codigo = 0) => { res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" }); res.end(texto); servidor.close(); setTimeout(() => process.exit(codigo), 200); };
  if (url.searchParams.get("state") !== estado) return finalizar("Estado inválido; refaça a autorização.", 1);
  if (url.searchParams.get("error")) return finalizar(`Autorização recusada: ${url.searchParams.get("error")}`, 1);
  const porta = servidor.address().port;
  try {
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code: url.searchParams.get("code"), client_id: id, client_secret: segredo, redirect_uri: `http://127.0.0.1:${porta}`, grant_type: "authorization_code" }),
  });
  const d = await r.json().catch(() => ({}));
  if (!d.refresh_token) return finalizar(`Sem refresh token: ${d.error_description ?? d.error ?? r.status}. Revogue o acesso do app em myaccount.google.com/permissions e tente de novo.`, 1);
  const arquivo = resolve(RAIZ, ".env.local");
  const atual = existsSync(arquivo) ? readFileSync(arquivo, "utf8") : "";
  if (/^YOUTUBE_REFRESH_TOKEN=/m.test(atual)) writeFileSync(arquivo, atual.replace(/^YOUTUBE_REFRESH_TOKEN=.*$/m, () => `YOUTUBE_REFRESH_TOKEN=${d.refresh_token}`));
  else appendFileSync(arquivo, `${atual.endsWith("\n") || !atual ? "" : "\n"}YOUTUBE_REFRESH_TOKEN=${d.refresh_token}\n`);
  chmodSync(arquivo, 0o600);
  finalizar("Pronto: YOUTUBE_REFRESH_TOKEN gravado no .env.local. Pode fechar esta aba.");
  console.log("YOUTUBE_REFRESH_TOKEN gravado no .env.local (valor não exibido).");
  } catch (e) { finalizar(`Falha ao concluir a autorização: ${e.message}`, 1); }
});

servidor.listen(0, "127.0.0.1", () => {
  const porta = servidor.address().port;
  const auth = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
    client_id: id, redirect_uri: `http://127.0.0.1:${porta}`, response_type: "code", scope: ESCOPOS,
    access_type: "offline", prompt: "consent", state: estado,
  })}`;
  console.log("Abra esta URL no Safari (perfil WaldeApps) e escolha o canal @WaldeApps:\n");
  console.log(auth);
  console.log("\nAguardando a autorização (30 min)...");
  setTimeout(() => { console.error("Tempo esgotado."); process.exit(1); }, 1800000).unref();
});
