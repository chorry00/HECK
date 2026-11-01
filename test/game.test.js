import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGame,roll,choose,bank,next,target,fail,score,cpuAction,worms} from '../game.js';
test('同じ目を全て確保し再選択できない',()=>{const s=createGame();roll(s,()=>0);assert.equal(s.dice.length,8);choose(s,1);assert.equal(s.kept.length,8);assert.equal(choose(s,1),false);bank(s);assert.equal(s.phase,'between');});
test('中央の一致を優先、その後横取り、その後最大の下位タイル',()=>{const s=createGame();s.kept=[6,6,6,5,1];assert.deepEqual(target(s),{tile:21,from:-1});s.center=s.center.filter(n=>n!==21);s.players[1].stack=[21];assert.deepEqual(target(s),{tile:21,from:1});s.kept=[6,6,6,5,3];assert.deepEqual(target(s),{tile:23,from:-1});s.center=s.center.filter(n=>n!==23);assert.deepEqual(target(s),{tile:22,from:-1});});
test('下に埋まったタイルと自分の一番上は横取りできない',()=>{const s=createGame();s.kept=[6,6,6,5,1];s.center=s.center.filter(n=>n!==21);s.players[1].stack=[21,22];s.players[0].stack=[21];assert.equal(target(s),null);});
test('失敗では返却前の最大タイルを裏返す',()=>{const s=createGame();s.center=[21,22];s.players[0].stack=[30,36];fail(s,'失敗');assert.deepEqual(s.center,[21,36]);assert.deepEqual(s.down,[22]);assert.deepEqual(s.players[0].stack,[30]);});
test('虫なしと選択不能で失敗、虫は5点',()=>{const s=createGame();s.kept=[5,5,5,5,5];assert.equal(target(s),null);s.kept=[1];roll(s,()=>0);assert.equal(s.phase,'between');const t=createGame();t.kept=[6,6,6,6,1];bank(t);assert.deepEqual(t.players[0].stack,[21]);});
test('横取りと終了・得点',()=>{const s=createGame();s.center=[];s.players[1].stack=[21];s.kept=[6,6,6,6,1];bank(s);assert.equal(s.phase,'over');assert.equal(score(s.players[0]),1);assert.equal(s.players[1].stack.length,0);assert.equal(worms(36),4);});
test('CPUによるゲーム完走と全16枚の保存則',()=>{for(let game=0;game<30;game++){const s=createGame(game%2?4:3);let steps=0;while(s.phase!=='over'&&steps++<10000){if(s.phase==='between')next(s);else cpuAction(s);const tiles=[...s.center,...s.down,...s.players.flatMap(p=>p.stack)];assert.equal(tiles.length,16);assert.equal(new Set(tiles).size,16);}assert.equal(s.phase,'over');}});

test('手持ちがない失敗では中央も裏向きタイルも変化しない',()=>{
 for(const kind of ['直接失敗','選べる目なし','虫なし','獲得不可']){
  const s=createGame();s.center=[21,22,35];s.down=[36];
  if(kind==='選べる目なし'){s.kept=[1];roll(s,()=>0);}
  else if(kind==='虫なし'){s.kept=[5,5,5,5,5];bank(s);}
  else if(kind==='獲得不可'){s.kept=[6,1];bank(s);}
  else fail(s,'失敗');
  assert.deepEqual(s.center,[21,22,35],kind);assert.deepEqual(s.down,[36],kind);
  assert.deepEqual(s.players[0].stack,[],kind);assert.equal(s.phase,'between',kind);
  assert.doesNotMatch(s.log[0],/裏返し|返却/,kind);
 }
});
