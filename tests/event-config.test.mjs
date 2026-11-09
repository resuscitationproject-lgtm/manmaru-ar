import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {expandImageTargets} from "../js/image-targets.js";

const config = JSON.parse(await readFile(new URL("../event-config.json", import.meta.url), "utf8"));

test("8つのターゲット画像と3Dモデルが同じ番号順に設定されている", () => {
  assert.equal(config.points.length, 8);
  assert.deepEqual(config.points.map(({ targetIndex }) => targetIndex), [0, 1, 2, 3, 4, 5, 6, 7]);
  config.points.forEach((point, index) => {
    const number = String(index + 1).padStart(2, "0");
    assert.match(point.sourceImage, new RegExp(`${number}_`));
    assert.match(point.modelFile, new RegExp(`${number}_`));
  });
  assert.equal(config.completion.requiredStampCount, 8);
  assert.ok(config.ar.missTolerance >= 15);
  assert.match(config.assetVersion, /^\d{8}-\d+$/);
});

test("二瀬窯業のポイントはカメ会長へ差し替え、希望コメントを設定する", () => {
  const point=config.points[5];
  assert.equal(point.id,"futase-memo-stands"); // Existing stamp storage key remains unchanged.
  assert.equal(point.targetIndex,5);
  assert.equal(point.name,"二瀬窯業 カメ会長");
  assert.equal(point.sourceImage,"./assets/targets/06_kame_kaicho.png");
  assert.equal(point.modelFile,"./assets/models/06_kame_kaicho.glb");
  assert.equal(point.acquiredMessage,"素敵なメモスタンドを作りましょう！");
  assert.equal(point.stampMessage,point.acquiredMessage);
});

test("カメ会長だけを従来の1.7倍に拡大する", () => {
  assert.ok(Math.abs(config.points[5].modelScale / 0.36 - 1.7) < 1e-12);
  assert.deepEqual(config.points.slice(0,7).filter((_,i)=>i!==5).map(p=>p.modelScale),
    [0.34,0.38,0.36,0.38,0.32,0.36]);
});

test("既存スタンプの保存先とポイントIDを維持する", () => {
  assert.equal(config.event.id, "manmaru-bunkasai-2026");
  assert.deepEqual(config.points.slice(0, 6).map(p => p.id),
    ["pencil", "plus-box", "miraikun", "water-fire", "hero-dog", "futase-memo-stands"]);
  assert.equal(config.points[6].id, "blue-book");
});

test("ていたん画像を8番目の案内人モデルへ関連付ける", () => {
  const point=config.points[7];
  assert.equal(point.id,"environment-guide");
  assert.equal(point.targetIndex,7);
  assert.equal(point.sourceImage,"./assets/targets/08_teitan.png");
  assert.equal(point.displayImage,"./assets/targets/08_teitan_full.png");
  assert.equal(point.modelFile,"./assets/models/08_environment_guide.glb");
  assert.equal(point.modelScale,0.5);
});

test("カメ会長のPOPを補助画像として追加し、スタンプ数と1.7倍表示を保つ", () => {
 const expanded=expandImageTargets(config.points);
 assert.equal(expanded.length,9);assert.equal(new Set(expanded.map(p=>p.id)).size,8);
 assert.deepEqual(expanded.map(p=>p.targetIndex),[0,1,2,3,4,5,6,7,8]);
 const pop=expanded[8];assert.equal(pop.id,config.points[5].id);
 assert.equal(pop.modelFile,config.points[5].modelFile);assert.equal(pop.modelScale,.612);
 assert.equal(pop.sourceImage,'./assets/targets/06_kame_kaicho_pop.png');
 assert.equal(config.completion.requiredStampCount,8);
});
