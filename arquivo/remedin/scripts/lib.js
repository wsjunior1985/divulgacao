// lib.js — utilitários para a automação de divulgação do Remedin.
// Zero dependências: usa apenas Node global fetch.

import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

export function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

export function warn(msg) {
  console.warn(`[${new Date().toISOString()}] WARN ${msg}`);
}

export function error(msg) {
  console.error(`[${new Date().toISOString()}] ERROR ${msg}`);
}

// Carrega variáveis de um arquivo .env simples (sem dependências).
export function loadDotenv(file = resolve(ROOT, ".env.local")) {
  if (!existsSync(file)) return;
  const raw = readFileSync(file, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

export function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Variável de ambiente ${name} não definida`);
  return v;
}

export function env(name, fallback = "") {
  return process.env[name] || fallback;
}

export function readJson(path) {
  return JSON.parse(readFileSync(resolve(ROOT, path), "utf8"));
}

export function writeJson(path, obj) {
  const full = resolve(ROOT, path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, JSON.stringify(obj, null, 2));
}

export { ROOT };
