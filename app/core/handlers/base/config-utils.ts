//app/core/handlers/base/config-utils.ts

import {CONFIG_KEYS} from "@/constants/config";
import {SENSITIVE_KEYS, TOKEN_DISPLAY_LENGTH} from "@/constants/ui";
import {PLATFORM_TYPES} from "@/constants/platform";

/**
 * Configuration utility functions
 * Shared across different config handlers
 */
export class ConfigUtils {
    /**
     * Check if configuration key is sensitive information
     */
    static isSensitiveKey(key: string): boolean {
        return SENSITIVE_KEYS.includes(key as any);
    }

    /**
     * Format sensitive value display
     */
    static formatSensitiveValue(value: string): string {
        return value.substring(0, TOKEN_DISPLAY_LENGTH) + '***';
    }

    /**
     * Get display value from configuration structure
     */
    static getConfigDisplayValue(config: any, key: string): string | undefined {
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
     * Get configuration items list for display
     */
    static getConfigItemsList(t: any) {
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
     * Validate configuration key
     */
    static isValidConfigKey(key: string): boolean {
        return Object.values(CONFIG_KEYS).includes(key as any);
    }

    /**
     * Get configuration key description
     */
    static getConfigKeyDescription(key: string, t: any): string {
        const items = this.getConfigItemsList(t);
        const item = items.find(item => item.key === key);
        return item?.label || key;
    }
}