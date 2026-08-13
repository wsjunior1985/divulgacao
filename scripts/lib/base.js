// base.js — utilitários compartilhados. Zero dependências além do Node.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const FUSO = "America/Sao_Paulo";

const cores = { info: "\x1b[36m", ok: "\x1b[32m", aviso: "\x1b[33m", erro: "\x1b[31m", off: "\x1b[0m" };
const colorido = process.stdout.isTTY && !process.env.NO_COLOR;
const pinta = (cor, txt) => (colorido ? `${cores[cor]}${txt}${cores.off}` : txt);

function carimbo() {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: FUSO,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date());
}

export const log = (msg) => console.log(`${pinta("info", carimbo())} ${msg}`);
export const ok = (msg) => console.log(`${pinta("info", carimbo())} ${pinta("ok", "✓")} ${msg}`);
export const aviso = (msg) => console.warn(`${pinta("info", carimbo())} ${pinta("aviso", "!")} ${msg}`);
export const erro = (msg) => console.error(`${pinta("info", carimbo())} ${pinta("erro", "✗")} ${msg}`);

/** Carrega .env.local (e .env) sem sobrescrever variáveis já definidas no ambiente. */
export function carregarEnv() {
  for (const arquivo of [".env.local", ".env"]) {
    const caminho = resolve(RAIZ, arquivo);
    if (!existsSync(caminho)) continue;
    for (const linha of readFileSync(caminho, "utf8").split(/\r?\n/)) {
      const t = linha.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i <= 0) continue;
      const chave = t.slice(0, i).trim();
      let valor = t.slice(i + 1).trim();
      if ((valor.startsWith('"') && valor.endsWith('"')) || (valor.startsWith("'") && valor.endsWith("'"))) {
        valor = valor.slice(1, -1);
      }
      if (process.env[chave] === undefined) process.env[chave] = valor;
    }
  }
}

export const env = (nome, padrao = "") => process.env[nome]?.trim() || padrao;

export function envObrigatorio(nome) {
  const v = env(nome);
  if (!v) throw new Error(`variável ${nome} não definida`);
  return v;
}

/** Lista de canais habilitados. Padrão: todos. Env CANAIS="instagram,bluesky" restringe. */
export function canaisHabilitados(todos) {
  const bruto = env("CANAIS");
  if (!bruto) return todos;
  const pedidos = bruto.split(",").map((c) => c.trim().toLowerCase()).filter(Boolean);
  const desconhecidos = pedidos.filter((c) => !todos.includes(c));
  if (desconhecidos.length) throw new Error(`canal desconhecido em CANAIS: ${desconhecidos.join(", ")}`);
  return pedidos;
}

export function lerJson(caminhoRelativo, padrao = undefined) {
  const caminho = resolve(RAIZ, caminhoRelativo);
  if (!existsSync(caminho)) {
    if (padrao !== undefined) return padrao;
    throw new Error(`arquivo não encontrado: ${caminhoRelativo}`);
  }
  return JSON.parse(readFileSync(caminho, "utf8"));
}

export function gravarJson(caminhoRelativo, dados) {
  const caminho = resolve(RAIZ, caminhoRelativo);
  mkdirSync(dirname(caminho), { recursive: true });
  writeFileSync(caminho, `${JSON.stringify(dados, null, 2)}\n`);
}

/** Data/hora de parede em São Paulo, como partes numéricas. */
export function agoraBRT(data = new Date()) {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: FUSO,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
      .formatToParts(data)
      .filter((p) => p.type !== "literal")
      .map((p) => [p.type, Number(p.value)]),
  );
  // Intl devolve 24 para meia-noite em alguns runtimes; normaliza para 0.
  const hora = partes.hour === 24 ? 0 : partes.hour;
  const dia = `${partes.year}-${String(partes.month).padStart(2, "0")}-${String(partes.day).padStart(2, "0")}`;
  return { dia, hora, minuto: partes.minute, iso: `${dia}T${String(hora).padStart(2, "0")}:00` };
}

export const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

/** fetch com tentativas para erros transitórios (rede, 429, 5xx). */
export async function buscar(url, opcoes = {}, { tentativas = 3, esperaMs = 2000 } = {}) {
  let ultimoErro;
  for (let i = 0; i < tentativas; i++) {
    try {
      const res = await fetch(url, opcoes);
      if (res.status === 429 || res.status >= 500) {
        ultimoErro = new Error(`HTTP ${res.status} em ${new URL(url).host}`);
        if (i < tentativas - 1) {
          await dormir(esperaMs * (i + 1));
          continue;
        }
      }
      return res;
    } catch (e) {
      ultimoErro = e;
      if (i < tentativas - 1) await dormir(esperaMs * (i + 1));
    }
  }
  throw ultimoErro;
}
