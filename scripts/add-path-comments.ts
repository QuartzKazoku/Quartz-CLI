//scripts/add-path-comments.ts
/**
 * 自动为 TypeScript 文件添加路径注释
 * 用法: bun run scripts/add-path-comments.ts
 */

import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

// 项目根目录
const ROOT_DIR = process.cwd();

// 需要处理的目录
const TARGET_DIRS = ['cli', 'tests', 'scripts'];

// 需要排除的目录
const EXCLUDE_DIRS = new Set(['node_modules', 'dist', '.git', 'docs']);

/**
 * 递归获取所有 TypeScript 文件
 */
function getAllTsFiles(dir: string, fileList: string[] = []): string[] {
  const files = readdirSync(dir);

  for (const file of files) {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      // 排除指定目录
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
 * 检查文件是否已有路径注释
 */
function hasPathComment(content: string, relativePath: string): boolean {
  const lines = content.split('\n');
  if (lines.length === 0) return false;

  const firstLine = lines[0].trim();
  // 检查第一行是否已经是路径注释
  return firstLine.startsWith('//') && firstLine.includes(relativePath);
}

/**
 * 为文件添加路径注释
 */
function addPathComment(filePath: string): boolean {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const relativePath = relative(ROOT_DIR, filePath).replaceAll('\\', '/');

    // 如果已经有路径注释,跳过
    if (hasPathComment(content, relativePath)) {
      console.log(`⏭️  跳过(已存在): ${relativePath}`);
      return false;
    }

    // 在文件开头添加路径注释
    const pathComment = `//${relativePath}\n`;
    const newContent = pathComment + content;

    writeFileSync(filePath, newContent, 'utf-8');
    console.log(`✅ 已添加: ${relativePath}`);
    return true;
  } catch (error) {
    console.error(`❌ 处理失败: ${filePath}`, error);
    return false;
  }
}

/**
 * 主函数
 */
function main() {
  console.log('🚀 开始为 TypeScript 文件添加路径注释...\n');

  let totalFiles = 0;
  let addedFiles = 0;
  let skippedFiles = 0;

  // 处理每个目标目录
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

  // 输出统计信息
  console.log('\n' + '='.repeat(50));
  console.log('📊 处理完成!');
  console.log(`   总文件数: ${totalFiles}`);
  console.log(`   已添加: ${addedFiles}`);
  console.log(`   已跳过: ${skippedFiles}`);
  console.log('='.repeat(50));
}

// 运行脚本
main();