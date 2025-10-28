import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['app/index.ts'],
  format: ['esm'],
  target: 'node18',
  outDir: 'dist',
  clean: true,
  shims: true,
  dts: true,
  sourcemap: true,
  splitting: false,
  treeshake: true,
  minify: false,
  banner: {
    js: '#!/usr/bin/env node',
  },
});