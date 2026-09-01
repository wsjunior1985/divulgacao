import test from "node:test";
import assert from "node:assert/strict";
import { escolherPauta, escolherPautaPorApp } from "./conteudo.js";

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
