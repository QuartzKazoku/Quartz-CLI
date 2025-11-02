//utils/runtime-config.ts
/**
 * @fileoverview Runtime configuration injection utility
 * @description Provides runtime configuration override through environment variables for CI/CD environments
 * @author Quartz CLI Team
 * @version 1.0.0
 * @since 2025-10-29
 * @license MIT
 *
 * @example
 * // In CI/CD environment, set environment variables:
 * // export QUARTZ_OPENAI_API_KEY="sk-xxx"
 * // export QUARTZ_GITHUB_TOKEN="ghp_xxx"
 * // export QUARTZ_OPENAI_MODEL="gpt-4"
 *
 * import { getRuntimeConfig } from '@/utils/runtime-config';
 * const config = getRuntimeConfig();
 * console.log(config.openai.apiKey); // Uses env var if set, otherwise from config file
 */

import type {QuartzConfig} from '@/types';
import {DEFAULT_VALUES} from '@/constants/config';
import {logger} from '@/utils/logger';

/**
 * Environment variable prefix for Quartz configuration
 */
const ENV_PREFIX = 'QUARTZ_';

/**
 * Mapping of configuration keys to environment variable names
 */
const ENV_VAR_MAPPING = {
    OPENAI_API_KEY: `${ENV_PREFIX}OPENAI_API_KEY`,
    OPENAI_BASE_URL: `${ENV_PREFIX}OPENAI_BASE_URL`,
    OPENAI_MODEL: `${ENV_PREFIX}OPENAI_MODEL`,
    GITHUB_TOKEN: `${ENV_PREFIX}GITHUB_TOKEN`,
    GITLAB_TOKEN: `${ENV_PREFIX}GITLAB_TOKEN`,
    GITLAB_URL: `${ENV_PREFIX}GITLAB_URL`,
    QUARTZ_LANG: `${ENV_PREFIX}LANG`,
    PROMPT_LANG: `${ENV_PREFIX}PROMPT_LANG`,
} as const;

/**
 * Get environment variable value
 * @param key - Environment variable key
 * @returns Environment variable value or undefined
 */
function getEnvVar(key: string): string | undefined {
    return process.env[key];
}

/**
 * Check if any runtime environment variables are set
 * @returns True if at least one Quartz environment variable is set
 */
export function hasRuntimeConfig(): boolean {
    return Object.values(ENV_VAR_MAPPING).some(envKey => getEnvVar(envKey) !== undefined);
}

/**
 * Get all active runtime environment variables
 * @returns Object with all set environment variables
 */
export function getActiveRuntimeVars(): Record<string, string> {
    const activeVars: Record<string, string> = {};

    for (const [key, envKey] of Object.entries(ENV_VAR_MAPPING)) {
        const value = getEnvVar(envKey);
        if (value !== undefined) {
            activeVars[key] = value;
        }
    }

    return activeVars;
}

/**
 * Apply runtime configuration overrides to base configuration
 * Priority: Environment Variables > Config File > Defaults
 *
 * @param baseConfig - Base configuration from config file
 * @returns Merged configuration with runtime overrides applied
 */
export function applyRuntimeOverrides(baseConfig: QuartzConfig): QuartzConfig {
    const runtimeConfig: QuartzConfig = structuredClone(baseConfig);

    applyOpenAiOverrides(runtimeConfig);
    applyPlatformOverrides(runtimeConfig);
    applyLanguageOverrides(runtimeConfig);

    return runtimeConfig;
}

/**
 * Applies OpenAI-related environment variable overrides to the configuration.
 * Overrides API key, base URL, and model if corresponding environment variables are set.
 *
 * @param config - The configuration object to apply overrides to
 */
function applyOpenAiOverrides(config: QuartzConfig): void {
    const apiKey = getEnvVar(ENV_VAR_MAPPING.OPENAI_API_KEY);
    if (apiKey) {
        config.openai.apiKey = apiKey;
    }

    const baseUrl = getEnvVar(ENV_VAR_MAPPING.OPENAI_BASE_URL);
    if (baseUrl) {
        config.openai.baseUrl = baseUrl;
    }

    const model = getEnvVar(ENV_VAR_MAPPING.OPENAI_MODEL);
    if (model) {
        config.openai.model = model;
    }
}

/**
 * Applies platform-related environment variable overrides to the configuration.
 * Handles GitHub and GitLab token/url overrides, adding new platform entries if necessary.
 *
 * @param config - The configuration object to apply overrides to
 */
function applyPlatformOverrides(config: QuartzConfig): void {
    // Handle GitHub token override
    const githubToken = getEnvVar(ENV_VAR_MAPPING.GITHUB_TOKEN);
    if (githubToken) {
        const githubIndex = config.platforms.findIndex(p => p.type === 'github');
        if (githubIndex >= 0) {
            config.platforms[githubIndex].token = githubToken;
        } else {
            config.platforms.push({
                type: 'github',
                token: githubToken,
            });
        }
    }

    // Handle GitLab token and URL overrides
    const gitlabToken = getEnvVar(ENV_VAR_MAPPING.GITLAB_TOKEN);
    const gitlabUrl = getEnvVar(ENV_VAR_MAPPING.GITLAB_URL);

    if (gitlabToken) {
        const gitlabIndex = config.platforms.findIndex(p => p.type === 'gitlab');
        if (gitlabIndex >= 0) {
            config.platforms[gitlabIndex].token = gitlabToken;
            if (gitlabUrl) {
                config.platforms[gitlabIndex].url = gitlabUrl;
            }
        } else {
            config.platforms.push({
                type: 'gitlab',
                token: gitlabToken,
                url: gitlabUrl || DEFAULT_VALUES.GITLAB_URL,
            });
        }
    } else if (gitlabUrl) {
        const gitlabIndex = config.platforms.findIndex(p => p.type === 'gitlab');
        if (gitlabIndex >= 0) {
            config.platforms[gitlabIndex].url = gitlabUrl;
        }
    }
}

/**
 * Applies language-related environment variable overrides to the configuration.
 * Overrides UI language and prompt language if corresponding environment variables are set.
 *
 * @param config - The configuration object to apply overrides to
 */
function applyLanguageOverrides(config: QuartzConfig): void {
    const uiLang = getEnvVar(ENV_VAR_MAPPING.QUARTZ_LANG);
    if (uiLang) {
        config.language.ui = uiLang;
    }

    const promptLang = getEnvVar(ENV_VAR_MAPPING.PROMPT_LANG);
    if (promptLang) {
        config.language.prompt = promptLang;
    }
}



/**
 * Get runtime configuration with environment variable overrides
 * This is the main function to use for getting configuration in commands
 *
 * @param baseConfig - Base configuration from config file
 * @param silent - If true, don't log runtime override information
 * @returns Final configuration with runtime overrides applied
 */
export function getRuntimeConfig(baseConfig: QuartzConfig, silent = false): QuartzConfig {
    const hasRuntimeVars = hasRuntimeConfig();

    if (!hasRuntimeVars) {
        return baseConfig;
    }

    if (!silent) {
        const activeVars = getActiveRuntimeVars();
        const varNames = Object.keys(activeVars).map(key => {
            return ENV_VAR_MAPPING[key as keyof typeof ENV_VAR_MAPPING];
        });

        logger.info(`🔧 Detected runtime configuration overrides: ${varNames.join(', ')}`);
    }

    return applyRuntimeOverrides(baseConfig);
}

/**
 * Validate runtime configuration for required fields
 * Useful in CI/CD environments to ensure all necessary config is present
 *
 * @param config - Configuration to validate
 * @param requirePlatform - If true, requires at least one platform configuration
 * @returns Object with validation result and missing fields
 */
export function validateRuntimeConfig(
    config: QuartzConfig,
    requirePlatform = false
): { valid: boolean; missing: string[] } {
    const missing: string[] = [];

    if (!config.openai.apiKey || config.openai.apiKey.trim() === '') {
        missing.push('OpenAI API Key');
    }

    if (requirePlatform && config.platforms.length === 0) {
        missing.push('Platform Configuration (GitHub or GitLab)');
    }

    return {
        valid: missing.length === 0,
        missing,
    };
}

/**
 * Get configuration from environment variables only (ignore config file)
 * Useful for pure CI/CD environments without config files
 *
 * @returns Configuration built entirely from environment variables, or null if incomplete
 */
export function getEnvOnlyConfig(): QuartzConfig | null {
    const apiKey = getEnvVar(ENV_VAR_MAPPING.OPENAI_API_KEY);

    if (!apiKey) {
        return null;
    }

    const config: QuartzConfig = {
        openai: {
            apiKey,
            baseUrl: getEnvVar(ENV_VAR_MAPPING.OPENAI_BASE_URL) || DEFAULT_VALUES.OPENAI_BASE_URL,
            model: getEnvVar(ENV_VAR_MAPPING.OPENAI_MODEL) || DEFAULT_VALUES.OPENAI_MODEL,
        },
        platforms: [],
        language: {
            ui: getEnvVar(ENV_VAR_MAPPING.QUARTZ_LANG) || DEFAULT_VALUES.LANGUAGE_UI,
            prompt: getEnvVar(ENV_VAR_MAPPING.PROMPT_LANG) || DEFAULT_VALUES.LANGUAGE_PROMPT,
        },
    };

    // Add GitHub platform if token is provided
    const githubToken = getEnvVar(ENV_VAR_MAPPING.GITHUB_TOKEN);
    if (githubToken) {
        config.platforms.push({
            type: 'github',
            token: githubToken,
        });
    }

    // Add GitLab platform if token is provided
    const gitlabToken = getEnvVar(ENV_VAR_MAPPING.GITLAB_TOKEN);
    if (gitlabToken) {
        config.platforms.push({
            type: 'gitlab',
            token: gitlabToken,
            url: getEnvVar(ENV_VAR_MAPPING.GITLAB_URL) || DEFAULT_VALUES.GITLAB_URL,
        });
    }

    return config;
}

/**
 * Log current configuration source (for debugging)
 * Shows which values come from environment variables vs config file
 *
 * @param baseConfig - Base configuration from file
 * @param finalConfig - Final configuration after runtime overrides
 */
export function logConfigurationSource(baseConfig: QuartzConfig, finalConfig: QuartzConfig): void {
    logger.line();
    logger.info('📋 Configuration Source Analysis:');
    logger.line();

    // OpenAI API Key
    if (baseConfig.openai.apiKey === finalConfig.openai.apiKey) {
        logger.info('  ○ OpenAI API Key: Config File');
    } else {
        logger.success(`  ✓ OpenAI API Key: Environment Variable (${ENV_VAR_MAPPING.OPENAI_API_KEY})`);
    }

    // OpenAI Base URL
    if (baseConfig.openai.baseUrl === finalConfig.openai.baseUrl) {
        logger.info('  ○ OpenAI Base URL: Config File');
    } else {
        logger.success(`  ✓ OpenAI Base URL: Environment Variable (${ENV_VAR_MAPPING.OPENAI_BASE_URL})`);
    }

// OpenAI Model
    if (baseConfig.openai.model === finalConfig.openai.model) {
        logger.info('  ○ OpenAI Model: Config File');
    } else {
        logger.success(`  ✓ OpenAI Model: Environment Variable (${ENV_VAR_MAPPING.OPENAI_MODEL})`);
    }

    // Platform tokens
    const githubToken = getEnvVar(ENV_VAR_MAPPING.GITHUB_TOKEN);
    if (githubToken) {
        logger.success(`  ✓ GitHub Token: Environment Variable (${ENV_VAR_MAPPING.GITHUB_TOKEN})`);
    } else {
        const hasGithub = finalConfig.platforms.some(p => p.type === 'github');
        if (hasGithub) {
            logger.info('  ○ GitHub Token: Config File');
        }
    }

    const gitlabToken = getEnvVar(ENV_VAR_MAPPING.GITLAB_TOKEN);
    if (gitlabToken) {
        logger.success(`  ✓ GitLab Token: Environment Variable (${ENV_VAR_MAPPING.GITLAB_TOKEN})`);
    } else {
        const hasGitlab = finalConfig.platforms.some(p => p.type === 'gitlab');
        if (hasGitlab) {
            logger.info('  ○ GitLab Token: Config File');
        }
    }

    logger.line();
}

/**
 * Generate example environment variable configuration for CI/CD
 * @returns String with example .env file content
 */
export function generateEnvExample(): string {
    return `# Quartz CLI Runtime Configuration
# Set these environment variables in your CI/CD pipeline to override config file settings

# OpenAI Configuration
${ENV_VAR_MAPPING.OPENAI_API_KEY}=sk-your-api-key-here
${ENV_VAR_MAPPING.OPENAI_BASE_URL}=${DEFAULT_VALUES.OPENAI_BASE_URL}
${ENV_VAR_MAPPING.OPENAI_MODEL}=${DEFAULT_VALUES.OPENAI_MODEL}

# GitHub Configuration
${ENV_VAR_MAPPING.GITHUB_TOKEN}=ghp_your-github-token-here

# GitLab Configuration
${ENV_VAR_MAPPING.GITLAB_TOKEN}=glpat-your-gitlab-token-here
${ENV_VAR_MAPPING.GITLAB_URL}=${DEFAULT_VALUES.GITLAB_URL}

# Language Configuration
${ENV_VAR_MAPPING.QUARTZ_LANG}=${DEFAULT_VALUES.LANGUAGE_UI}
${ENV_VAR_MAPPING.PROMPT_LANG}=${DEFAULT_VALUES.LANGUAGE_PROMPT}
`;
}