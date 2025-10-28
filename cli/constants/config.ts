//cli/constants/config.ts
/**
 * 配置文件相关常量
 */
export const CONFIG_FILE = {
    NAME: 'quartz.json',
    DEFAULT_PROFILE: 'default',
} as const;

/**
 * 配置键名常量
 */
export const CONFIG_KEYS = {
    OPENAI_API_KEY: 'OPENAI_API_KEY',
    OPENAI_BASE_URL: 'OPENAI_BASE_URL',
    OPENAI_MODEL: 'OPENAI_MODEL',
    GITHUB_TOKEN: 'GITHUB_TOKEN',
    GITLAB_TOKEN: 'GITLAB_TOKEN',
    GITLAB_URL: 'GITLAB_URL',
    GIT_PLATFORM: 'GIT_PLATFORM',
    QUARTZ_LANG: 'QUARTZ_LANG',
    PROMPT_LANG: 'PROMPT_LANG',
} as const;

/**
 * 默认配置值
 */
export const DEFAULT_VALUES = {
    OPENAI_BASE_URL: 'https://api.openai.com/v1',
    OPENAI_MODEL: 'gpt-4-turbo-preview',
    GITLAB_URL: 'https://gitlab.com',
    LANGUAGE_UI: 'en',
    LANGUAGE_PROMPT: 'en',
} as const;
