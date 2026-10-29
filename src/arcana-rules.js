import {normalizeAppearance} from './appearance-config.js';
// Combat rules are independent of rendering and have deterministic, inspectable turns.
export const elements={fire:{name:'불꽃',icon:'✹',color:'#e79a76',strong:'earth',weak:'water'},water:{name:'물결',icon:'❋',color:'#79b8d6',strong:'fire',weak:'earth'},earth:{name:'숲결',icon:'❦',color:'#94b98a',strong:'water',weak:'fire'}};
export const creatures={
 moss:{name:'이끼종 수호자',element:'earth',hp:82,attack:11,xp:32,gold:18,art:'moss',sigil:'earth',description:'숲의 기억을 품은 정령. 불꽃에 약해요.'},
 tide:{name:'서리날개 수호자',element:'water',hp:92,attack:12,xp:38,gold:20,art:'tide',sigil:'water',description:'수정 호수의 파수꾼. 숲결 마법에 약해요.'},
 ember:{name:'불씨꼬리 수호자',element:'fire',hp:98,attack:13,xp:42,gold:24,art:'ember',sigil:'fire',description:'따뜻한 불씨를 지키는 정령. 물결에 약해요.'},
 astral:{name:'잊힌 별의 파수꾼',element:'astral',hp:205,attack:18,xp:85,gold:70,art:'astral',boss:true,description:'3턴마다 모인 별빛을 방출합니다. 예고를 보고 방어하세요.'}
};
export const maxHP=p=>96+(p.level-1)*18;
export const maxMP=p=>42+(p.level-1)*8;
export const nextXP=p=>p.level*46;
export function newPlayer(element='fire',name='작은 여행자',appearance=null){return {appearance:normalizeAppearance(appearance),name:String(name).trim().slice(0,12)||'작은 여행자',element:elements[element]?element:'fire',level:1,xp:0,gold:24,hp:96,mp:42,potions:3,ethers:2};}
export function newBattle(id){if(!creatures[id])throw Error('Unknown creature');return {id,hp:creatures[id].hp,turn:1,bond:0,status:'active',lastAction:'',events:[]};}
export function affinity(attack,defence){if(attack==='light'||defence==='astral')return 1;if(elements[attack]?.strong===defence)return 1.65;if(elements[attack]?.weak===defence)return .65;return 1;}
export function performTurn(originalPlayer,originalBattle,action,{familiar=true}={}){
 const p={...originalPlayer},b={...originalBattle,events:[]},enemy=creatures[b.id];
 if(b.status!=='active')return {player:p,battle:b,invalid:'이미 끝난 전투입니다.'};
 let damage=0,guard=false;
 if(elements[action]){if(p.mp<6)return {player:p,battle:b,invalid:'마나가 부족해요. 방어로 마나를 회복하세요.'};p.mp-=6;const ratio=affinity(action,enemy.element),bonus=p.element===action?1.12:1;damage=Math.round((23+p.level*3)*ratio*bonus);b.events.push(`${elements[action].name} 마법! ${damage} 피해${ratio>1?' · 약점 적중!':ratio<1?' · 저항':''}`);}
 else if(action==='strike'){damage=16+p.level*3;b.events.push(`지팡이 빛탄 · ${damage} 피해`);}
 else if(action==='guard'){guard=true;p.mp=Math.min(maxMP(p),p.mp+12);b.events.push('별빛 방벽! 받는 피해를 줄이고 마나 12 회복.');}
 else if(action==='potion'){if(p.potions<=0)return {player:p,battle:b,invalid:'남은 회복 물약이 없어요.'};p.potions--;p.hp=Math.min(maxHP(p),p.hp+52);b.events.push('꿀빛 물약 · 체력 52 회복.');}
 else if(action==='ether'){if(p.ethers<=0)return {player:p,battle:b,invalid:'남은 마나 물약이 없어요.'};p.ethers--;p.mp=Math.min(maxMP(p),p.mp+30);b.events.push('이슬 물약 · 마나 30 회복.');}
 else if(action==='bond'){if(!familiar||b.bond<3)return {player:p,battle:b,invalid:'정령과 마음을 세 번 모으면 사용할 수 있어요.'};b.bond=0;damage=42+p.level*4;p.hp=Math.min(maxHP(p),p.hp+15);b.events.push(`정령의 별노래! ${damage} 피해 · 체력 15 회복.`);}
 else return {player:p,battle:b,invalid:'선택할 수 없는 행동입니다.'};
 if(familiar){damage+=6;b.events.push('정령 루루의 도움 · 6 피해');if(action!=='bond')b.bond=Math.min(3,b.bond+1);}
 b.hp=Math.max(0,b.hp-damage);b.lastAction=action;
 if(b.hp===0){b.status='won';return {player:p,battle:b};}
 const burst=b.turn%3===0,amount=Math.round(enemy.attack*(burst?1.9:1)*(guard?.3:1));p.hp=Math.max(0,p.hp-amount);b.events.push(`${enemy.name}의 ${burst?'별빛 방출':'반격'} · ${amount} 피해${guard?' · 방어 성공':''}`);b.turn++;if(p.hp===0)b.status='lost';return {player:p,battle:b};
}
export function grantReward(player,id){const p={...player},enemy=creatures[id];p.gold+=enemy.gold;p.xp+=enemy.xp;let levels=0;while(p.xp>=nextXP(p)&&p.level<20){p.xp-=nextXP(p);p.level++;levels++;}p.hp=Math.min(maxHP(p),p.hp+25);p.mp=Math.min(maxMP(p),p.mp+16);if(levels){p.hp=maxHP(p);p.mp=maxMP(p);}return {player:p,levels};}
export function normalizeSave(value){
 if(!value||value.version!==1||!Number.isInteger(value.stage)||value.stage<0||value.stage>6||!value.player)return null;
 const p=newPlayer(value.player.element,value.player.name,value.player.appearance),num=(v,min,max,fallback)=>Number.isFinite(v)?Math.max(min,Math.min(max,Math.floor(v))):fallback;
 for(const [key,max]of [['level',20],['xp',10000],['gold',9999],['potions',99],['ethers',99]])p[key]=num(value.player[key],key==='level'?1:0,max,p[key]);p.hp=num(value.player.hp,1,maxHP(p),maxHP(p));p.mp=num(value.player.mp,0,maxMP(p),maxMP(p));
 const position=Array.isArray(value.position)&&value.position.length===2&&value.position.every(Number.isFinite)?value.position:[0,11];
 return {version:1,stage:value.stage,player:p,defeated:[...new Set((Array.isArray(value.defeated)?value.defeated:[]).filter(id=>creatures[id]))],collected:[...new Set((Array.isArray(value.collected)?value.collected:[]).filter(id=>/^herb[1-3]$/.test(id)))],sideDone:!!value.sideDone,position};
}
