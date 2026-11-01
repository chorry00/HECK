export const worms = n => Math.floor((n-21)/4)+1;
export const total = kept => kept.reduce((sum,f)=>sum+(f===6?5:f),0);
export const score = p => p.stack.reduce((sum,n)=>sum+worms(n),0);
export function createGame(count=3) {
 return {players:['あなた','ピヨ丸','コッコ','トサカ'].slice(0,count).map(name=>({name,stack:[]})),center:Array.from({length:16},(_,i)=>i+21),down:[],turn:0,kept:[],dice:[],phase:'roll',log:['炭火の準備は万端。あなたの手番です！'],round:1};
}
export const available = s => [...new Set(s.dice)].filter(f=>!s.kept.includes(f));
export function roll(s,random=Math.random) {
 if(s.phase!=='roll') return false;
 s.dice=Array.from({length:8-s.kept.length},()=>1+Math.floor(random()*6));
 s.phase='choose';
 if(!available(s).length) fail(s,'選べる目がありません');
 return true;
}
export function choose(s,face) {
 if(s.phase!=='choose'||!available(s).includes(face))return false;
 s.kept.push(...s.dice.filter(f=>f===face));s.dice=[];s.phase='roll';return true;
}
export function target(s) {
 if(!s.kept.includes(6))return null;
 const n=total(s.kept);
 if(s.center.includes(n))return {tile:n,from:-1};
 const from=s.players.findIndex((p,i)=>i!==s.turn&&p.stack.at(-1)===n);
 if(from!==-1)return {tile:n,from};
 const lower=s.center.filter(t=>t<n);
 return lower.length?{tile:Math.max(...lower),from:-1}:null;
}
function finishTurn(s,message) {
 s.log.unshift(message);s.log=s.log.slice(0,30);s.dice=[];s.kept=[];
 s.phase=s.center.length?'between':'over';
}
export function fail(s,reason) {
 const p=s.players[s.turn];
 const returned=p.stack.pop();
 const highest=returned!==undefined&&s.center.length?Math.max(...s.center):null;
 if(returned!==undefined)s.center.push(returned);
 if(highest!==null){s.center=s.center.filter(n=>n!==highest);s.down.push(highest);}
 s.center.sort((a,b)=>a-b);
 finishTurn(s,`${p.name}：${reason}。${returned?returned+'を返却。':''}${highest?highest+'は裏返しに。':''}`);
}
export function bank(s) {
 if(s.phase!=='roll'||!s.kept.length)return false;
 const t=target(s);
 if(!t){fail(s,s.kept.includes(6)?'取れるタイルがありません':'虫がありません');return true;}
 if(t.from===-1)s.center=s.center.filter(n=>n!==t.tile);else s.players[t.from].stack.pop();
 s.players[s.turn].stack.push(t.tile);
 finishTurn(s,`${s.players[s.turn].name}：${t.from===-1?'':s.players[t.from].name+'から横取り！ '}${t.tile}（虫${worms(t.tile)}匹）を獲得。`);return true;
}
export function next(s) {
 if(s.phase!=='between')return;
 s.turn=(s.turn+1)%s.players.length;s.round++;s.phase='roll';
}
export function cpuAction(s) {
 if(s.phase==='choose') {
  const faces=available(s);let best=faces[0],value=-Infinity;
  for(const f of faces){const count=s.dice.filter(d=>d===f).length;const v=count*(f===6?5:f)+(f===6&&!s.kept.includes(6)?9:0);if(v>value){value=v;best=f;}}
  choose(s,best);return;
 }
 if(s.phase==='roll') {
  const t=target(s),remaining=8-s.kept.length;
  if(!remaining){bank(s);return;}
  const risk=(new Set(s.kept).size/6)**remaining;
  if(t&&(t.from!==-1||worms(t.tile)>=3||remaining<=2||risk>0.2||total(s.kept)>=26))bank(s);else roll(s);
 }
}
