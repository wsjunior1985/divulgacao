// Carregador de configuração da automação de marketing.
//
// Lê `marketing/.env.marketing` (gitignored) e as variáveis de ambiente do
// processo. Precedência: variável de ambiente > arquivo .env.marketing.
// Nunca imprime valores de credenciais.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MARKETING_ROOT = join(__dirname, "..");

function parseDotEnv(text) {
  const out = {};
  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key) out[key] = value;
  }
  return out;
}

let _fileEnv;
function fileEnv() {
  if (_fileEnv) return _fileEnv;
  try {
    const raw = readFileSync(join(MARKETING_ROOT, ".env.marketing"), "utf8");
    _fileEnv = parseDotEnv(raw);
  } catch {
    _fileEnv = {};
  }
  return _fileEnv;
}

/** Lê uma variável (env > .env.marketing). */
export function env(name) {
  const v = process.env[name];
  if (v !== undefined && v !== "") return v;
  return fileEnv()[name] ?? undefined;
}

/** Mensagem de setup para chave ausente. */
export function missingMsg(name, hint) {
  return `Falta ${name}${hint ? ` (${hint})` : ""}. Veja marketing/SETUP.md.`;
}

/** Retorna { ok, value } ou { ok:false, error } para uma chave obrigatória. */
export function requireEnv(name, hint) {
  const value = env(name);
  if (!value) return { ok: false, error: missingMsg(name, hint) };
  return { ok: true, value };
}

/**
 * Obtém o link base do app com parâmetros UTM para rastreio de campanha.
 * Se MARKETING_REF estiver configurado (user_id do indicador), injeta ?ref=.
 */
export function appLink({ source, medium, campaign }) {
  const params = [
    source && `utm_source=${encodeURIComponent(source)}`,
    medium && `utm_medium=${encodeURIComponent(medium)}`,
    campaign && `utm_campaign=${encodeURIComponent(campaign)}`,
  ].filter(Boolean);

  const ref = env("MARKETING_REF");
  const base = ref
    ? `https://vaidarquanto.com.br/?ref=${encodeURIComponent(ref)}`
    : "https://vaidarquanto.com.br/";

  if (params.length === 0) return base;
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}${params.join("&")}`;
}

export const APP_URL = "https://vaidarquanto.com.br";
export const PREMIUM_MONTHLY = "R$ 9,90/mês";
export const PREMIUM_ANNUAL = "R$ 79/ano";
export const CONTACT_EMAIL = "wsjunior@gmail.com";
