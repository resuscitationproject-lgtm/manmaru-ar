import assert from "node:assert/strict";
import test from "node:test";
import { canDisplayModel, syncModelVisibility, syncRendererSize } from "../js/ar-display.js";

function fixture() {
  const calls = [];
  const child = () => ({setAttribute: (...args) => calls.push(args)});
  const target = {object3D: {visible: true, matrix: {elements: [1,0,0,0,0,1,0,0,0,0,1,0,0,0,-2,1]}},
    setAttribute() { throw new Error("MindAR管理の親を変更してはいけない"); }};
  const entry = {target, targetVisible: true, modelReady: true, modelError: false,
    shadow: child(), popRig: child(), model: child()};
  const scene = {canvas: {width: 0, height: 0}, camera: {projectionMatrix: {elements: [42]}},
    renderer: {getSize: v => v.set(0, 0), setSize(w,h,css) {
      assert.equal(css, false); scene.canvas.width=w;scene.canvas.height=h;
    }, getContext: () => ({isContextLost: () => false})}};
  return {entry, scene, calls};
}

test("非表示で0×0になった描画領域を直し、カメラ投影を変更しない", () => {
  const {scene}=fixture();
  assert.equal(syncRendererSize(scene,{clientWidth:480,clientHeight:620}),true);
  assert.deepEqual(scene.canvas,{width:480,height:620});
  assert.deepEqual(scene.camera.projectionMatrix.elements,[42]);
});
test("隠れている間は正しいバッファを0×0に上書きしない", () => {
  const {scene}=fixture();scene.canvas.width=480;scene.canvas.height=620;
  assert.equal(syncRendererSize(scene,{clientWidth:0,clientHeight:0}),false);
  assert.deepEqual(scene.canvas,{width:480,height:620});
});
test("正常な高DPIバッファは何度も作り直さない", () => {
  const {scene}=fixture();scene.canvas.width=960;scene.canvas.height=1240;
  scene.renderer.getSize=v=>v.set(480,620);
  scene.renderer.setSize=()=>{throw new Error("不要な描画サイズ更新");};
  assert.equal(syncRendererSize(scene,{clientWidth:480,clientHeight:620}),true);
});
test("追跡ロスト後の読込完了でも親の状態を変更しない", () => {
  const {entry,calls}=fixture();entry.targetVisible=false;entry.target.object3D.visible=false;
  entry.target.object3D.matrix.elements.fill(0);
  assert.equal(syncModelVisibility(entry),false);
  assert.equal(entry.target.object3D.visible,false);
  assert.ok(entry.target.object3D.matrix.elements.every(v=>v===0));
  assert.deepEqual(calls,[["visible",false],["visible",false],["visible",false]]);
  entry.targetVisible=true;
  assert.equal(syncModelVisibility(entry),true);
  assert.equal(entry.target.object3D.visible,false);
});
test("読込済みだけでは表示中にせず、実追跡・描画サイズ・WebGLを確認する", () => {
  const {entry,scene}=fixture();
  assert.equal(canDisplayModel(entry,scene),false);
  syncRendererSize(scene,{clientWidth:480,clientHeight:620});
  assert.equal(canDisplayModel(entry,scene),true);
  entry.target.object3D.matrix.elements.fill(0);
  assert.equal(canDisplayModel(entry,scene),false);
  entry.target.object3D.matrix.elements[15]=1;
  entry.target.object3D.matrix.elements[0]=NaN;
  assert.equal(canDisplayModel(entry,scene),false);
});
