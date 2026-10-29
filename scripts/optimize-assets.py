"""Precompute deployment assets. Pillow is a maintenance tool, not a Vercel dependency."""
from pathlib import Path
import hashlib,json
from PIL import Image,ImageChops
root=Path(__file__).resolve().parents[1];public=root/'public';target=public/'assets/game';target.mkdir(parents=True,exist_ok=True)
registry_path=root/'src/appearance-assets.js';registry=json.loads(registry_path.read_text(encoding='utf-8').split('=',1)[1].rstrip(';\n'))
for gender,assets in registry.items():
    manifest=json.loads((public/assets['manifest'].lstrip('/')).read_text(encoding='utf-8'));f=manifest['frame_layout']['rows']['down_idle'][0];box=(f['x'],f['y'],f['x']+f['w'],f['y']+f['h']);thumbs={'body':assets['body'],**{kind:assets[kind] for kind in ['hair','outfit','skin']}}
    def thumbnail(url):
        src=public/url.lstrip('/');logical=f'/arcana2d/creation/{gender}/thumbs/'+src.relative_to(public/f'arcana2d/creation/{gender}').as_posix();dest=public/logical.lstrip('/');dest.parent.mkdir(parents=True,exist_ok=True)
        image=Image.open(src).convert('RGBA').crop(box);image.save(dest,format='PNG',optimize=True);return logical
    assets['thumbs']={'body':thumbnail(assets['body']),**{kind:{id:thumbnail(url) for id,url in assets[kind].items()} for kind in ['hair','outfit','skin']}}
registry_path.write_text('export const appearanceAssets='+json.dumps(registry,separators=(',',':'))+';\n',encoding='utf-8')
entries={};before=after=0;verified=0
for src in sorted(public.rglob('*')):
    if not src.is_file() or target in src.parents or src.suffix not in {'.png','.json'}:continue
    logical='/'+src.relative_to(public).as_posix();data=src.read_bytes();source_hash=hashlib.sha256(data).hexdigest()
    if src.suffix=='.png':
        image=Image.open(src).convert('RGBA');temp=target/'encoding.tmp.webp';image.save(temp,format='WEBP',lossless=True,quality=100,method=4,exact=True)
        decoded=Image.open(temp).convert('RGBA')
        # Alpha and all visible RGB values must be identical after decoding.
        if image.size!=decoded.size or image.getchannel('A').tobytes()!=decoded.getchannel('A').tobytes():raise RuntimeError('Alpha changed '+logical)
        diff=ImageChops.difference(image.convert('RGB'),decoded.convert('RGB'));mask=image.getchannel('A').point(lambda value:255 if value else 0);visible=ImageChops.multiply(diff,mask.convert('RGB'))
        if visible.getbbox():raise RuntimeError('Visible RGB changed '+logical)
        encoded=temp.read_bytes();temp.unlink();suffix='webp';verified+=1
    else:encoded=data;suffix='json'
    digest=hashlib.sha256(encoded).hexdigest()[:16];name=src.relative_to(public).with_suffix('').as_posix().replace('/','-')+'.'+digest+'.'+suffix;dest=target/name;dest.write_bytes(encoded)
    entries[logical]={'file':'assets/game/'+name,'source':src.relative_to(root).as_posix(),'sourceHash':source_hash,'inputBytes':len(data),'outputBytes':len(encoded)};before+=len(data);after+=len(encoded)
(root/'scripts/asset-map.json').write_text(json.dumps(entries,indent=2)+'\n',encoding='utf-8')
report={'logicalAssets':len(entries),'losslessImagesVerified':verified,'sourceBytes':before,'optimizedBytes':after,'reductionPercent':round((1-after/before)*100,1),'validation':'Exact decoded alpha; identical visible RGB. No resizing of motion frames.'}
(root/'docs/asset-optimization.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8');print(json.dumps(report))
