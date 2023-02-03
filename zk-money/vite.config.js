import { defineConfig } from 'vite';
import inject from '@rollup/plugin-inject';
import nodeStdlibBrowser from 'node-stdlib-browser';
import react from '@vitejs/plugin-react';
import viteTsconfigPaths from 'vite-tsconfig-paths';
import svgrPlugin from 'vite-plugin-svgr';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import path from 'path';

// Get require functionality in ESM
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteTsconfigPaths(),
    svgrPlugin(),
    viteStaticCopy({
      targets: [
        {
          src: `${path.dirname(require.resolve('@aztec/sdk'))}/aztec-connect.wasm`,
          dest: '',
        },
        {
          src: `${path.dirname(require.resolve('@aztec/sdk'))}/web_worker.js`,
          dest: '',
        },
      ],
    }),
    {
      ...inject({
        global: [require.resolve('node-stdlib-browser/helpers/esbuild/shim'), 'global'],
        process: [require.resolve('node-stdlib-browser/helpers/esbuild/shim'), 'process'],
        Buffer: [require.resolve('node-stdlib-browser/helpers/esbuild/shim'), 'Buffer'],
      }),
      enforce: 'post',
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      ...nodeStdlibBrowser,
    },
  },
  build: {
    outDir: 'dest',
    target: 'esnext', // Enable Big integer literals
    commonjsOptions: {
      transformMixedEsModules: true, // Enable @walletconnect/web3-provider which has some code in CommonJS
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext',
    },
  },
  server: {
    port: 8080,
    host: '0.0.0.0',
  },
});
