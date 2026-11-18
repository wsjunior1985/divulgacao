#!/usr/bin/env node
// Sugere o `desde` de um vídeo novo no rodízio: simula 110 dias e lista as datas em que NÃO há o mesmo vídeo em slots seguidos,
// com a estreia e o menor intervalo (em slots) entre repetições do mesmo vídeo/app.
// Uso: node scripts/short-ia-desde.mjs <id> [--de 2026-11-18] [--dias 20]
// O id pode já estar em `rodizio` (é movido para o fim na simulação) ou ser novo. Depois grave o `desde` em videos/videos.json e rode `npm test`.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const raiz = resolve(new URL("..", import.meta.url).pathname);
const args = process.argv.slice(2);
const opt = (n, p) => { const i = args.indexOf(`--${n}`); if (i < 0) return p; const v = args[i + 1]; args.splice(i, 2); return v; };
const de = opt("de", new Date(Date.now() + 864e5).toISOString().slice(0, 10)), dias = Number(opt("dias", "20"));
const [id] = args;
if (!id) { console.error("uso: short-ia-desde.mjs <id> [--de AAAA-MM-DD] [--dias 20]"); process.exit(1); }

const m = JSON.parse(readFileSync(resolve(raiz, "videos/videos.json"), "utf8"));
const EPOCA = Date.UTC(2026, 10, 5); // mesma época de scripts/publicar-video-rodizio.mjs
const app = (x) => x.replace(/-(\d|duvida|bomba|teste)$/, "");
const base = m.rodizio.filter((x) => x !== id), R = [...base, id];
const [a, mes, d] = de.split("-").map(Number);
for (let c = 0; c < dias; c++) {
  const cd = new Date(Date.UTC(a, mes - 1, d + c)).toISOString().slice(0, 10);
  const lista = (dia) => R.filter((x) => (x === id ? dia >= cd : !m.videos[x]?.desde || dia >= m.videos[x].desde));
  let prev = null, repete = false, idx = 0, estreia = null, minVideo = 99, minApp = 99;
  const ultV = {}, ultA = {};
  for (let k = 0; k < 110 && !repete; k++) {
    const dt = new Date(Date.UTC(2026, 10, 17 + k)), ds = dt.toISOString().slice(0, 10), dd = Math.floor((dt - EPOCA) / 864e5), l = lista(ds);
    for (const pos of [0, 1]) {
      idx++; const v = l[(dd * 2 + pos) % l.length];
      if (v === prev) repete = true; prev = v;
      if (ds >= cd) { if (ultV[v] !== undefined) minVideo = Math.min(minVideo, idx - ultV[v]); if (ultA[app(v)] !== undefined) minApp = Math.min(minApp, idx - ultA[app(v)]); }
      ultV[v] = idx; ultA[app(v)] = idx;
      if (v === id && !estreia) estreia = `${ds} ${pos ? "19h" : "12h"}`;
    }
  }
  console.log(`${cd}  ${repete ? "REPETE " : "ok     "} estreia ${estreia ?? "-"}  menor intervalo: vídeo ${minVideo} slots, app ${minApp} slots`);
}
