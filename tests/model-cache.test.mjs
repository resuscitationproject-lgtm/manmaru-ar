import assert from 'node:assert/strict';
import test from 'node:test';
import {createModelCache} from '../js/model-cache.js';
test('原画とPOPで同じ3Dを1回だけ読み、後から検出した画像にも共有する',()=>{
 const starts=[],attached=[];const cache=createModelCache({start:(e,u)=>starts.push([e,u]),attach:(e,m)=>attached.push([e,m]),fail:()=>{}});
 const original={},pop={},again={},mesh={};cache.request('kame',original);cache.request('kame',pop);
 assert.equal(starts.length,1);cache.loaded('kame',original,mesh);
 assert.deepEqual(attached,[[pop,mesh]]);cache.request('kame',again);
 assert.deepEqual(attached,[[pop,mesh],[again,mesh]]);
 cache.loaded('kame',pop,{});assert.equal(attached.length,2);
});
test('失敗を共有先へ伝え、再試行が可能',()=>{
 const starts=[],failed=[];const cache=createModelCache({start:e=>starts.push(e),attach:()=>{},fail:(e,error)=>failed.push([e,error])});
 const first={},second={};cache.request('kame',first);cache.request('kame',second);cache.failed('kame',first,'network');
 assert.deepEqual(failed,[[second,'network']]);cache.request('kame',second);assert.equal(starts.length,2);
});
