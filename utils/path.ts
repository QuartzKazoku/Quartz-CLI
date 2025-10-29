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
 */
export function getQuartzPath(): string {
    return path.join(getQuartzDir(), CONFIG_FILE.NAME)
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