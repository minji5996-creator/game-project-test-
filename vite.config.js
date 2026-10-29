import {defineConfig} from 'vite';
import {resolve} from 'node:path';
import {gameAssets} from './scripts/game-assets-plugin.mjs';
export default defineConfig({plugins:[gameAssets()],build:{copyPublicDir:false,target:'es2022',rollupOptions:{input:{index:resolve('index.html'),arcana:resolve('arcana.html'),arcana2d:resolve('arcana2d.html')}}}});
