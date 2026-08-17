// runner.js — agenda e publica os posts do manifest marketing/posts.json.
//
// Uso:
//   node scripts/divulgacao/runner.js                # posts de HOJE
//   node scripts/divulgacao/runner.js --date 2026-08-13
//   node scripts/divulgacao/runner.js --force        # reposta mesmo se já postado
//   node scripts/divulgacao/runner.js --dry-run      # só mostra o que faria
//   node scripts/divulgacao/runner.js --channels instagram,facebook,tiktok
//
// Tokens são lidos de .env.local (local) ou variáveis de ambiente (GitHub Actions).

import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { ROOT, loadDotenv, readJson, writeJson, log, warn, error } from "./lib.js";
import { postMeta } from "./meta.js";
import { postTikTok } from "./tiktok.js";

loadDotenv();

function parseArgs(argv) {
  const out = { channels: null, date: null, force: false, dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--date") out.date = argv[++i];
    else if (a === "--force") out.force = true;
    else if (a === "--dry-run") out.dryRun = true;
    else if (a === "--channels") out.channels = argv[++i]?.split(",").map((s) => s.trim());
  }
  return out;
}

function todayBRT() {
  const now = new Date();
  const s = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  return s; // YYYY-MM-DD
}

function parseTimeToISO(date, time) {
  return new Date(`${date}T${time || "00:00"}:00-03:00`).toISOString();
}

async function uploadToSupabase(file) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key)
    throw new Error("SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY ausentes p/ subir mídia");
  const bucket = process.env.MEDIA_BUCKET || "marketing";
  const { readFileSync } = await import("node:fs");
  const buf = readFileSync(file);
  const name = file.split("/").pop();
  const res = await fetch(`${url}/storage/v1/object/${bucket}/${name}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/octet-stream",
    },
    body: buf,
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Falha ao subir mídia no Supabase (${res.status}): ${txt.slice(0, 200)}`);
  }
  const publicUrl = `${url}/storage/v1/object/public/${bucket}/${name}`;
  log(`mídia no Supabase: ${publicUrl}`);
  return publicUrl;
}

async function resolveMedia(media) {
  const urls = [];
  for (const m of media || []) {
    if (/^https?:\/\//.test(m)) {
      urls.push(m);
    } else {
      const file = resolve(ROOT, m);
      if (!existsSync(file)) throw new Error(`Mídia não encontrada: ${m}`);
      if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        urls.push(await uploadToSupabase(file));
      } else if (process.env.MEDIA_UPLOAD_HOST) {
        urls.push(await uploadTemp(file));
      } else {
        throw new Error(
          `Mídia local sem destino público. Configure SUPABASE_SERVICE_ROLE_KEY (recomendado) ou MEDIA_UPLOAD_HOST.`,
        );
      }
    }
  }
  return urls;
}

async function uploadTemp(file) {
  const host = process.env.MEDIA_UPLOAD_HOST || "https://0x0.st";
  const { readFileSync } = await import("node:fs");
  const buf = readFileSync(file);
  const form = new FormData();
  form.append("file", new Blob([buf]), file.split("/").pop());
  const res = await fetch(host, { method: "POST", body: form });
  if (!res.ok) throw new Error(`Falha ao subir mídia em ${host}: ${res.status}`);
  const url = (await res.text()).trim();
  log(`mídia temporária: ${url}`);
  return url;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const manifest = readJson("marketing/posts.json");
  const targetDate = args.date || todayBRT();
  const stateFile = "marketing/.posted.json";
  const state = existsSync(resolve(ROOT, stateFile)) ? readJson(stateFile) : {};

  const posts = manifest.posts.filter((p) => p.date === targetDate);
  if (!posts.length) {
    log(`Nenhum post para ${targetDate}.`);
    return;
  }

  log(`Processando ${posts.length} post(s) de ${targetDate} (dry-run=${args.dryRun})`);
  const summary = [];

  for (const post of posts) {
    const channels = (args.channels || post.channels).filter((c) =>
      (post.channels || []).includes(c),
    );
    if (!channels.length) {
      warn(`post ${post.id}: nenhum canal habilitado para hoje — pulado`);
      continue;
    }

    const stateKey = `${post.id}`;
    const postedChannels = state[stateKey] || [];
    const alreadyPosted = post.channels.every((c) => postedChannels.includes(c));
    if (alreadyPosted && !args.force) {
      log(`post ${post.id}: já postado em todos os canais — pulado (use --force)`);
      continue;
    }

    try {
      if (args.dryRun) {
        const mediaCount = post.media?.length ?? 0;
        log(`DRY-RUN post ${post.id}: canais=${channels.join(",")} media=${mediaCount}`);
        continue;
      }
      const mediaUrls = post.media?.length ? await resolveMedia(post.media) : [];

      const results = [];
      const metaRes = await postMeta({
        channels,
        caption: post.caption,
        mediaUrls,
        link: post.link,
      });
      results.push(...metaRes.posted);
      const tiktokRes = await postTikTok({ channels, caption: post.caption, mediaUrls });
      results.push(...tiktokRes.posted);

      state[stateKey] = [...new Set(results.map((r) => r.channel))];
      writeJson(stateFile, state);
      summary.push({ id: post.id, channels: state[stateKey] });
      log(`post ${post.id}: publicado (${state[stateKey].join(", ")})`);
    } catch (e) {
      error(`post ${post.id}: ${e.message}`);
    }
  }

  log(`Resumo: ${summary.length ? JSON.stringify(summary) : "nada publicado"}`);
}

main().catch((e) => {
  error(e.message || String(e));
  process.exit(1);
});
