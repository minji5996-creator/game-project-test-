import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {gameAssets,sourceHash} from './scripts/game-assets-plugin.mjs';

const previous=process.cwd(),root=fs.mkdtempSync(path.join(os.tmpdir(),'lumia-asset-qa-'));
try{
 process.chdir(root);
 fs.mkdirSync('scripts');fs.mkdirSync('public/assets',{recursive:true});
 const lf=Buffer.from('{\n "frames":44\n}\n'),crlf=Buffer.from(lf.toString().replace(/\n/g,'\r\n'));
 const entry={source:'public/manifest.json',sourceHash:sourceHash(lf,'manifest.json'),file:'assets/manifest.json'};
 fs.writeFileSync('scripts/asset-map.json',JSON.stringify({'/manifest.json':entry}));
 fs.writeFileSync('public/assets/manifest.json',lf);
 for(const bytes of [lf,crlf]){
  fs.writeFileSync(entry.source,bytes);
  assert.doesNotThrow(()=>gameAssets().buildStart());
 }
 fs.writeFileSync(entry.source,lf.toString().replace('44','45'));
 assert.throws(()=>gameAssets().buildStart(),/Asset changed/);
 assert.notEqual(sourceHash(lf,'image.png'),sourceHash(crlf,'image.png'));
 assert.equal(sourceHash(lf,'manifest.json'),sourceHash(crlf,'manifest.json'));
 console.log('PASS: LF and CRLF build validation, real JSON changes rejected, binary hashes stay exact.');
}finally{
 process.chdir(previous);fs.rmSync(root,{recursive:true,force:true});
}
