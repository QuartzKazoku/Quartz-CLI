//scripts/add-path-comments.ts
/**
 * Automatically add path comments to TypeScript files
 * Usage: bun run scripts/add-path-comments.ts
 */

import {readdirSync, readFileSync, statSync, writeFileSync} from 'node:fs';
import {join, relative} from 'node:path';
import {ENCODING} from '@/constants';

// Project root directory
const ROOT_DIR = process.cwd();

// Directories to process
const TARGET_DIRS = ['app', 'constants', 'helpers','utils','i18n','manager','scripts','tests','types','utils'];

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
 * Get the path comment from first line if exists
 */
function getExistingPathComment(content: string): string | null {
  const lines = content.split('\n');
  if (lines.length === 0) return null;

  const firstLine = lines[0].trim();
  // Check if first line is a path comment
  if (firstLine.startsWith('//') && !firstLine.startsWith('/**') && !firstLine.startsWith('///')) {
    // Extract path from comment (remove leading '//')
    const path = firstLine.substring(2).trim();
    // Basic validation: path should look like a file path
    if (path.includes('/') || path.includes('\\')) {
      return path;
    }
  }
  return null;
}

/**
 * Check if file already has correct path comment
 */
function hasCorrectPathComment(content: string, relativePath: string): boolean {
  const existingPath = getExistingPathComment(content);
  return existingPath === relativePath;
}

/**
 * Add or update path comment to file
 */
function addPathComment(filePath: string): boolean {
  try {
    const content = readFileSync(filePath, ENCODING.UTF8);
    const relativePath = relative(ROOT_DIR, filePath).replaceAll('\\', '/');

    // Check if already has correct path comment
    if (hasCorrectPathComment(content, relativePath)) {
      console.log(`⏭️  跳过(已存在): ${relativePath}`);
      return false;
    }

    // Check if has outdated path comment
    const existingPath = getExistingPathComment(content);
    let newContent: string;
    
    if (existingPath) {
      // Update existing path comment
      const lines = content.split('\n');
      lines[0] = `//${relativePath}`;
      newContent = lines.join('\n');
      writeFileSync(filePath, newContent, ENCODING.UTF8);
      console.log(`🔄 已更新: ${existingPath} -> ${relativePath}`);
      return true;
    } else {
      // Add new path comment at the beginning of the file
      const pathComment = `//${relativePath}\n`;
      newContent = pathComment + content;
      writeFileSync(filePath, newContent, ENCODING.UTF8);
      console.log(`✅ 已添加: ${relativePath}`);
      return true;
    }
  } catch (error) {
    console.error(`❌ 处理失败: ${filePath}`, error);
    return false;
  }
}

/**
 * Main function
 */
function main() {
  console.log('🚀 开始为 TypeScript 文件添加/更新路径注释...\n');

  let totalFiles = 0;
  let addedFiles = 0;
  let skippedFiles = 0;
  let updatedFiles = 0;

  // Process each target directory
  for (const targetDir of TARGET_DIRS) {
    const dirPath = join(ROOT_DIR, targetDir);
    
    try {
      const files = getAllTsFiles(dirPath);
      
      console.log(`\n📁 处理目录: ${targetDir} (共 ${files.length} 个文件)`);
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
      console.error(`❌ 无法访问目录: ${targetDir}`,error);
    }
  }

  // Output statistics
  console.log('\n' + '='.repeat(50));
  console.log('📊 处理完成!');
  console.log(`   总文件数: ${totalFiles}`);
  console.log(`   已添加/更新: ${addedFiles}`);
  console.log(`   已跳过: ${skippedFiles}`);
  console.log('='.repeat(50));
}

// Run script
main();