import {build} from 'esbuild';
import fs from 'node:fs';
import {appearanceAssets} from './src/appearance-assets.js';
const result=await build({entryPoints:['src/arcana2d.js'],bundle:true,format:'iife',minify:true,write:false,loader:{'.css':'empty'}});
let js=result.outputFiles[0].text;
const appearancePaths=Object.values(appearanceAssets).flatMap(a=>[a.body,a.manifest,...Object.values(a.hair),...Object.values(a.outfit),...Object.values(a.skin),a.thumbs.body,...Object.values(a.thumbs.hair),...Object.values(a.thumbs.outfit),...Object.values(a.thumbs.skin)]);
const paths=['/arcana2d/creation/forest-stage.png',...appearancePaths,...['jelly','stump','mushroom'].flatMap(type=>['idle','ready','attack'].map(pose=>`/arcana2d/monsters/${type}-${pose}.png`)),...['mentor','librarian','herbalist','shop'].map(id=>`/arcana2d/portraits/${id}.png`),'/arcana2d/hero-atlas.png','/arcana2d/hero-manifest.json','/arcana2d/hero-base.png','/arcana2d/campus.png',...['mentor','librarian','herbalist','shop'].map(id=>`/arcana2d/${id}.png`),...['moss','tide','ember','astral'].map(id=>`/arcana/${id}.png`)];
for(const path of paths){const mime=path.endsWith('.json')?'application/json':'image/png';js=js.replaceAll(path,`data:${mime};base64,${fs.readFileSync('public'+path).toString('base64')}`);}
js=js.replaceAll('href="arcana.html"','href="Lumia-Magic-Academy-2D.html"').replaceAll('href="index.html"','href="Lumia-Magic-Academy-2D.html"');
let css=fs.readFileSync('src/arcana.css','utf8').replace(/^@import[^;]+;\s*/,'')+'\n'+fs.readFileSync('src/arcana2d.css','utf8')+'\n'+fs.readFileSync('src/academy-codex.css','utf8')+'\n'+fs.readFileSync('src/field-monsters.css','utf8')+'\n'+fs.readFileSync('src/character-creator.css','utf8')+'\n'+fs.readFileSync('src/creation-window.css','utf8');for(const file of ['/arcana/academy.png','/arcana2d/campus.png'])css=css.replaceAll(file,'data:image/png;base64,'+fs.readFileSync('public'+file).toString('base64'));
if(/GLTFLoader|WebGLRenderer/.test(js))throw Error('A 3D runtime was accidentally bundled');
fs.writeFileSync('Lumia-Magic-Academy-2D.html',`<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><link rel="icon" href="data:,"><title>루미아 마법학교 · 2D 스프라이트 RPG</title><style>${css}</style></head><body><div id="app"></div><script>${js.replaceAll('</script>','<\\/script>')}</script></body></html>`);
console.log('Wrote Lumia-Magic-Academy-2D.html');
