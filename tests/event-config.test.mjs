import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const config = JSON.parse(await readFile(new URL("../event-config.json", import.meta.url), "utf8"));

test("5つの原画と3Dモデルが同じ番号順に設定されている", () => {
  assert.equal(config.points.length, 5);
  assert.deepEqual(config.points.map(({ targetIndex }) => targetIndex), [0, 1, 2, 3, 4]);
  config.points.forEach((point, index) => {
    const number = String(index + 1).padStart(2, "0");
    assert.match(point.sourceImage, new RegExp(`${number}_`));
    assert.match(point.modelFile, new RegExp(`${number}_`));
    assert.equal(point.modelMagnification, 3);
  });
  assert.equal(config.completion.requiredStampCount, 5);
});
