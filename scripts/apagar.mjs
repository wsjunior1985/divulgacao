#!/usr/bin/env node
// apagar.mjs — apaga todos os posts já publicados pela divulgação em cada canal.
//
//   node scripts/apagar.mjs --dry-run     mostra o que seria apagado, sem enviar
//   node scripts/apagar.mjs               apaga tudo que está no estado
//   node scripts/apagar.mjs --canais bluesky   restringe os canais
//
// Lê estado/publicados.json (o registro do que saiu) e apaga post a post.
// A falha de um canal não derruba os outros; no fim o estado é zerado para o
// rodízio recomeçar do zero. O canal "x" sai pelo Buffer, que NÃO apaga post já
// enviado via API — nesse caso a exclusão é manual (painel do Buffer ou X).

import { carregarEnv, lerJson, gravarJson, log, ok, aviso, erro } from "./lib/base.js";
import * as meta from "./canais/meta.js";
import * as threads from "./canais/threads.js";
import * as bluesky from "./canais/bluesky.js";
import * as buffer from "./canais/buffer.js";

carregarEnv();

const ARQUIVO_ESTADO = "estado/publicados.json";
const CANAIS = ["instagram", "facebook", "threads", "bluesky", "tiktok", "x"];

function argumentos(argv) {
  const args = { dryRun: false, canais: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") args.dryRun = true;
    else if (a === "--canais") args.canais = argv[++i].split(",").map((c) => c.trim());
    else throw new Error(`argumento desconhecido: ${a}`);
  }
  return args;
}

async function apagarCanal(canal, id, dryRun) {
  if (dryRun) return { canal, status: "dry-run", id };

  switch (canal) {
    case "instagram":
    case "facebook":
      return { canal, status: "ok", ...(await meta.apagar(canal, id)) };
    case "threads":
      return { canal, status: "ok", ...(await threads.apagar(id)) };
    case "bluesky":
      return { canal, status: "ok", ...(await bluesky.apagar(id)) };
    case "x":
      return { canal, status: "ok", ...(await buffer.removerPost(id).then(() => ({ id }))) };
    case "tiktok":
      throw new Error("TikTok não tem exclusão via API — posts SELF_ONLY ficam privados");
    default:
      throw new Error(`canal sem adapter: ${canal}`);
  }
}

async function main() {
  const args = argumentos(process.argv.slice(2));
  const estado = lerJson(ARQUIVO_ESTADO, { posts: {} });
  const posts = estado.posts ?? {};

  const alvos = [];
  for (const [identificador, porCanal] of Object.entries(posts)) {
    for (const canal of Object.keys(porCanal)) {
      if (!CANAIS.includes(canal)) continue;
      if (args.canais && !args.canais.includes(canal)) continue;
      const registro = porCanal[canal];
      if (registro?.status !== "ok" || !registro.id) continue;
      alvos.push({ identificador, canal, id: registro.id });
    }
  }

  if (!alvos.length) {
    log("nada para apagar no estado.");
    return;
  }

  log(`${args.dryRun ? "[dry-run] " : ""}${alvos.length} post(s) para apagar:`);
  for (const a of alvos) log(`  ${a.canal.padEnd(10)} ${a.id}`);

  const resultados = [];
  for (const alvo of alvos) {
    try {
      resultados.push({ identificador: alvo.identificador, ...(await apagarCanal(alvo.canal, alvo.id, args.dryRun)) });
    } catch (e) {
      erro(`${alvo.canal}: ${e.message}`);
      resultados.push({ identificador: alvo.identificador, canal: alvo.canal, status: "erro", id: alvo.id, mensagem: e.message });
    }
  }

  const sucessos = resultados.filter((r) => r.status === "ok" || r.status === "dry-run");
  const falhas = resultados.filter((r) => r.status === "erro");

  if (falhas.length) {
    aviso("não foi possível apagar automaticamente:");
    for (const f of falhas) {
      if (f.canal === "x") {
        aviso(
          "  x: o Buffer não apaga post já enviado — apague manualmente em publish.buffer.com (Enviados) ou no X.",
        );
      } else {
        aviso(`  ${f.canal}: ${f.mensagem}`);
      }
    }
  }

  if (!args.dryRun) {
    // Remove do estado só o que foi realmente apagado; o que falhou permanece
    // para ser tentado de novo depois de corrigida a credencial.
    for (const r of sucessos) {
      if (r.identificador && posts[r.identificador]) delete posts[r.identificador][r.canal];
      if (r.identificador && posts[r.identificador] && !Object.keys(posts[r.identificador]).length) {
        delete posts[r.identificador];
      }
    }
    const restantes = Object.keys(posts).length;
    gravarJson(ARQUIVO_ESTADO, { posts, atualizadoEm: new Date().toISOString() });
    if (restantes) {
      aviso(`estado atualizado — ${restantes} post(s) ainda aguardam exclusão (manual ou com nova credencial).`);
    } else {
      ok("estado/publicados.json zerado — o rodízio recomeça do zero.");
    }
  }

  if (sucessos.length) ok(`apagados: ${sucessos.map((r) => r.canal).join(", ")}`);
  if (falhas.length && !sucessos.length) process.exitCode = 1;
}

main().catch((e) => {
  erro(e.message || String(e));
  process.exit(1);
});
