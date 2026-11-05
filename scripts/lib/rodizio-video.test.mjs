import test from "node:test";
import assert from "node:assert/strict";
import { pautaDoSlot, sequencia } from "../publicar-video-rodizio.mjs";

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
