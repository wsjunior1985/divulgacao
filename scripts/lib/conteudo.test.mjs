import test from "node:test";
import assert from "node:assert/strict";
import { escolherPauta, escolherPautaPorApp, postsDoApp } from "./conteudo.js";

const apps = [
  { id: "remedin", posts: [{ id: "r" }] },
  { id: "gasonol", posts: [{ id: "g1" }, { id: "g2" }] },
  { id: "convertendo", posts: [{ id: "c" }] },
];

test("campaign selection keeps the requested app and varies its topic", () => {
  const first = escolherPautaPorApp(20, apps, "gasonol");
  const second = escolherPautaPorApp(21, apps, "gasonol");

  assert.equal(first.app.id, "gasonol");
  assert.equal(second.app.id, "gasonol");
  assert.notEqual(first.post.id, second.post.id);
});

test("default rotation remains unchanged", () => {
  assert.equal(escolherPauta(1, apps).app.id, "gasonol");
});

test("seasonal themes dominate inside the window and vanish outside it", () => {
  const app = { id: "p", posts: [{ id: "fixo" }, { id: "natal", sazonal: { de: "2026-11-05", ate: "2026-12-25" } }] };
  assert.deepEqual(postsDoApp(app, "2026-11-05").map((p) => p.id), ["natal"]);
  assert.deepEqual(postsDoApp(app, "2026-12-25").map((p) => p.id), ["natal"]);
  assert.deepEqual(postsDoApp(app, "2026-12-26").map((p) => p.id), ["fixo"]);
  assert.deepEqual(postsDoApp(app, "2026-11-04").map((p) => p.id), ["fixo"]);
  assert.deepEqual(postsDoApp(app).map((p) => p.id), ["fixo"]);
  const pauta = escolherPauta(0, [app], "2026-12-01");
  assert.equal(pauta.post.id, "natal");
});
