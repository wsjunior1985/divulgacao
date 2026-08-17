// Estado das publicações: garante que uma campanha não seja disparada duas
// vezes na mesma janela. Persistido em marketing/.publish-log.json (gitignored).
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOG_PATH = join(__dirname, ".publish-log.json");

function readLog() {
  try {
    return JSON.parse(readFileSync(LOG_PATH, "utf8"));
  } catch {
    return { entries: {} };
  }
}

function writeLog(log) {
  mkdirSync(dirname(LOG_PATH), { recursive: true });
  writeFileSync(LOG_PATH, JSON.stringify(log, null, 2));
}

function keyFor(channel, campaign) {
  return `${channel}:${campaign}`;
}

/** Última publicação de uma campanha, ou null. */
export function lastPublished(channel, campaign) {
  const log = readLog();
  return log.entries[keyFor(channel, campaign)] ?? null;
}

/** Já publicamos dentro da janela (em horas)? */
export function publishedWithin(channel, campaign, hours) {
  const last = lastPublished(channel, campaign);
  if (!last) return false;
  const age = (Date.now() - new Date(last.at).getTime()) / 3_600_000;
  return age < hours;
}

/** Registra a publicação. */
export function recordPublished(channel, campaign, meta = {}) {
  const log = readLog();
  log.entries[keyFor(channel, campaign)] = {
    at: new Date().toISOString(),
    ...meta,
  };
  writeLog(log);
}
