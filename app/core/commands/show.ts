//app/core/commands/show.ts

import {CommandDefinition} from "@/app/core/interfaces";
import {CommandObject, CommandVerb} from "@/app/core/enums";
import {CommandHandler} from "@/app/core";
import {getConfigManager} from "@/manager/config";
import {logger} from "@/utils/logger";
import {t} from "@/i18n";
import {CONFIG_FILE, CONFIG_KEYS,} from "@/constants/config";
import {CONFIG_ICONS, INDENT, SENSITIVE_KEYS, SEPARATOR_LENGTH, TOKEN_DISPLAY_LENGTH,} from "@/constants/ui";
import {PLATFORM_TYPES,} from "@/constants/platform";
import {getActiveRuntimeVars, logConfigurationSource} from "@/utils/runtime-config";

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
 * Get icon for configuration key
 */
function getConfigIcon(key: string): string {
    return CONFIG_ICONS[key] || '⚙️';
}

/**
 * Get configuration items list
 */
function getConfigItemsList() {
    return [
        {key: CONFIG_KEYS.OPENAI_API_KEY, label: t('config.keys.apiKey')},
        {key: CONFIG_KEYS.OPENAI_BASE_URL, label: t('config.keys.baseUrl')},
        {key: CONFIG_KEYS.OPENAI_MODEL, label: t('config.keys.model')},
        {key: CONFIG_KEYS.GITHUB_TOKEN, label: t('config.keys.githubToken')},
        {key: CONFIG_KEYS.GITLAB_TOKEN, label: t('config.keys.gitlabToken')},
        {key: CONFIG_KEYS.GITLAB_URL, label: t('config.keys.gitlabUrl')},
        {key: CONFIG_KEYS.QUARTZ_LANG, label: t('config.keys.language')},
        {key: CONFIG_KEYS.PROMPT_LANG, label: t('config.keys.promptLanguage')},
    ];
}

/**
 * Print ASCII art Logo
 */
function printLogo() {
    const logo = `
   ██████╗ ██╗   ██╗ █████╗ ██████╗ ████████╗███████╗
  ██╔═══██╗██║   ██║██╔══██╗██╔══██╗╚══██╔══╝╚══███╔╝
  ██║   ██║██║   ██║███████║██████╔╝   ██║     ███╔╝
  ██║▄▄ ██║██║   ██║██╔══██║██╔══██╗   ██║    ███╔╝
  ╚██████╔╝╚██████╔╝██║  ██║██║  ██║   ██║   ███████╗
   ╚▀▀═╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   ╚══════╝
  `;
    logger.gradient(logo);
}

/**
 * Display configuration priority information
 */
function displayConfigPriority() {
    console.log(logger.text.dim('📊 ' + t('config.priority')));
    logger.line();
}

/**
 * Display active configuration sources
 */
function displayActiveSources(hasRuntimeOverrides: boolean, hasProjectConfig: boolean, hasGlobalConfig: boolean) {
    const sources = [];
    if (hasRuntimeOverrides) {
        const activeVars = getActiveRuntimeVars();
        sources.push(logger.text.success(`✓ Environment (${Object.keys(activeVars).length} vars)`));
    }
    if (hasProjectConfig) {
        sources.push(logger.text.primary('✓ Project Config'));
    }
    if (hasGlobalConfig) {
        sources.push(logger.text.muted('✓ Global Config'));
    }
    sources.push(logger.text.dim('✓ Default Config'));

    console.log(logger.text.bold('📁 ' + t('config.activeSources')));
    for (const source of sources) {
        console.log(`  ${source}`);
    }
    logger.line();
}

/**
 * Display configuration items
 */
function displayConfigItems(config: any) {
    const configItems = getConfigItemsList();

    for (const item of configItems) {
        const value = getConfigDisplayValue(config, item.key);
        const icon = getConfigIcon(item.key);

        if (value) {
            const displayValue = isSensitiveKey(item.key) ? formatSensitiveValue(value) : value;
            console.log(`${' '.repeat(INDENT.LEVEL_1)}${icon}  ${logger.text.bold(item.label)}`);
            console.log(`${' '.repeat(INDENT.LEVEL_3)}${logger.text.primary(displayValue)}`);
        } else {
            console.log(`${' '.repeat(INDENT.LEVEL_1)}${icon}  ${logger.text.bold(item.label)}`);
            console.log(`${' '.repeat(INDENT.LEVEL_3)}${logger.text.dim(logger.text.error(t('config.notConfigured')))}`);
        }
        logger.line();
    }
}

/**
 * Display configured platforms
 */
function displayPlatforms(config: any) {
    if (config.platforms.length === 0) {
        return;
    }

    console.log(logger.text.bold('🔧 ' + t('config.configuredPlatforms')));
    logger.line();

    for (const platform of config.platforms) {
        console.log(`${' '.repeat(INDENT.LEVEL_1)}✓ ${logger.text.primary(platform.type.toUpperCase())}`);
        if (platform.url) {
            console.log(`${' '.repeat(INDENT.LEVEL_2)}URL: ${platform.url}`);
        }
        console.log(`${' '.repeat(INDENT.LEVEL_2)}Token: ${formatSensitiveValue(platform.token)}`);
        logger.line();
    }
}

/**
 * Display configuration file paths
 */
function displayConfigPaths(manager: any, hasProjectConfig: boolean, hasGlobalConfig: boolean) {
    logger.separator(SEPARATOR_LENGTH);

    if (hasProjectConfig) {
        console.log(logger.text.dim(`📄 Project: ${manager.getConfigPath()}`));
    }
    if (hasGlobalConfig) {
        console.log(logger.text.dim(`📄 Global:  ${manager.getConfigPath(true)}`));
    }
}

/**
 * Show config command handler - displays all current configurations
 */
const showConfigHandler: CommandHandler = async (context) => {
    const {command} = context;
    const isGlobal = command.parameters.global || false;
    
    const manager = getConfigManager();
    
    // 根据global参数决定读取哪个配置
    let config;
    let hasRuntimeOverrides;
    let hasGlobalConfig;
    let hasProjectConfig;
    
    if (isGlobal) {
        // 显示全局配置
        config = manager.readConfig(undefined, true); // 读取全局配置，不应用运行时覆盖
        hasRuntimeOverrides = false; // 全局配置不考虑运行时覆盖
        hasGlobalConfig = manager.globalConfigExists();
        hasProjectConfig = false; // 显示全局配置时不显示项目配置
    } else {
        config = manager.readRuntimeConfig();
        hasRuntimeOverrides = manager.hasRuntimeOverrides();
        hasGlobalConfig = manager.globalConfigExists();
        hasProjectConfig = manager.projectConfigExists();
    }

    logger.line();
    printLogo();
    logger.line();
    console.log(logger.text.bold(t('config.current')));
    logger.separator(SEPARATOR_LENGTH);
    logger.line();

    displayConfigPriority();
    displayActiveSources(hasRuntimeOverrides, hasProjectConfig, hasGlobalConfig);
    displayConfigItems(config);
    displayPlatforms(config);
    displayConfigPaths(manager, hasProjectConfig, hasGlobalConfig);

    if (hasRuntimeOverrides && !isGlobal) {
        const baseConfig = manager.readBaseConfig();
        logConfigurationSource(baseConfig, config);
    }

    logger.line();
};

/**
 * Show profile command handler - displays current profile configuration
 */
const showProfileHandler: CommandHandler = async (context) => {
    const {command} = context;
    const isGlobal = command.parameters.global || false;
    
    const manager = getConfigManager();
    
    // 根据global参数决定读取哪个profile配置
    let activeProfile;
    let config;
    
    if (isGlobal) {
        // 显示全局profile
        const globalConfigFile = manager.readConfigFile(true);
        activeProfile = globalConfigFile._metadata?.activeProfile || CONFIG_FILE.DEFAULT_PROFILE;
        const globalProfile = globalConfigFile[activeProfile] as any;
        config = globalProfile?.config || manager.readConfig(activeProfile, false);
    } else {
        // 显示当前项目profile
        activeProfile = manager.getActiveProfile();
        config = manager.readConfig(activeProfile, false); // Don't apply runtime overrides for profile view
    }

    logger.line();
    printLogo();
    logger.line();
    console.log(logger.text.bold(t('config.currentProfile')));
    logger.separator(SEPARATOR_LENGTH);
    logger.line();
    
    console.log(`${' '.repeat(INDENT.LEVEL_1)}📦 ${logger.text.primary(activeProfile)}`);
    logger.line();
    
    console.log(logger.text.bold('⚙️ ' + t('config.configItems')));
    logger.line();
    
    displayConfigItems(config);
    displayPlatforms(config);
    
    logger.line();
};

/**
 * Export show command definitions
 */
export const SHOW_COMMANDS: CommandDefinition[] = [
    {
        verb: CommandVerb.SHOW,
        object: CommandObject.CONFIG,
        description: 'Display all current configurations with priority information',
        parameters: [
            {
                name: 'global',
                type: 'boolean',
                required: false,
                defaultValue: false,
                description: 'Show global configuration instead of project configuration',
                aliases: ['g'],
            },
        ],
        examples: [
            'show config',
            'show config --global',
            'show config -g',
        ],
        category: 'show',
        handler: showConfigHandler
    }, {
        verb: CommandVerb.SHOW,
        object: CommandObject.PROFILE,
        description: 'Display current active profile configuration',
        parameters: [
            {
                name: 'global',
                type: 'boolean',
                required: false,
                defaultValue: false,
                description: 'Show global profile instead of project profile',
                aliases: ['g'],
            }
        ],
        examples: [
            'show profile',
            'show profile --global',
            'show profile -g',
        ],
        category: 'show',
        handler: showProfileHandler
    },
];