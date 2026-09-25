import test from "node:test";
import assert from "node:assert/strict";
import { addStamp, countValidStamps, createEmptyProgress, createStampStore, storageKey } from "../js/stamp-store.js";

test("同じポイントを複数回追加しても1スタンプとして数える", () => {
  let progress = createEmptyProgress("event-1");
  progress = addStamp(progress, "point-1", "2026-01-01T00:00:00.000Z");
  progress = addStamp(progress, "point-1", "2026-01-02T00:00:00.000Z");
  assert.equal(countValidStamps(progress, ["point-1"]), 1);
  assert.equal(progress.stamps["point-1"], "2026-01-01T00:00:00.000Z");
});

test("イベントごとに保存領域を分離する", () => {
  const values = new Map();
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key)
  };
  const store = createStampStore("event-a", storage);
  store.save(addStamp(store.load(), "point-1", "2026-01-01T00:00:00.000Z"));
  assert.equal(values.has(storageKey("event-a")), true);
  assert.equal(createStampStore("event-b", storage).load().stamps["point-1"], undefined);
});

test("保存済みスタンプをリセットできる", () => {
  const values = new Map();
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key)
  };
  const store = createStampStore("event-a", storage);
  store.save(addStamp(store.load(), "point-1", "2026-01-01T00:00:00.000Z"));
  store.clear();
  assert.equal(countValidStamps(store.load(), ["point-1"]), 0);
});
