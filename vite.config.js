import {defineConfig} from 'vite';
import {resolve} from 'node:path';
export default defineConfig({build:{rollupOptions:{input:{index:resolve('index.html'),arcana:resolve('arcana.html'),arcana2d:resolve('arcana2d.html')}}}});
