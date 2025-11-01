import { defineConfig } from 'bunup';

export default defineConfig({
  entry: ['app/index.ts'],
  format: ['esm'],
  target: 'node',
  outDir: 'dist',
  clean: true,
  dts: true,
  sourcemap: true,
  splitting: false,
  treeshake: true,
  minify: false,
  banner: '#!/usr/bin/env node',
});