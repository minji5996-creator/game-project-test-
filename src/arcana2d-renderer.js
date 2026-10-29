// All game and battle graphics use CanvasRenderingContext2D. No 3D runtime.
export class Point{
 constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;}
 set(x,y,z){this.x=x;this.y=y;this.z=z;return this;}
 clone(){return new Point(this.x,this.y,this.z);}
 copy(p){return this.set(p.x,p.y,p.z);}
 distanceTo(p){return Math.hypot(this.x-p.x,this.z-p.z);}
 lerp(p,a){this.x+=(p.x-this.x)*a;this.z+=(p.z-this.z)*a;return this;}
}
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const marker=()=>({visible:false,position:new Point(),scale:{setScalar(){}}});
export async function loadImage(url){const image=new Image();image.decoding='async';image.src=url;await image.decode();return image;}
export class AtlasPlayer{
 constructor(image,manifest){this.image=image;this.manifest=manifest;this.state='down_idle';this.frame=0;this.time=0;this.once=false;this.returnState='side_idle';}
 set(state,once=false){if(!this.manifest.frame_layout.rows[state])throw Error('Missing Sprite Gen animation '+state);if(this.state===state&&!once)return;this.state=state;this.frame=0;this.time=0;this.once=once;}
 update(dt){this.time+=dt*1000;const animation=this.manifest.animation.rows[this.state],durations=animation.durations_ms||Array(animation.frames).fill(1000/animation.fps);let guard=0;while(this.time>=durations[this.frame]&&guard++<20){this.time-=durations[this.frame];if(this.frame+1<durations.length)this.frame++;else if(animation.loop)this.frame=0;else if(this.once){this.set(this.returnState);break;}else{this.frame=durations.length-1;this.time=0;break;}}}
 draw(ctx,x,feet,height){const rect=this.manifest.frame_layout.rows[this.state][this.frame],width=height*rect.w/rect.h,margin=this.manifest.cell.safe_margin_y||20;ctx.drawImage(this.image,rect.x,rect.y,rect.w,rect.h,x-width/2,feet-height*(rect.h-margin)/rect.h,width,height);}
}
export function createNavigation(solids){
 const step=.65,min=-26,size=81;
 const walkable=(x,z)=>Math.abs(x)<25.3&&Math.abs(z)<25.5&&!solids.some(s=>Math.abs(x-s.x)<s.w+.33&&Math.abs(z-s.z)<s.d+.33);
 function path(from,to){const cell=(x,z)=>[Math.round((x-min)/step),Math.round((z-min)/step)],pos=(x,z)=>({x:min+x*step,z:min+z*step}),key=(x,z)=>z*size+x;let[sx,sz]=cell(from.x,from.z),[gx,gz]=cell(to.x,to.z);if(gx<0||gz<0||gx>=size||gz>=size)return[];if(!walkable(to.x,to.z)||!walkable(pos(gx,gz).x,pos(gx,gz).z)){let best=null;for(let x=-4;x<=4;x++)for(let z=-4;z<=4;z++){const p=pos(gx+x,gz+z),distance=Math.hypot(x,z);if(walkable(p.x,p.z)&&(!best||distance<best.distance))best={x:gx+x,z:gz+z,distance};}if(!best)return[];gx=best.x;gz=best.z;}
  const start=key(sx,sz),end=key(gx,gz),open=[start],cost=new Map([[start,0]]),previous=new Map(),closed=new Set(),h=k=>Math.hypot(k%size-gx,Math.floor(k/size)-gz);
  for(let i=0;open.length&&i<8000;i++){open.sort((a,b)=>(cost.get(b)+h(b))-(cost.get(a)+h(a)));const current=open.pop();if(current===end){const route=[];let k=end;while(k!==start){route.push(pos(k%size,Math.floor(k/size)));k=previous.get(k);if(k===undefined)return[];}return route.reverse();}closed.add(current);const x=current%size,z=Math.floor(current/size);for(const[dx,dz]of[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){const nx=x+dx,nz=z+dz,k=key(nx,nz),p=pos(nx,nz);if(nx<0||nz<0||nx>=size||nz>=size||closed.has(k)||!walkable(p.x,p.z))continue;if(dx&&dz){const a=pos(x+dx,z),b=pos(x,z+dz);if(!walkable(a.x,a.z)||!walkable(b.x,b.z))continue;}const c=cost.get(current)+Math.hypot(dx,dz);if(c<(cost.get(k)??Infinity)){cost.set(k,c);previous.set(k,current);if(!open.includes(k))open.push(k);}}}return[];
 }return{walkable,findPath:path};
}
export function createSpriteWorld(){
 const solids=[{x:0,z:-15.4,w:10.5,d:3.3},{x:-8,z:-5,w:4.7,d:3},{x:8.5,z:-5,w:4,d:3},{x:11,z:11,w:4.5,d:3.5},{x:0,z:1,w:1.5,d:1.5}],npcs=[{id:'mentor',name:'교수 세렌',x:1.6,z:5},{id:'librarian',name:'사서 리안',x:8,z:-1.6},{id:'herbalist',name:'약초사 모아',x:-8,z:-1.6},{id:'shop',name:'상인 보리',x:11,z:16.2}].map(n=>({...n,type:'npc',y:2.6,group:{visible:true}})),enemies=[{id:'moss',x:-18,z:-5},{id:'tide',x:18,z:-5},{id:'ember',x:-12,z:17},{id:'astral',x:0,z:-22}].map(e=>({...e,type:'enemy',y:e.id==='astral'?4:3.1,group:{visible:true},art:null})),herbs=[{id:'herb1',x:-17,z:2},{id:'herb2',x:16,z:4},{id:'herb3',x:-5,z:19}].map(h=>({...h,type:'herb',name:'달이슬 약초',group:{visible:true}}));
 const labels=[...npcs.map(n=>({...n,text:n.name})),...enemies.map(e=>({...e,text:e.id==='moss'?'숲결의 시험':e.id==='tide'?'물결의 시험':e.id==='ember'?'불꽃의 시험':'별의 봉인'}))];
 const images={},nav=createNavigation(solids);
 async function load(){const files={campus:'/arcana2d/campus.png',mentor:'/arcana2d/mentor.png',librarian:'/arcana2d/librarian.png',herbalist:'/arcana2d/herbalist.png',shop:'/arcana2d/shop.png',moss:'/arcana/moss.png',tide:'/arcana/tide.png',ember:'/arcana/ember.png',astral:'/arcana/astral.png'};await Promise.all(Object.entries(files).map(async([id,url])=>images[id]=await loadImage(url)));for(const e of enemies)e.art=images[e.id];}
 return{solids,npcs,enemies,herbs,labels,nav,images,load,update(t,actor,state){for(const e of enemies)e.group.visible=!state.defeated.includes(e.id)&&(e.id!=='astral'||state.stage>=4);for(const h of herbs)h.group.visible=!state.collected.includes(h.id);}};
}
export class WorldCanvas{
 constructor(canvas,world){this.canvas=canvas;this.context=canvas.getContext('2d',{alpha:false});this.world=world;this.width=innerWidth;this.height=innerHeight;this.pixelRatio=Math.min(devicePixelRatio,2);this.type='canvas2d';}
 resize(){this.width=innerWidth;this.height=innerHeight;this.canvas.width=Math.round(this.width*this.pixelRatio);this.canvas.height=Math.round(this.height*this.pixelRatio);}
 scale(zoom=1){return(this.width<650?29:38)*zoom;}
 toScreen(x,z,camera,zoom=1){const s=this.scale(zoom);return{x:this.width/2+(x-camera.x)*s,y:this.height*.48+(z-camera.z)*s};}
 fromScreen(x,y,camera,zoom=1){const s=this.scale(zoom);return{x:camera.x+(x-this.width/2)/s,z:camera.z+(y-this.height*.48)/s};}
 pickNpc(x,y,camera,zoom=1){
  const size=2.8*this.scale(zoom);this.hitMasks??=new Map();
  for(const npc of [...this.world.npcs].sort((a,b)=>b.z-a.z)){
   const p=this.toScreen(npc.x,npc.z,camera,zoom),u=(x-(p.x-size/2))/size,v=(y-(p.y-size*.91))/size;if(u<0||u>=1||v<0||v>=1)continue;
   const image=this.world.images[npc.id];if(!image)continue;
   if(!this.hitMasks.has(npc.id)){const c=document.createElement('canvas');c.width=image.naturalWidth;c.height=image.naturalHeight;const ctx=c.getContext('2d');ctx.drawImage(image,0,0);this.hitMasks.set(npc.id,{width:c.width,height:c.height,alpha:ctx.getImageData(0,0,c.width,c.height).data});}
   const mask=this.hitMasks.get(npc.id),index=(Math.floor(v*mask.height)*mask.width+Math.floor(u*mask.width))*4+3;if(mask.alpha[index]>32)return npc;
  }return null;
 }
 render(actor,camera,state,hero,objective,destination,t,zoom){const ctx=this.context,s=this.scale(zoom),screen=(x,z)=>this.toScreen(x,z,camera,zoom);ctx.setTransform(this.pixelRatio,0,0,this.pixelRatio,0,0);ctx.fillStyle='#6c8978';ctx.fillRect(0,0,this.width,this.height);ctx.imageSmoothingEnabled=true;const top=screen(-28,-28);if(this.world.images.campus)ctx.drawImage(this.world.images.campus,top.x,top.y,56*s,56*s);
  if(destination.visible){const p=screen(destination.position.x,destination.position.z);ctx.strokeStyle='#fff1be';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(p.x,p.y,11,5,0,0,Math.PI*2);ctx.stroke();}
  if(objective){const p=screen(objective.x,objective.z);ctx.strokeStyle='#ffe3a4';ctx.lineWidth=2;ctx.globalAlpha=.7+.2*Math.sin(t*3);ctx.beginPath();ctx.ellipse(p.x,p.y,23+Math.sin(t*3)*2,10,0,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;}
  const actors=[...(this.world.wildSystem?.mobs||[]).filter(m=>m.mode!=='dead').map(m=>({...m,kind:'wild'})),...this.world.npcs.map(n=>({...n,kind:'npc'})),...this.world.enemies.filter(e=>e.group.visible).map(e=>({...e,kind:'enemy'})),...this.world.herbs.filter(h=>h.group.visible).map(h=>({...h,kind:'herb'})),{x:actor.position.x,z:actor.position.z,kind:'hero'}].sort((a,b)=>a.z-b.z);
  for(const item of actors){const p=screen(item.x,item.z);if(p.x<-180||p.x>this.width+180||p.y<-100||p.y>this.height+200)continue;if(item.kind==='herb'){ctx.save();ctx.translate(p.x,p.y);ctx.fillStyle='#b8dd8a';for(let i=0;i<3;i++){ctx.rotate(1.7);ctx.beginPath();ctx.ellipse(0,-7,4,12,0,0,Math.PI*2);ctx.fill();}ctx.fillStyle='#ffeab7';ctx.beginPath();ctx.arc(0,-6,3,0,Math.PI*2);ctx.fill();ctx.restore();continue;}if(item.kind==='wild'){this.world.wildSystem.drawMonster(ctx,item,p,s,t);continue;}const height=(item.kind==='hero'?2.8:item.kind==='npc'?2.8:item.id==='astral'?4.7:3.3)*s;ctx.fillStyle='#30463b35';ctx.beginPath();ctx.ellipse(p.x,p.y,Math.max(12,height*.22),Math.max(5,height*.065),0,0,Math.PI*2);ctx.fill();if(item.kind==='hero'){hero?.draw(ctx,p.x,p.y,height);}else{const image=this.world.images[item.id];if(image)ctx.drawImage(image,p.x-height/2,p.y-height*.91-(item.kind==='enemy'?Math.sin(t*2)*3:0),height,height);}}
  this.world.wildSystem?.drawEffects(ctx,screen,s);
  if(state.stage>=2){const p=screen(actor.position.x+.75,actor.position.z-.45);ctx.fillStyle='#f4e3a8';ctx.shadowColor='#fff2a8';ctx.shadowBlur=13;ctx.beginPath();ctx.arc(p.x,p.y-30+Math.sin(t*3)*4,5,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;}
 }
}
