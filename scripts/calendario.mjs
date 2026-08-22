#!/usr/bin/env node
// calendario.mjs — gera CALENDARIO-1ANO.md com a programação determinística de
// 365 dias (data, horário, app, tema e lado do card). É uma projeção exata,
// não uma estimativa: o rodízio é calculado pela data.
//
//   node scripts/calendario.mjs --dias 365
//   node scripts/calendario.mjs --dias 30 --app gasonol

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { carregarEnv, agoraBRT, env, RAIZ } from "./lib/base.js";
import { carregarApps, escolherPauta, indiceDoSlot } from "./lib/conteudo.js";

carregarEnv();

const HORARIOS = env("HORARIOS", "08,11,14,17,20,21")
  .split(",")
  .map((h) => Number(h.trim()))
  .filter((h) => Number.isInteger(h) && h >= 0 && h < 24)
  .sort((a, b) => a - b);

const argv = process.argv.slice(2);
const valor = (flag) => (argv.includes(flag) ? argv[argv.indexOf(flag) + 1] : null);
const dias = Number(valor("--dias") ?? 365);
const apenasApp = valor("--app");

const apps = carregarApps();
const hoje = agoraBRT().dia;
const [ano, mes, dia] = hoje.split("-").map(Number);

const LADO = ["←", "→"]; // 0 = celular à esquerda, 1 = à direita

function celula(indice) {
  const { app, post, ciclo } = escolherPauta(indice, apps);
  const lado = ((indice % 2) + 2) % 2;
  return `${app.nome} · ${post.id} ${LADO[lado]}`;
}

const meses = new Map(); // "2026-08" -> [{ data, rotulo, celulas }]

for (let d = 0; d < dias; d++) {
  const data = new Date(Date.UTC(ano, mes - 1, dia + d));
  const iso = data.toISOString().slice(0, 10);
  const chaveMes = iso.slice(0, 7);
  const rotulo = new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", timeZone: "UTC" }).format(data);
  const celulas = HORARIOS.map((_, pos) => celula(indiceDoSlot(iso, pos, HORARIOS.length)));
  if (!meses.has(chaveMes)) meses.set(chaveMes, []);
  meses.get(chaveMes).push({ data: iso, rotulo, celulas });
}

const nomeMes = (chave) => {
  const [y, m] = chave.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, 1)));
};

const linhas = [];
linhas.push("# Calendário de divulgação — 1 ano");
linhas.push("");
linhas.push(`Projeção determinística de ${dias} dias a partir de ${hoje}. Horários (BRT): ${HORARIOS.join("h, ")}h.`);
linhas.push("Seta indica o lado do celular no card (← esquerda, → direita).");
linhas.push("");

const CABECALHO = ["Data", ...HORARIOS.map((h) => `${String(h).padStart(2, "0")}h`)].join(" | ");

for (const [chave, entradas] of meses) {
  linhas.push(`## ${nomeMes(chave)}`);
  linhas.push("");
  linhas.push(CABECALHO);
  linhas.push(CABECALHO.replace(/[^|]/g, "-"));
  for (const e of entradas) {
    if (apenasApp) {
      // filtra colunas que não são do app desejado
      const celulas = e.celulas.map((c) => (c.toLowerCase().startsWith(apenasApp.toLowerCase() + " ·") ? c : "—"));
      linhas.push([e.rotulo.padStart(5), ...celulas].join(" | "));
    } else {
      linhas.push([e.rotulo.padStart(5), ...e.celulas].join(" | "));
    }
  }
  linhas.push("");
}

linhas.push("---");
linhas.push("");
linhas.push("Gerado por `scripts/calendario.mjs`. O cron publica automaticamente; este arquivo é a referência visual do que sai em cada horário.");
linhas.push("");

const destino = resolve(RAIZ, "CALENDARIO-1ANO.md");
writeFileSync(destino, linhas.join("\n"));
console.log(`CALENDARIO-1ANO.md gerado (${meses.size} meses, ${dias} dias).`);
