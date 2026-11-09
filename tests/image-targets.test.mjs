import assert from 'node:assert/strict';
import test from 'node:test';
import {expandImageTargets} from '../js/image-targets.js';
test('POP補助画像も同じスタンプに関連付け、既存順序を保つ',()=>{
 const points=[{id:'one',targetIndex:0,modelFile:'one.glb'},
   {id:'kame',targetIndex:1,modelFile:'kame.glb',modelScale:.612,targetVariants:[{targetIndex:2,modelPosition:'0 0.1 0'}]}];
 const result=expandImageTargets(points);
 assert.deepEqual(result.map(p=>p.targetIndex),[0,1,2]);
 assert.deepEqual(result.map(p=>p.id),['one','kame','kame']);
 assert.equal(result[2].modelFile,'kame.glb');assert.equal(result[2].modelScale,.612);
 assert.equal(result[2].modelPosition,'0 0.1 0');assert.equal(points.length,2);
});
test('誤ったターゲット番号や重複を拒否する',()=>{
 for(const i of [-1,0,.5])assert.throws(()=>expandImageTargets([{id:'one',targetIndex:0,targetVariants:[{targetIndex:i}]}]));
});
