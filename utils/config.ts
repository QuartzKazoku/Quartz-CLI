//cli/utils/config.ts
import fs from 'node:fs';
import { parse as parseJsonc } from 'jsonc-parser';
import { PlatformConfig, QuartzConfig } from '@/types/config';
import { CONFIG_FILE, DEFAULT_VALUES } from '@/constants';
import { logger } from '@/utils/logger';
import { getQuartzPath } from '@/utils/path';

// Re-export path utilities for backward compatibility
export { getQuartzDir, getQuartzPath, ensureQuartzDir } from '@/utils/path';

/**
 * 读取配置文件
 */
export function readQuartzConfig(): QuartzConfig {
    const quartzPath = getQuartzPath();

    // 默认配置
    const defaultConfig: QuartzConfig = {
        openai: {
            apiKey: '',
            baseUrl: DEFAULT_VALUES.OPENAI_BASE_URL,
            model: DEFAULT_VALUES.OPENAI_MODEL,
        },
        platforms: [],
        language: {
            ui: DEFAULT_VALUES.LANGUAGE_UI,
            prompt: DEFAULT_VALUES.LANGUAGE_PROMPT,
        },
    };

    if (!fs.existsSync(quartzPath)) {
        return defaultConfig;
    }

    try {
        const content = fs.readFileSync(quartzPath, 'utf-8');
        const data = parseJsonc(content);

        if (data[CONFIG_FILE.DEFAULT_PROFILE]?.config) {
            return data[CONFIG_FILE.DEFAULT_PROFILE].config;
        }

        return defaultConfig;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.warn(`Failed to parse quartz.jsonc: ${errorMessage}. Using default config.`);
        return defaultConfig;
    }
}

/**
 * Write configuration file
 */
export function writeQuartzConfig(config: QuartzConfig, profileName: string = CONFIG_FILE.DEFAULT_PROFILE): void {
    const quartzPath = getQuartzPath();
    let data: any = {};

    // Read existing data
    if (fs.existsSync(quartzPath)) {
        try {
            const content = fs.readFileSync(quartzPath, 'utf-8');
            data = parseJsonc(content);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.warn(`Failed to read existing config: ${errorMessage}. Creating new one.`);
            data = {};
        }
    }

    // 更新指定profile
    data[profileName] = {
        name: profileName,
        config,
    };

    fs.writeFileSync(quartzPath, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * Load configuration (external interface, maintain compatibility)
 */
export function loadConfig(): QuartzConfig {
    return readQuartzConfig();
}

/**
 * 获取平台配置列表
 */
export function getPlatformConfigs(): PlatformConfig[] {
    const config = readQuartzConfig();
    return config.platforms;
}

/**
 * 根据平台类型获取配置
 */
export function getPlatformConfig(type: 'github' | 'gitlab'): PlatformConfig | undefined {
    const config = readQuartzConfig();
    return config.platforms.find(p => p.type === type);
}

/**
 * 添加或更新平台配置
 */
export function upsertPlatformConfig(platformConfig: PlatformConfig): void {
    const config = readQuartzConfig();
    const existingIndex = config.platforms.findIndex(p => p.type === platformConfig.type && p.url === platformConfig.url);

    if (existingIndex >= 0) {
        config.platforms[existingIndex] = platformConfig;
    } else {
        config.platforms.push(platformConfig);
    }

    writeQuartzConfig(config);
}

/**
 * 删除平台配置
 */
export function removePlatformConfig(type: 'github' | 'gitlab', url?: string): void {
    const config = readQuartzConfig();
    config.platforms = config.platforms.filter(p => {
        if (p.type !== type) return true;
        return !!(url && p.url !== url);
    });
    writeQuartzConfig(config);
}