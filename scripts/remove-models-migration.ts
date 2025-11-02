//scripts/remove-models-migration.ts
#!/usr/bin/env bun
/**
 * @fileoverview Migration script to remove app/core/models.ts and update all imports
 * @description Automatically replaces all imports from @/app/core/models to @/types
 */

import { readdirSync, readFileSync, writeFileSync, statSync } from 'fs';
import { join } from 'path';

const rootDir = process.cwd();

// Files to process
const filesToProcess: string[] = [];

// Recursively find all .ts files
function findTsFiles(dir: string) {
  const files = readdirSync(dir);
  
  for (const file of files) {
    const fullPath = join(dir, file);
    const stat = statSync(fullPath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      findTsFiles(fullPath);
    } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
      filesToProcess.push(fullPath);
    }
  }
}

// Find all TypeScript files
findTsFiles(join(rootDir, 'app'));
findTsFiles(join(rootDir, 'tests'));

let totalChanges = 0;

console.log('🔍 Starting migration...\n');

for (const filePath of filesToProcess) {
  let content = readFileSync(filePath, 'utf-8');
  let changed = false;
  
  // Replace imports from @/app/core/models to @/types
  const importRegex = /import\s+(?:type\s+)?{([^}]+)}\s+from\s+['"]@\/app\/core\/models['"]/g;
  
  if (importRegex.test(content)) {
    const relativePath = filePath.replace(rootDir, '');
    
    // Reset regex
    content = content.replace(
      /import\s+(?:type\s+)?{([^}]+)}\s+from\s+['"]@\/app\/core\/models['"]/g,
      (match, imports) => {
        // Separate enums (need regular import) from types (need type import)
        const importList = imports.split(',').map((i: string) => i.trim());
        const enums = ['CommandVerb', 'CommandObject', 'ParameterType', 'PlatformType'];
        
        const enumImports = importList.filter((i: string) => enums.includes(i));
        const typeImports = importList.filter((i: string) => !enums.includes(i));
        
        let result = '';
        if (enumImports.length > 0) {
          result += `import {${enumImports.join(', ')}} from "@/types";\n`;
        }
        if (typeImports.length > 0) {
          result += `import type {${typeImports.join(', ')}} from "@/types";`;
        }
        
        return result.trim();
      }
    );
    
    // Replace string literals with ParameterType enum
    content = content.replace(/type:\s*['"]string['"]/g, 'type: ParameterType.STRING');
    content = content.replace(/type:\s*['"]number['"]/g, 'type: ParameterType.NUMBER');
    content = content.replace(/type:\s*['"]boolean['"]/g, 'type: ParameterType.BOOLEAN');
    content = content.replace(/type:\s*['"]array['"]/g, 'type: ParameterType.ARRAY');
    content = content.replace(/type:\s*['"]object['"]/g, 'type: ParameterType.OBJECT');
    
    writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ Updated: ${relativePath}`);
    totalChanges++;
    changed = true;
  }
}

console.log(`\n✨ Migration complete! Updated ${totalChanges} files.`);
console.log('\n📝 Next steps:');
console.log('1. Review the changes');
console.log('2. Run: bun test');
console.log('3. Delete app/core/models.ts manually if all tests pass');