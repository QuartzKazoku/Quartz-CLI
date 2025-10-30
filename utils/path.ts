//utils/path.ts
/**
 * Common path utility functions for Quartz configuration
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {CONFIG_FILE} from '@/constants';

/**
 * Get user home directory
 */
export function getHomeDir(): string {
    return os.homedir();
}

/**
 * Get global .quartz directory path (in user home directory)
 */
export function getGlobalQuartzDir(): string {
    return path.join(getHomeDir(), CONFIG_FILE.DIR);
}

/**
 * Get global quartz.jsonc file path
 */
export function getGlobalQuartzPath(): string {
    return path.join(getGlobalQuartzDir(), CONFIG_FILE.NAME);
}

/**
 * Get project .quartz directory path (in current working directory)
 */
export function getQuartzDir(): string {
    return path.join(process.cwd(), CONFIG_FILE.DIR);
}

/**
 * Get project quartz.jsonc file path
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
 * @param global - If true, ensure global directory; otherwise, ensure project directory
 */
export function ensureQuartzDir(global = false): void {
    const quartzDir = global ? getGlobalQuartzDir() : getQuartzDir();
    if (!fs.existsSync(quartzDir)) {
        fs.mkdirSync(quartzDir, {recursive: true});
    }
}

/**
 * Check if global config exists
 */
export function globalConfigExists(): boolean {
    return fs.existsSync(getGlobalQuartzPath());
}

/**
 * Check if project config exists
 */
export function projectConfigExists(): boolean {
    return fs.existsSync(getQuartzPath());
}