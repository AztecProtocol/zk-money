import { defineConfig } from 'vite';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill';
import react from '@vitejs/plugin-react';
import viteTsconfigPaths from 'vite-tsconfig-paths';
import svgrPlugin from 'vite-plugin-svgr';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import path from "path";

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
          src: `${path.dirname(require.resolve("@aztec/sdk"))}/aztec-connect.wasm`,
          dest: '',
        },
        {
          src: `${path.dirname(require.resolve("@aztec/sdk"))}/web_worker.js`,
          dest: '',
        },
      ],
    }),
  ],
  resolve: {
    alias: {},
  },
  build: {
    outDir: 'dest',
  },
  optimizeDeps: {
    exclude: ['@aztec/sdk'],
  },
  esbuildOptions: {
    define: {
      global: 'globalThis',
    },
    plugins: [
      NodeGlobalsPolyfillPlugin({
        process: true,
        buffer: true,
      }),
      NodeModulesPolyfillPlugin(),
    ],
  },
  server: {
    port: 8080,
    host: '0.0.0.0',
  },
});
