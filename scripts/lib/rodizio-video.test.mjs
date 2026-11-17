import test from "node:test";
import assert from "node:assert/strict";
import { pautaDoSlot, sequencia } from "../publicar-video-rodizio.mjs";
import { montarShort, pronto } from "../canais/youtube.js";

const lista = ["a", "b", "c"];

test("two slots per day walk the list in order and cycle", () => {
  assert.equal(sequencia("2026-11-05", 0), 0);
  assert.equal(sequencia("2026-11-05", 1), 1);
  assert.equal(sequencia("2026-11-06", 0), 2);
  assert.deepEqual(pautaDoSlot(lista, "2026-11-05", 0), { seq: 0, app: "a", ciclo: 1 });
  assert.deepEqual(pautaDoSlot(lista, "2026-11-06", 0), { seq: 2, app: "c", ciclo: 1 });
  assert.deepEqual(pautaDoSlot(lista, "2026-11-06", 1), { seq: 3, app: "a", ciclo: 2 });
});

test("dates before the start are rejected", () => {
  assert.throws(() => sequencia("2026-11-04", 0));
});


test("short title keeps the #Shorts suffix within 100 characters", () => {
  const curto = montarShort({ titulo: "Conheça a WaldeApps", nome: "WaldeApps", legenda: "Olá <b>mundo</b>" });
  assert.equal(curto.titulo, "Conheça a WaldeApps | WaldeApps #Shorts");
  assert.ok(curto.descricao.endsWith("#Shorts"));
  assert.ok(!curto.descricao.includes("<b>"));
  const longo = montarShort({ titulo: "x".repeat(200), nome: "App", legenda: "" });
  assert.ok(longo.titulo.length <= 100);
  assert.ok(longo.titulo.endsWith(" #Shorts"));
});

test("short strips angle brackets and keeps the description under 5000 bytes", () => {
  const s = montarShort({ titulo: "A <b>e</b> B > C", nome: "X", legenda: "ç".repeat(6000) });
  assert.ok(!/[<>]/.test(s.titulo));
  assert.ok(Buffer.byteLength(s.descricao, "utf8") <= 5000);
  assert.ok(s.descricao.endsWith("#Shorts"));
});

test("youtube channel is skipped when credentials are missing", () => {
  for (const n of ["YOUTUBE_CLIENT_ID", "YOUTUBE_CLIENT_SECRET", "YOUTUBE_REFRESH_TOKEN"]) delete process.env[n];
  assert.equal(pronto().ok, false);
});

test("short uses the manifest search title, opening line and tags", () => {
  const s = montarShort({
    titulo: "Genérico", nome: "App", youtube: { titulo: "Gasolina ou etanol? Qual compensa", abertura: "Abertura <b>x</b>", tags: ["a", "b".repeat(300), "c".repeat(300)] },
    legenda: "Gancho\n\nExplicação repetida\n\nAviso do vídeo\n\nhttps://x.com/?utm_source=youtube",
  });
  assert.equal(s.titulo, "Gasolina ou etanol? Qual compensa #Shorts");
  assert.ok(s.descricao.startsWith("Abertura x"));
  assert.ok(!s.descricao.includes("Explicação repetida"));
  assert.ok(s.descricao.includes("utm_source=youtube"));
  assert.deepEqual(s.tags.length, 2);
});
