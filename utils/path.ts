//cli/utils/path.ts
/**
 * Common path utility functions for Quartz configuration
 */
import fs from 'node:fs';
import path from 'node:path';
import {CONFIG_FILE} from '@/constants';

/**
 * Get .quartz directory path
 */
export function getQuartzDir(): string {
    return path.join(process.cwd(), CONFIG_FILE.DIR);
}

/**
 * Get quartz.jsonc file path
 * Priority: .quartz/quartz.jsonc > quartz.jsonc (for backward compatibility)
 * In test environment, uses quartz-test.jsonc to avoid overwriting user config
 */
export function getQuartzPath(): string {
    const isTestEnv = process.env.NODE_ENV === 'test';
    const configFileName = isTestEnv ? CONFIG_FILE.TEST_NAME : CONFIG_FILE.NAME;
    return path.join(getQuartzDir(), configFileName);
}

/**
 * Ensure .quartz directory exists
 */
export function ensureQuartzDir(): void {
    const quartzDir = getQuartzDir();
    if (!fs.existsSync(quartzDir)) {
        fs.mkdirSync(quartzDir, {recursive: true});
    }
}