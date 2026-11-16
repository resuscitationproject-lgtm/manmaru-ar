import test from "node:test";
import assert from "node:assert/strict";
import { isComplete } from "../js/completion.js";

const config = { points: Array.from({ length: 7 }, (_, i) => ({ id: `point-${i}` })), completion: { requiredStampCount: 7 } };
const saved = (ids) => ({ stamps: Object.fromEntries(ids.map(id => [id, "2026-11-16T00:00:00.000Z"])) });

test("現在の7ポイントを取得した保存記録で達成し、未取得と削除済みポイントは区別する", () => {
  const ids = config.points.map(p => p.id);
  assert.equal(isComplete(saved(ids), config), true);
  assert.equal(isComplete(saved([...ids.slice(0, 6), "environment-guide"]), config), false);
  assert.equal(isComplete(saved([]), config), false);
});

test("重複ポイントや不正な達成条件で誤って達成にしない", () => {
  assert.equal(isComplete(saved(["one"]), { points: Array(7).fill({ id: "one" }), completion: { requiredStampCount: 7 } }), false);
  assert.equal(isComplete(saved([]), { ...config, completion: { requiredStampCount: 0 } }), false);
});
