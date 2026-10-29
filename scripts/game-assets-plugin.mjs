import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';

export function gameAssets(){
 const root=process.cwd(),map=JSON.parse(fs.readFileSync(path.join(root,'scripts/asset-map.json'),'utf8')),urls=Object.keys(map).sort((a,b)=>b.length-a.length),emitted=new Set();
 return{name:'lumia-lossless-assets',apply:'build',enforce:'pre',
  buildStart(){for(const entry of Object.values(map)){const source=fs.readFileSync(path.join(root,entry.source));if(createHash('sha256').update(source).digest('hex')!==entry.sourceHash)throw Error(`Asset changed: ${entry.source}. Run npm run optimize:assets before committing.`);if(!fs.existsSync(path.join(root,'public',entry.file)))throw Error('Optimized asset missing: '+entry.file);}},
  transform(code,id){if(!/\.(js|css)$/.test(id.split('?')[0])||!id.replaceAll('\\','/').includes('/src/'))return null;let result=code;for(const url of urls){if(!result.includes(url))continue;const entry=map[url];if(!emitted.has(entry.file)){this.emitFile({type:'asset',fileName:entry.file,source:fs.readFileSync(path.join(root,'public',entry.file))});emitted.add(entry.file);}result=result.replaceAll(url,'/'+entry.file);}return result===code?null:{code:result,map:null};}
 };
}
