#!/usr/bin/env node
// cards.mjs — gera os cards para conferência visual, sem publicar nada.
//
//   node scripts/cards.mjs                  um card de cada app
//   node scripts/cards.mjs --app gasonol    todos os temas de um app
//   node scripts/cards.mjs --todos          os 40 cards
//   node scripts/cards.mjs --formato vertical

import { carregarEnv, log, ok } from "./lib/base.js";
import { carregarApps } from "./lib/conteudo.js";
import { gerarCard } from "./lib/cards.js";

carregarEnv();

const argv = process.argv.slice(2);
const valor = (flag) => (argv.includes(flag) ? argv[argv.indexOf(flag) + 1] : null);
const apenasApp = valor("--app");
const formato = valor("--formato") ?? "feed";
const todos = argv.includes("--todos");

const apps = carregarApps().filter((a) => !apenasApp || a.id === apenasApp);
if (!apps.length) throw new Error(`app não encontrado: ${apenasApp}`);

let gerados = 0;
for (const app of apps) {
  const posts = todos || apenasApp ? app.posts : app.posts.slice(0, 1);
  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    const { relativo, bytes } = await gerarCard({
      app,
      post,
      formato,
      nome: `preview-${app.id}-${post.id}-${formato}`,
      variacao: i % 3,
    });
    log(`${relativo} (${Math.round(bytes / 1024)} KB)`);
    gerados++;
  }
}

ok(`${gerados} card(s) em assets/cards/ — abra para conferir antes de publicar.`);
