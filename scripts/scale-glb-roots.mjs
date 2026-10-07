import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const factor = Number(process.argv[2]);
const files = process.argv.slice(3);
if (!Number.isFinite(factor) || factor <= 0) throw new Error("倍率を正の数で指定してください");
if (files.length === 0) throw new Error("倍率に続けてGLBファイルを指定してください");

for (const file of files) {
  const input = await readFile(file);
  if (input.toString("ascii", 0, 4) !== "glTF") throw new Error(`${file} はGLBではありません`);
  const version = input.readUInt32LE(4);
  if (version !== 2) throw new Error(`${file} のGLBバージョンは未対応です`);

  const jsonLength = input.readUInt32LE(12);
  const jsonType = input.readUInt32LE(16);
  if (jsonType !== 0x4e4f534a) throw new Error(`${file} のJSONチャンクが見つかりません`);
  const document = JSON.parse(input.subarray(20, 20 + jsonLength).toString("utf8").trim());
  document.asset.extras ||= {};
  if (document.asset.extras.manmaruScaleFactor === factor) {
    console.log(`${path.basename(file)}: 既に${factor}倍です`);
    continue;
  }
  if (document.asset.extras.manmaruScaleFactor) throw new Error(`${file} は別倍率で加工済みです`);

  const scene = document.scenes[document.scene || 0];
  for (const nodeIndex of scene.nodes || []) {
    const node = document.nodes[nodeIndex];
    if (node.matrix) {
      for (const index of [0, 1, 2, 4, 5, 6, 8, 9, 10]) node.matrix[index] *= factor;
    } else {
      node.scale = (node.scale || [1, 1, 1]).map((value) => value * factor);
    }
  }
  document.asset.extras.manmaruScaleFactor = factor;

  const json = Buffer.from(JSON.stringify(document), "utf8");
  const paddedLength = Math.ceil(json.length / 4) * 4;
  const jsonChunk = Buffer.alloc(paddedLength, 0x20);
  json.copy(jsonChunk);
  const remaining = input.subarray(20 + jsonLength);
  const output = Buffer.alloc(12 + 8 + paddedLength + remaining.length);
  output.write("glTF", 0, "ascii");
  output.writeUInt32LE(2, 4);
  output.writeUInt32LE(output.length, 8);
  output.writeUInt32LE(paddedLength, 12);
  output.writeUInt32LE(0x4e4f534a, 16);
  jsonChunk.copy(output, 20);
  remaining.copy(output, 20 + paddedLength);
  await writeFile(file, output);
  console.log(`${path.basename(file)}: ルートを${factor}倍にしました`);
}
