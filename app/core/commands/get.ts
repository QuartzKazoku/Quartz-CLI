//app/core/commands/get.ts

import {CommandDefinition} from "@/app/core/interfaces";
import {CommandObject, CommandVerb} from "@/app/core/enums";
import {CommandHandler} from "@/app/core";
import {getConfigManager} from "@/manager/config";
import {logger} from "@/utils/logger";
import {t} from "@/i18n";
import {
    CONFIG_KEYS,
} from "@/constants/config";
import {
    SENSITIVE_KEYS,
    TOKEN_DISPLAY_LENGTH,
} from "@/constants/ui";
import {
    PLATFORM_TYPES,
} from "@/constants/platform";

/**
 * Check if configuration key is sensitive information
 */
function isSensitiveKey(key: string): boolean {
    return SENSITIVE_KEYS.includes(key as any);
}

/**
 * Format sensitive value display
 */
function formatSensitiveValue(value: string): string {
    return value.substring(0, TOKEN_DISPLAY_LENGTH) + '***';
}

/**
 * Helper function to get display value from configuration structure
 */
function getConfigDisplayValue(config: any, key: string): string | undefined {
    switch (key) {
        case CONFIG_KEYS.OPENAI_API_KEY:
            return config.openai.apiKey;
        case CONFIG_KEYS.OPENAI_BASE_URL:
            return config.openai.baseUrl;
        case CONFIG_KEYS.OPENAI_MODEL:
            return config.openai.model;
        case CONFIG_KEYS.QUARTZ_LANG:
            return config.language.ui;
        case CONFIG_KEYS.PROMPT_LANG:
            return config.language.prompt;
        case CONFIG_KEYS.GITHUB_TOKEN:
            return config.platforms.find((p: any) => p.type === PLATFORM_TYPES.GITHUB)?.token;
        case CONFIG_KEYS.GITLAB_TOKEN:
            return config.platforms.find((p: any) => p.type === PLATFORM_TYPES.GITLAB)?.token;
        case CONFIG_KEYS.GITLAB_URL:
            return config.platforms.find((p: any) => p.type === PLATFORM_TYPES.GITLAB)?.url;
        case CONFIG_KEYS.GIT_PLATFORM:
            return config.platforms.length > 0 ? config.platforms[0].type : undefined;
        default:
            return undefined;
    }
}

/**
 * Get configuration value with global/project profile support and priority handling
 * @param key - Configuration key to retrieve
 * @param isGlobal - Whether to get from global profile only
 */
function getConfig(key: string, isGlobal: boolean = false) {
    const manager = getConfigManager();
    
    // 根据global参数决定读取哪个配置
    let config;
    if (isGlobal) {
        // 只读取全局配置
        config = manager.readConfig(undefined, false); // 不应用运行时覆盖
    } else {
        // 读取完整配置（包含优先级处理：环境变量 > 项目配置 > 全局配置 > 默认值）
        config = manager.readConfig();
    }
    
    const value = getConfigDisplayValue(config, key);

    if (value) {
        const displayValue = isSensitiveKey(key) ? formatSensitiveValue(value) : value;
        logger.log(`${key}=${displayValue}`);
    } else {
        logger.log(t('config.notSet', {key}));
    }
}

/**
 * Get config command handler - gets configuration values for specified keys
 */
const getConfigHandler: CommandHandler = async (context) => {
    const {command} = context;
    const isGlobal = command.parameters.global || false;
    
    // 从命令参数中获取key
    // 在新命令系统中，位置参数通过args数组传递
    const args = command.args || [];
    
    if (args.length < 1) {
        logger.error(t('config.errors.getUsage'));
        logger.info('Usage: get config <key> [--global]');
        logger.info('Example: get config OPENAI_API_KEY --global');
        return;
    }
    
    const key = args[0];
    
    getConfig(key, isGlobal);
};

/**
 * Export get command definitions
 */
export const GET_COMMANDS: CommandDefinition[] = [
    {
        verb: CommandVerb.GET,
        object: CommandObject.CONFIG,
        description: 'Get configuration value for specified key',
        parameters: [
            {
                name: 'global',
                type: 'boolean',
                required: false,
                defaultValue: false,
                description: 'Get from global profile only (ignore project config and environment variables)',
                aliases: ['g'],
            },
        ],
        examples: [
            'get config OPENAI_API_KEY',
            'get config OPENAI_MODEL',
            'get config QUARTZ_LANG --global',
            'get config GITHUB_TOKEN -g',
        ],
        category: 'configuration',
        handler: getConfigHandler
    },
];