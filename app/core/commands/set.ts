//app/core/commands/set.ts

import {CommandDefinition} from "@/app/core/interfaces";
import {CommandObject, CommandVerb} from "@/app/core/enums";
import {CommandHandler} from "@/app/core";
import {getConfigManager} from "@/manager/config";
import {logger} from "@/utils/logger";
import {t} from "@/i18n";
import {CONFIG_KEYS, DEFAULT_VALUES,} from "@/constants/config";
import {SENSITIVE_KEYS, TOKEN_DISPLAY_LENGTH,} from "@/constants/ui";
import {PLATFORM_TYPES,} from "@/constants/platform";

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
 * Set configuration value with global/project profile support
 * @param key - Configuration key to set
 * @param value - Value to set
 * @param isGlobal - Whether to set in global profile
 */
function setConfig(key: string, value: string, isGlobal: boolean = false) {
    const manager = getConfigManager();
    
    // 根据global参数决定读取哪个配置
    let config;
    if (isGlobal) {
        // 读取全局配置
        config = manager.readConfig(undefined, false); // 不应用运行时覆盖
    } else {
        // 读取当前配置
        config = manager.readConfig();
    }

    switch (key) {
        case CONFIG_KEYS.OPENAI_API_KEY:
            config.openai.apiKey = value;
            break;
        case CONFIG_KEYS.OPENAI_BASE_URL:
            config.openai.baseUrl = value;
            break;
        case CONFIG_KEYS.OPENAI_MODEL:
            config.openai.model = value;
            break;
        case CONFIG_KEYS.QUARTZ_LANG:
            config.language.ui = value;
            break;
        case CONFIG_KEYS.PROMPT_LANG:
            config.language.prompt = value;
            break;
        case CONFIG_KEYS.GITHUB_TOKEN:
            manager.upsertPlatformConfig({type: PLATFORM_TYPES.GITHUB, token: value}, isGlobal ? undefined : manager.getActiveProfile());
            logger.log(t('config.set', {key, value: '***'}));
            logger.success(t('config.updated'));
            return;
        case CONFIG_KEYS.GITLAB_TOKEN: {
            const existingGitlab = config.platforms.find(p => p.type === PLATFORM_TYPES.GITLAB);
            manager.upsertPlatformConfig({
                type: PLATFORM_TYPES.GITLAB,
                token: value,
                url: existingGitlab?.url || DEFAULT_VALUES.GITLAB_URL
            }, isGlobal ? undefined : manager.getActiveProfile());
            logger.log(t('config.set', {key, value: '***'}));
            logger.success(t('config.updated'));
            return;
        }
        case CONFIG_KEYS.GITLAB_URL: {
            const existingGitlab = config.platforms.find(p => p.type === PLATFORM_TYPES.GITLAB);
            if (existingGitlab) {
                manager.upsertPlatformConfig({...existingGitlab, url: value}, isGlobal ? undefined : manager.getActiveProfile());
            } else {
                logger.error(t('config.gitlabTokenSetFirst'));
                return;
            }
            logger.log(t('config.set', {key, value}));
            logger.success(t('config.updated'));
            return;
        }
        case CONFIG_KEYS.GIT_PLATFORM:
            logger.warn(t('config.gitPlatformDeprecated'));
            return;
        default:
            logger.error(t('config.unknownKey', {key}));
            return;
    }

    // 写入配置到对应的profile
    manager.writeConfig(config, isGlobal ? undefined : manager.getActiveProfile(), isGlobal);
    logger.log(t('config.set', {key, value: isSensitiveKey(key) ? '***' : value}));
    logger.success(t('config.updated'));
}

/**
 * Set config command handler - sets configuration values for specified keys
 */
const setConfigHandler: CommandHandler = async (context) => {
    const {command} = context;
    const isGlobal = command.parameters.global || false;
    
    // 从命令参数中获取key和value
    // 在新命令系统中，位置参数通过args数组传递
    const args = command.args || [];
    
    if (args.length < 2) {
        logger.error(t('config.errors.setUsage'));
        logger.info('Usage: set config <key> <value> [--global]');
        logger.info('Example: set config OPENAI_API_KEY sk-your-key --global');
        return;
    }
    
    const key = args[0];
    const value = args[1];
    
    setConfig(key, value, isGlobal);
};

/**
 * Export set command definitions
 */
export const SET_COMMANDS: CommandDefinition[] = [
    {
        verb: CommandVerb.SET,
        object: CommandObject.CONFIG,
        description: 'Set configuration value for specified key',
        parameters: [
            {
                name: 'global',
                type: 'boolean',
                required: false,
                defaultValue: false,
                description: 'Set in global profile instead of current project profile',
                aliases: ['g'],
            },
        ],
        examples: [
            'set config OPENAI_API_KEY sk-your-key',
            'set config OPENAI_MODEL gpt-4',
            'set config QUARTZ_LANG zh-CN --global',
            'set config GITHUB_TOKEN ghp_your-token -g',
        ],
        category: 'configuration',
        handler: setConfigHandler
    },
];