import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function readGlbDocument(relativePath) {
  const input = await readFile(new URL(relativePath, import.meta.url));
  assert.equal(input.toString("ascii", 0, 4), "glTF");
  assert.equal(input.readUInt32LE(8), input.length);
  const jsonLength = input.readUInt32LE(12);
  return JSON.parse(input.subarray(20, 20 + jsonLength).toString("utf8").trim());
}

test("二瀬窯業の集合モデルは相対配置を保つ1つの親要素で拡大されている", async () => {
  const document = await readGlbDocument("../assets/models/06_futase_memo_stands.glb");
  const scene = document.scenes[document.scene || 0];
  assert.equal(document.asset.extras.manmaruScaleFactor, 6);
  assert.equal(scene.nodes.length, 1);

  const wrapper = document.nodes[scene.nodes[0]];
  assert.equal(wrapper.name, "AR_SCALE_6X");
  assert.deepEqual(wrapper.scale, [6, 6, 6]);
  assert.equal(wrapper.children.length, 31);
});
