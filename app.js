import {createGame,roll,choose,bank,next,cpuAction,available,total,target,score,worms} from './game.js';
const $=id=>document.getElementById(id);
let state;try{state=JSON.parse(localStorage.getItem('heck-v1'));if(!state?.players||!state.phase)state=null;}catch{}
let timer, rolling=null;
function beginRoll(){
 if(rolling||state.phase!=='roll'||state.kept.length===8)return;
 clearTimeout(timer);
 const session={state,faces:Array.from({length:8-state.kept.length},()=>1+Math.floor(Math.random()*6))};
 rolling=session;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const shuffle=setInterval(()=>{
  if(rolling!==session)return;
  document.querySelectorAll('#dice .die').forEach(d=>{d.innerHTML=face(1+Math.floor(Math.random()*6));});
 },90);
 setTimeout(()=>{
  clearInterval(shuffle);
  if(rolling!==session)return;
  rolling=null;
  if(state===session.state){roll(state);render();}
 },reduced?100:720);
}
const worm='<img class="worm-art" src="worm.png" alt="虫">';
const face=f=>f===6?worm:`<span class="pips pips-${f}">${Array.from({length:9},(_,i)=>`<i class="${({1:[4],2:[0,8],3:[0,4,8],4:[0,2,6,8],5:[0,2,4,6,8]})[f].includes(i)?'dot':''}"></i>`).join('')}</span>`;
function save(){try{localStorage.setItem('heck-v1',JSON.stringify(state));}catch{}}
function action(label,handler,primary=false,disabled=false){const b=document.createElement('button');b.textContent=label;b.className=primary?'primary':'secondary';b.disabled=disabled;b.onclick=()=>{handler();render();};$('actions').append(b);}
function render(){
 clearTimeout(timer);if(!state)return;save();const s=state,isRolling=rolling?.state===s,human=s.turn===0,over=s.phase==='over',between=s.phase==='between';
 $('remaining').textContent=`残り ${s.center.length} 枚`;
 $('tiles').innerHTML=Array.from({length:16},(_,i)=>i+21).map(n=>{const live=s.center.includes(n),down=s.down.includes(n);return `<div class="tile ${live?'':down?'flipped':'taken'}" aria-label="${n}${live?' 虫'+worms(n)+'匹':down?' 裏向き':' 獲得済み'}"><strong>${down?'✕':n}</strong><span>${live?worm.repeat(worms(n)):down?'CLOSED':'獲得済'}</span></div>`;}).join('');
 $('players').innerHTML=s.players.map((p,i)=>`<article class="player ${s.turn===i&&!over?'active':''}"><div class="player-top"><span class="avatar">${['🧑‍🍳','🐥','🐔','🐦'][i]}</span><div><h3>${p.name}</h3><small>${i?'CPU':'YOU'}${s.turn===i&&!over?' ・ 手番':''}</small></div><strong>${score(p)}<small> 匹</small></strong></div><div class="stack"><span>${p.stack.length}枚</span><b>${p.stack.at(-1)??'—'}</b></div><small class="collection">${p.stack.length?p.stack.join(' · '):'まだお皿は空っぽ'}</small></article>`).join('');
 $('turn-title').textContent=over?'本日の食堂、閉店！':`${s.players[s.turn].name}の手番`;
 $('turn-number').textContent=`TURN ${String(s.round).padStart(2,'0')}`;
 const t=target(s);
 $('message').textContent=isRolling?'サイコロを振っています…':over?results():between?s.log[0]:!human?'CPUが次の一手を考えています…':s.phase==='choose'?'確保する目を1種類選んでください。':'振り直す？ それとも、ここでいただきます？';
 $('points').textContent=total(s.kept);
 $('log').replaceChildren(...s.log.map(text=>{const li=document.createElement('li');li.textContent=text;return li;}));
 $('holdings').replaceChildren(...s.players.map(p=>{const el=document.createElement('p');el.textContent=`${p.name}：${score(p)}匹 / タイル ${p.stack.join('・')||'なし'}`;return el;}));
 $('kept').innerHTML=s.kept.length?s.kept.map(f=>`<span class="die saved ${f===6?'worm':''}">${face(f)}</span>`).join(''):'<span class="empty">選んだサイコロがここに並びます</span>';
 $('dice').replaceChildren();
 $('dice').classList.toggle('rolling',isRolling);
 $('dice').setAttribute('aria-busy',String(isRolling));
 for(const [i,f] of (isRolling?rolling.faces:s.dice).entries()){const b=document.createElement('button');b.className=`die ${f===6?'worm':''}`;b.innerHTML=face(f);b.setAttribute('aria-label',`${f===6?'虫':f}の目をすべて確保`);b.disabled=isRolling||!human||!available(s).includes(f);b.style.setProperty('--die-index',i);b.onclick=()=>{choose(s,f);render();};$('dice').append(b);}
 $('actions').replaceChildren();
 if(isRolling){ /* Wait until all dice settle before enabling choices. */ }
 else if(over)action('もう一度遊ぶ →',()=>openSetup(),true);
 else if(human&&s.phase==='roll'){
 action(s.kept.length?`残り ${8-s.kept.length} 個を振る`:'サイコロを振る →',beginRoll,true,s.kept.length===8);
 if(s.kept.length)action(t?`${t.tile} を獲得して終了`:'失敗として終了',()=>bank(s));
 }
 if(!isRolling&&!human&&!between&&!over)timer=setTimeout(()=>{cpuAction(s,beginRoll);render();},850);
 if(between)timer=setTimeout(()=>{next(s);render();},1300);
}
function results(){const best=Math.max(...state.players.map(score));return state.players.filter(p=>score(p)===best).map(p=>p.name).join('と')+`の勝利！ 虫 ${best} 匹を集めました。`;}
function openSetup(){if(!$('setup').open)$('setup').showModal();}
$('history-open').onclick=()=>$('history-dialog').showModal();$('history-close').onclick=()=>$('history-dialog').close();
$('help').onclick=()=>$('rules').showModal();$('close-rules').onclick=()=>$('rules').close();$('new-game').onclick=openSetup;
$('start').onclick=()=>{rolling=null;state=createGame(Number($('count').value));$('setup').close();render();};
$('cancel-setup').onclick=e=>{if(!state){e.preventDefault();$('setup').close();state=createGame();render();}};
if(state)render();else{state=createGame();render();openSetup();}
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
let installPrompt;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;$('install').hidden=false;});
$('install').onclick=async()=>{if(installPrompt){await installPrompt.prompt();installPrompt=null;$('install').hidden=true;}};
