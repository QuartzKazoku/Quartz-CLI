//scripts/build.ts
#!/usr/bin/env bun

/**
 * Build script for creating standalone executables with Bun
 * Supports building for multiple platforms and architectures
 */

import { $ } from 'bun';
import { BUILD_CONFIG, type BuildTarget } from '../build.config';
import { mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

// Parse command line arguments
const args = process.argv.slice(2);
const targetArg = args[0] as BuildTarget | 'all' | undefined;

/**
 * Build for a specific target platform
 */
async function buildForTarget(target: BuildTarget) {
  const { entry, outDir, name, options, targets } = BUILD_CONFIG;
  const targetPlatform = targets[target];
  const outputName = `${name}-${target}`;
  const outputPath = join(outDir, outputName);

  console.log(`\n🔨 Building for ${target}...`);

  try {
    // Build command
    const buildCmd = [
      'bun',
      'build',
      entry,
      '--compile',
      `--target=${targetPlatform}`,
      `--outfile=${outputPath}`,
    ];

    // Add optional flags
    if (options.minify) buildCmd.push('--minify');
    if (options.sourcemap) buildCmd.push('--sourcemap');
    // if (options.bytecode) buildCmd.push('--bytecode');

    // Add build-time constants
    for (const [key, value] of Object.entries(BUILD_CONFIG.define || {})) {
      buildCmd.push(`--define=${key}=${value}`);
    }

    // Execute build
    await $`${buildCmd.join(' ')}`;

    console.log(`✅ Successfully built: ${outputPath}`);
  } catch (error) {
    console.error(`❌ Failed to build for ${target}:`, error);
    throw error;
  }
}

/**
 * Build for current platform
 */
async function buildForCurrentPlatform() {
  const { entry, outDir, name, options } = BUILD_CONFIG;
  const outputPath = join(outDir, name);

  console.log('\n🔨 Building for current platform...');

  try {
    const buildCmd = [
      'bun',
      'build',
      entry,
      '--compile',
      `--outfile=${outputPath}`,
    ];

    if (options.minify) buildCmd.push('--minify');
    if (options.sourcemap) buildCmd.push('--sourcemap');
    // if (options.bytecode) buildCmd.push('--bytecode');

    // Add build-time constants
    for (const [key, value] of Object.entries(BUILD_CONFIG.define || {})) {
      buildCmd.push(`--define=${key}=${value}`);
    }

    await $`${buildCmd.join(' ')}`;

    console.log(`✅ Successfully built: ${outputPath}`);
  } catch (error) {
    console.error('❌ Build failed:', error);
    throw error;
  }
}

/**
 * Main build function
 */
async function main() {
  const { outDir } = BUILD_CONFIG;

  // Clean and create output directory
  if (existsSync(outDir)) {
    console.log(`🧹 Cleaning ${outDir}...`);
    await rm(outDir, { recursive: true, force: true });
  }
  await mkdir(outDir, { recursive: true });

  // Build based on target
  if (!targetArg || targetArg === 'current') {
    await buildForCurrentPlatform();
  } else if (targetArg === 'all') {
    console.log('🚀 Building for all platforms...');
    const targets = Object.keys(BUILD_CONFIG.targets) as BuildTarget[];
    for (const target of targets) {
      await buildForTarget(target);
    }
    console.log('\n✨ All builds completed!');
  } else if (targetArg in BUILD_CONFIG.targets) {
    await buildForTarget(targetArg as BuildTarget);
  } else {
    console.error(`❌ Unknown target: ${targetArg}`);
    console.log('\nAvailable targets:');
    console.log('  - current (default)');
    console.log('  - all');
    Object.keys(BUILD_CONFIG.targets).forEach((t) => console.log(`  - ${t}`));
    process.exit(1);
  }

  console.log('\n🎉 Build complete!');
}

// Run the build
main().catch((error) => {
  console.error('Build failed:', error);
  process.exit(1);
});