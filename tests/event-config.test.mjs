import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const config = JSON.parse(await readFile(new URL("../event-config.json", import.meta.url), "utf8"));

test("7つのターゲット画像と3Dモデルが同じ番号順に設定されている", () => {
  assert.equal(config.points.length, 7);
  assert.deepEqual(config.points.map(({ targetIndex }) => targetIndex), [0, 1, 2, 3, 4, 5, 6]);
  config.points.forEach((point, index) => {
    const number = String(index + 1).padStart(2, "0");
    assert.match(point.sourceImage, new RegExp(`${number}_`));
    assert.match(point.modelFile, new RegExp(`${number}_`));
  });
  assert.equal(config.completion.requiredStampCount, 7);
  assert.ok(config.ar.missTolerance >= 15);
  assert.match(config.assetVersion, /^\d{8}-\d+$/);
});

test("既存スタンプの保存先とポイントIDを維持する", () => {
  assert.equal(config.event.id, "manmaru-bunkasai-2026");
  assert.deepEqual(config.points.slice(0, 6).map(p => p.id),
    ["pencil", "plus-box", "miraikun", "water-fire", "hero-dog", "futase-memo-stands"]);
  assert.equal(config.points[6].id, "blue-book");
});
