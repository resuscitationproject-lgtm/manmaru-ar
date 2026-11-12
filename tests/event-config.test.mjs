import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {expandImageTargets} from "../js/image-targets.js";
import {countValidStamps, normalizeProgress} from "../js/stamp-store.js";

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

test("削除前の8点の保存記録でも、残り7点を維持して7点満了として扱う", () => {
  const stamps=Object.fromEntries([...config.points.map(p=>p.id),"environment-guide"].map(id=>[id,"2026-11-09T00:00:00.000Z"]));
  const saved={version:1,eventId:config.event.id,stamps,updatedAt:null};
  const restored=normalizeProgress(saved,config.event.id);
  assert.equal(countValidStamps(restored,config.points.map(p=>p.id)),7);
  for(const point of config.points)assert.equal(restored.stamps[point.id],stamps[point.id]);
  assert.ok(!config.points.some(p=>p.id==="environment-guide"));
});

test("カメ会長のPOPを補助画像として追加し、スタンプ数と1.7倍表示を保つ", () => {
 const expanded=expandImageTargets(config.points);
 assert.equal(expanded.length,8);assert.equal(new Set(expanded.map(p=>p.id)).size,7);
 assert.deepEqual(expanded.map(p=>p.targetIndex),[0,1,2,3,4,5,6,7]);
 const pop=expanded[7];assert.equal(pop.id,config.points[5].id);
 assert.equal(pop.modelFile,config.points[5].modelFile);assert.equal(pop.modelScale,.612);
 assert.equal(pop.sourceImage,'./assets/targets/06_kame_kaicho_pop.png');
 assert.equal(config.completion.requiredStampCount,7);
});
