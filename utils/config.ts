//cli/utils/config.ts
import fs from 'node:fs';
import path from 'node:path';
import { parse as parseJsonc } from 'jsonc-parser';
import { PlatformConfig, QuartzConfig } from '@/types/config';
import { CONFIG_FILE, DEFAULT_VALUES } from '@/constants';
import { logger } from '@/utils/logger';

/**
 * CLI override options for OpenAI config
 */
export interface CLIOverrides {
    apiKey?: string;
    baseUrl?: string;
    model?: string;
}

/**
 * Get quartz.jsonc file path
 */
function getQuartzPath(): string {
    return path.join(process.cwd(), CONFIG_FILE.NAME);
}

/**
 * 读取配置文件
 * @param cliOverrides - Optional CLI overrides for OpenAI config
 */
export function readQuartzConfig(cliOverrides?: CLIOverrides): QuartzConfig {
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

    let config = defaultConfig;

    if (fs.existsSync(quartzPath)) {
        try {
            const content = fs.readFileSync(quartzPath, 'utf-8');
            const data = parseJsonc(content);

            if (data[CONFIG_FILE.DEFAULT_PROFILE]?.config) {
                config = data[CONFIG_FILE.DEFAULT_PROFILE].config;
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.warn(`Failed to parse quartz.jsonc: ${errorMessage}. Using default config.`);
        }
    }

    // Apply CLI overrides (CLI args take precedence over config file)
    if (cliOverrides) {
        if (cliOverrides.apiKey) {
            config.openai.apiKey = cliOverrides.apiKey;
        }
        if (cliOverrides.baseUrl) {
            config.openai.baseUrl = cliOverrides.baseUrl;
        }
        if (cliOverrides.model) {
            config.openai.model = cliOverrides.model;
        }
    }

    return config;
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
 * @param cliOverrides - Optional CLI overrides for OpenAI config
 */
export function loadConfig(cliOverrides?: CLIOverrides): QuartzConfig {
    return readQuartzConfig(cliOverrides);
}

/**
 * 获取平台配置列表
 * @param cliOverrides - Optional CLI overrides for OpenAI config
 */
export function getPlatformConfigs(cliOverrides?: CLIOverrides): PlatformConfig[] {
    const config = readQuartzConfig(cliOverrides);
    return config.platforms;
}

/**
 * 根据平台类型获取配置
 * @param type - Platform type
 * @param cliOverrides - Optional CLI overrides for OpenAI config
 */
export function getPlatformConfig(type: 'github' | 'gitlab', cliOverrides?: CLIOverrides): PlatformConfig | undefined {
    const config = readQuartzConfig(cliOverrides);
    return config.platforms.find(p => p.type === type);
}

/**
 * 添加或更新平台配置
 */
export function upsertPlatformConfig(platformConfig: PlatformConfig, cliOverrides?: CLIOverrides): void {
    const config = readQuartzConfig(cliOverrides);
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
export function removePlatformConfig(type: 'github' | 'gitlab', url?: string, cliOverrides?: CLIOverrides): void {
    const config = readQuartzConfig(cliOverrides);
    config.platforms = config.platforms.filter(p => {
        if (p.type !== type) return true;
        return !!(url && p.url !== url);
    });
    writeQuartzConfig(config);
}

/**
 * Parse CLI arguments for global OpenAI config overrides
 * @param args - Command line arguments array
 * @returns Parsed CLI overrides
 */
export function parseCLIOverrides(args: string[]): CLIOverrides {
    const overrides: CLIOverrides = {};

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        
        // Support --apikey=value or --apikey value formats
        if (arg.startsWith('--apikey=')) {
            overrides.apiKey = arg.split('=')[1];
        } else if (arg === '--apikey' && i + 1 < args.length) {
            overrides.apiKey = args[++i];
        }
        
        if (arg.startsWith('--baseurl=')) {
            overrides.baseUrl = arg.split('=')[1];
        } else if (arg === '--baseurl' && i + 1 < args.length) {
            overrides.baseUrl = args[++i];
        }
        
        if (arg.startsWith('--model=')) {
            overrides.model = arg.split('=')[1];
        } else if (arg === '--model' && i + 1 < args.length) {
            overrides.model = args[++i];
        }
    }

    return overrides;
}