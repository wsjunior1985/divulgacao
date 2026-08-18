#!/usr/bin/env node
// agenda.mjs — mostra o que será publicado nos próximos dias.
//
//   node scripts/agenda.mjs            próximos 7 dias
//   node scripts/agenda.mjs --dias 14
//
// Como o rodízio é determinístico, isto é uma previsão exata, não uma estimativa.

import { carregarEnv, agoraBRT, env, log } from "./lib/base.js";
import { carregarApps, escolherPauta, indiceDoSlot, montarTexto } from "./lib/conteudo.js";

carregarEnv();

const HORARIOS = env("HORARIOS", "08,11,14,17,20")
  .split(",")
  .map((h) => Number(h.trim()))
  .sort((a, b) => a - b);

const dias = Number(process.argv.includes("--dias") ? process.argv[process.argv.indexOf("--dias") + 1] : 7);
const apps = carregarApps();
const hoje = agoraBRT().dia;

console.log(`\nAgenda de divulgação — ${dias} dias a partir de ${hoje}`);
console.log(`Horários (BRT): ${HORARIOS.join("h, ")}h\n`);

const contagem = new Map();

for (let d = 0; d < dias; d++) {
  const data = new Date(`${hoje}T12:00:00Z`);
  data.setUTCDate(data.getUTCDate() + d);
  const dia = data.toISOString().slice(0, 10);
  const rotulo = new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" }).format(data);

  for (let posicao = 0; posicao < HORARIOS.length; posicao++) {
    const indice = indiceDoSlot(dia, posicao, HORARIOS.length);
    const { app, post, ciclo } = escolherPauta(indice, apps);
    contagem.set(app.nome, (contagem.get(app.nome) ?? 0) + 1);
    const { texto } = montarTexto({ app, post, canal: "bluesky", campanha: env("CAMPANHA", "alwayson"), ciclo });
    const primeira = texto.split("\n")[0].slice(0, 68);
    console.log(
      `${rotulo}  ${String(HORARIOS[posicao]).padStart(2, "0")}h  slot ${String(indice).padStart(4)}  ${app.nome.padEnd(16)} ${post.id.padEnd(18)} ${primeira}`,
    );
  }
}

console.log("\nPosts por app no período:");
for (const [nome, n] of [...contagem].sort((a, b) => b[1] - a[1])) console.log(`  ${nome.padEnd(18)} ${n}`);
console.log();
