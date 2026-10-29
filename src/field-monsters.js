import {loadImage} from './arcana2d-renderer.js';
import {elements,affinity} from './arcana-rules.js';

export const monsterTypes={
 jelly:{name:'푸딩 젤리벌레',element:'water',hp:38,damage:5,speed:1.5,size:1.9,description:'푸른 젤리 몸을 잔뜩 부풀린 뒤 몸통으로 돌진해요. 숲결 마법에 약해요.'},
 stump:{name:'심술 고목',element:'earth',hp:52,damage:8,speed:1.05,size:2.3,description:'느리게 다가와 나뭇가지를 휘둘러요. 불꽃 마법으로 상대해 보세요.'},
 mushroom:{name:'톡톡 버섯',element:'fire',hp:32,damage:4,speed:1.9,size:1.8,description:'붉은 갓 아래로 웅크렸다가 통통 뛰어들어요. 물결 마법에 약해요.'}
};
const monsterImages={
 jelly:{idle:'/arcana2d/monsters/jelly-idle.png',ready:'/arcana2d/monsters/jelly-ready.png',attack:'/arcana2d/monsters/jelly-attack.png'},
 stump:{idle:'/arcana2d/monsters/stump-idle.png',ready:'/arcana2d/monsters/stump-ready.png',attack:'/arcana2d/monsters/stump-attack.png'},
 mushroom:{idle:'/arcana2d/monsters/mushroom-idle.png',ready:'/arcana2d/monsters/mushroom-ready.png',attack:'/arcana2d/monsters/mushroom-attack.png'}
};
export const monsterImage=(type,pose='idle')=>monsterImages[type][pose];
export const monsterSpawns=[{type:'jelly',x:-19,z:9},{type:'stump',x:-20,z:-12},{type:'mushroom',x:20,z:3},{type:'jelly',x:20,z:14},{type:'mushroom',x:-20,z:18}];
export function createFieldMonsters(world,{getPlayer,onDamage,onReward,onNotice,onCast}){
 const images={},effects=[],shots=[];
 const mobs=monsterSpawns.map((s,i)=>({...s,id:'wild-'+i,home:{x:s.x,z:s.z},hp:monsterTypes[s.type].hp,mode:'idle',timer:0,cooldown:0,hit:0,path:[],repath:0,facing:1}));
 let cooldown=0,grace=3;
 const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
 const safe=p=>Math.abs(p.x)<13||world.npcs.some(n=>distance(n,p)<3);
 const alive=m=>m.mode!=='dead';
 function reset(){for(const m of mobs)Object.assign(m,{x:m.home.x,z:m.home.z,hp:monsterTypes[m.type].hp,mode:'idle',timer:0,cooldown:0,hit:0,path:[],repath:0});effects.length=shots.length=0;cooldown=0;grace=3;}
 function text(label,x,z,color='#fff1ba'){effects.push({label,x,z,color,life:1.1,max:1.1});}
 function travel(m,target,dt){m.repath-=dt;if(m.repath<=0){m.path=world.nav.findPath(m,target);m.repath=.6;}const goal=m.path[0];if(!goal)return;const d=distance(m,goal);if(d<.15){m.path.shift();return;}const step=Math.min(d,monsterTypes[m.type].speed*dt),dx=(goal.x-m.x)/d,dz=(goal.z-m.z)/d;if(Math.abs(dx)>.05)m.facing=dx>0?1:-1;const nx=m.x+dx*step,nz=m.z+dz*step;if(world.nav.walkable(nx,nz)){m.x=nx;m.z=nz;}}
 function cast(actor,element){if(cooldown>0)return false;const p=getPlayer(),a={x:actor.position.x,z:actor.position.z};const target=mobs.filter(alive).filter(m=>distance(m,a)<6).sort((a,b)=>distance(a,actor.position)-distance(b,actor.position))[0];if(!target){onNotice('가까이에 몬스터가 없어요. 숲길 안내를 눌러 찾아가 보세요.');return false;}if(p.mp<3){onNotice('마나가 부족해요. 가방의 마나 물약이나 교수님의 회복을 이용하세요.');return false;}p.mp-=3;cooldown=.85;shots.push({from:a,target,element,age:0,duration:.28});onCast();return true;}
 function update(dt,actor,active){if(!active)return;cooldown=Math.max(0,cooldown-dt);grace=Math.max(0,grace-dt);for(const e of effects)e.life-=dt;for(let i=effects.length-1;i>=0;i--)if(effects[i].life<=0)effects.splice(i,1);
  for(let i=shots.length-1;i>=0;i--){const shot=shots[i];shot.age+=dt;if(shot.age<shot.duration)continue;shots.splice(i,1);const m=shot.target;if(!alive(m))continue;const p=getPlayer(),damage=Math.round((18+p.level*3)*affinity(shot.element,monsterTypes[m.type].element)*(p.element===shot.element?1.12:1));m.hp=Math.max(0,m.hp-damage);m.hit=.22;text('-'+damage,m.x,m.z,elements[shot.element].color);if(m.hp===0){m.mode='dead';m.timer=22;m.path=[];onReward(m.type);text('+6 XP · +3 G',m.x,m.z-.5,'#fff3a6');}else if(m.mode==='idle'){m.mode='chase';m.repath=0;}}
  const a={x:actor.position.x,z:actor.position.z};for(const m of mobs){m.hit=Math.max(0,m.hit-dt);m.cooldown=Math.max(0,m.cooldown-dt);if(m.mode==='dead'){m.timer-=dt;if(m.timer<=0&&distance(a,m.home)>7){Object.assign(m,{x:m.home.x,z:m.home.z,hp:monsterTypes[m.type].hp,mode:'idle',path:[]});}continue;}const d=distance(m,a),leashed=distance(m,m.home)>7.5;
   if(safe(a)||leashed||d>8||grace>0){if(m.mode!=='return'&&m.mode!=='idle'){m.mode='return';m.path=[];m.repath=0;}if(m.mode==='return'){travel(m,m.home,dt);if(distance(m,m.home)<.4){m.mode='idle';m.hp=monsterTypes[m.type].hp;}}continue;}
   if(m.mode==='windup'){m.timer-=dt;if(m.timer<=0){m.mode='attack';m.timer=.28;if(d<1.65){const damage=monsterTypes[m.type].damage;text('-'+damage,a.x,a.z,'#ffaaa0');if(onDamage(damage)){reset();return;}}}continue;}
   if(m.mode==='attack'){m.timer-=dt;if(m.timer<=0){m.mode='chase';m.cooldown=1.35;}continue;}
   if(m.mode==='return'){travel(m,m.home,dt);if(distance(m,m.home)<.4){m.mode='idle';m.hp=monsterTypes[m.type].hp;}continue;}
   if(d<5.2&&m.mode==='idle'){m.mode='chase';m.repath=0;text('!',m.x,m.z,'#ffcf87');}
   if(m.mode==='chase'){if(d<1.25&&m.cooldown<=0){m.mode='windup';m.timer=.6;m.path=[];}else if(d>1.05)travel(m,a,dt);}
  }
 }
 function drawMonster(ctx,m,p,s,time){const type=monsterTypes[m.type],pose=m.mode==='windup'?'ready':m.mode==='attack'?'attack':'idle',image=images[m.type+'-'+pose];if(!image)return;const h=type.size*s,bob=m.mode==='chase'?Math.sin(time*9)*3:Math.sin(time*2+m.home.z)*1.5;ctx.save();ctx.translate(p.x,p.y);if(m.mode==='windup'){ctx.fillStyle='#e9654555';ctx.strokeStyle='#ffcc81';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,0,1.55*s,.7*s,0,0,Math.PI*2);ctx.fill();ctx.stroke();}ctx.fillStyle='#203e3a40';ctx.beginPath();ctx.ellipse(0,0,h*.28,h*.08,0,0,Math.PI*2);ctx.fill();ctx.save();ctx.scale(m.facing,1);if(m.hit>0)ctx.globalAlpha=.5;const lunge=m.mode==='attack'?Math.sin((.28-m.timer)/.28*Math.PI)*s*.3:0;ctx.drawImage(image,-h/2+lunge,-h*.92+bob,h,h);ctx.restore();ctx.font='bold 10px sans-serif';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#2b463a';ctx.fillStyle='#ffedbf';ctx.strokeText(type.name,0,-h-12);ctx.fillText(type.name,0,-h-12);ctx.fillStyle='#273f38';ctx.fillRect(-23,-h-8,46,5);ctx.fillStyle=elements[type.element].color;ctx.fillRect(-22,-h-7,44*m.hp/type.hp,3);ctx.restore();}
 function drawEffects(ctx,screen,s){for(const shot of shots){const f=Math.min(1,shot.age/shot.duration),to=shot.target,p=screen(shot.from.x+(to.x-shot.from.x)*f,shot.from.z+(to.z-shot.from.z)*f);ctx.save();ctx.fillStyle=elements[shot.element].color;ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=16;ctx.beginPath();ctx.arc(p.x,p.y-s*.8,8,0,Math.PI*2);ctx.fill();ctx.restore();}for(const e of effects){const p=screen(e.x,e.z);ctx.save();ctx.globalAlpha=Math.min(1,e.life*2);ctx.textAlign='center';ctx.font='bold 17px sans-serif';ctx.lineWidth=4;ctx.strokeStyle='#253e39';ctx.fillStyle=e.color;const y=p.y-s*2-(e.max-e.life)*30;ctx.strokeText(e.label,p.x,y);ctx.fillText(e.label,p.x,y);ctx.restore();}}
 async function load(){await Promise.all(Object.keys(monsterTypes).flatMap(type=>['idle','ready','attack'].map(async pose=>{images[type+'-'+pose]=await loadImage(monsterImage(type,pose));})));}
 return{mobs,load,reset,update,cast,drawMonster,drawEffects,get cooldown(){return cooldown;},nearest(actor){return mobs.filter(alive).sort((a,b)=>distance(a,actor.position)-distance(b,actor.position))[0];},get state(){return mobs.map(m=>({id:m.id,type:m.type,x:m.x,z:m.z,hp:m.hp,mode:m.mode}));}};
}
