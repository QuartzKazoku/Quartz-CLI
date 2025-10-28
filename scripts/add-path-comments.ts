//scripts/add-path-comments.ts
/**
 * Automatically add path comments to TypeScript files
 * Usage: bun run scripts/add-path-comments.ts
 */

import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

// Project root directory
const ROOT_DIR = process.cwd();

// Directories to process
const TARGET_DIRS = ['app', 'tests', 'scripts'];

// Directories to exclude
const EXCLUDE_DIRS = new Set(['node_modules', 'dist', '.git', 'docs']);

/**
 * Recursively get all TypeScript files
 */
function getAllTsFiles(dir: string, fileList: string[] = []): string[] {
  const files = readdirSync(dir);

  for (const file of files) {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      // Exclude specified directories
      if (!EXCLUDE_DIRS.has(file)) {
        getAllTsFiles(filePath, fileList);
      }
    } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
      fileList.push(filePath);
    }
  }

  return fileList;
}

/**
 * Check if file already has path comment
 */
function hasPathComment(content: string, relativePath: string): boolean {
  const lines = content.split('\n');
  if (lines.length === 0) return false;

  const firstLine = lines[0].trim();
  // Check if first line is already a path comment
  return firstLine.startsWith('//') && firstLine.includes(relativePath);
}

/**
 * Add path comment to file
 */
function addPathComment(filePath: string): boolean {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const relativePath = relative(ROOT_DIR, filePath).replaceAll('\\', '/');

    // If already has path comment, skip
    if (hasPathComment(content, relativePath)) {
      console.log(`⏭️  Skipped (already exists): ${relativePath}`);
      return false;
    }

    // Add path comment at the beginning of the file
    const pathComment = `//${relativePath}\n`;
    const newContent = pathComment + content;

    writeFileSync(filePath, newContent, 'utf-8');
    console.log(`✅ Added: ${relativePath}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to process: ${filePath}`, error);
    return false;
  }
}

/**
 * Main function
 */
function main() {
  console.log('🚀 Adding path comments to TypeScript files...\n');

  let totalFiles = 0;
  let addedFiles = 0;
  let skippedFiles = 0;

  // Process each target directory
  for (const targetDir of TARGET_DIRS) {
    const dirPath = join(ROOT_DIR, targetDir);

    try {
      const files = getAllTsFiles(dirPath);

      console.log(`\n📁 Processing directory: ${targetDir} (${files.length} files)`);
      console.log('─'.repeat(50));

      for (const file of files) {
        totalFiles++;
        if (addPathComment(file)) {
          addedFiles++;
        } else {
          skippedFiles++;
        }
      }
    } catch (error) {
      console.error(`❌ Cannot access directory: ${targetDir}`, error);
    }
  }

  // Output statistics
  console.log('\n' + '='.repeat(50));
  console.log('📊 Processing completed!');
  console.log(`   Total files: ${totalFiles}`);
  console.log(`   Added: ${addedFiles}`);
  console.log(`   Skipped: ${skippedFiles}`);
  console.log('='.repeat(50));
}

// Run script
main();