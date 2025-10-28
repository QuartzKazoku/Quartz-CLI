/**
 * 平台配置接口
 */
export interface PlatformConfig {
  type: 'github' | 'gitlab';
  url?: string;
  token: string;
}

/**
 * 语言配置接口
 */
export interface LanguageConfig {
  ui: string;        // UI语言 (QUARTZ_LANG)
  prompt: string;    // Prompt语言 (PROMPT_LANG)
}

/**
 * OpenAI配置接口
 */
export interface OpenAIConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

/**
 * Quartz配置结构
 */
export interface QuartzConfig {
  openai: OpenAIConfig;
  platforms: PlatformConfig[];
  language: LanguageConfig;
}

/**
 * 配置文件结构
 */
export interface QuartzConfigFile {
  default: {
    name: string;
    config: QuartzConfig;
  };
  [profileName: string]: {
    name: string;
    config: QuartzConfig;
  };
}

/**
 * 旧版配置键名（用于兼容性）
 */
export const LEGACY_CONFIG_KEYS = {
  OPENAI_API_KEY: 'OPENAI_API_KEY',
  OPENAI_BASE_URL: 'OPENAI_BASE_URL',
  OPENAI_MODEL: 'OPENAI_MODEL',
  GIT_PLATFORM: 'GIT_PLATFORM',
  GITHUB_TOKEN: 'GITHUB_TOKEN',
  GITLAB_TOKEN: 'GITLAB_TOKEN',
  GITLAB_URL: 'GITLAB_URL',
  QUARTZ_LANG: 'QUARTZ_LANG',
  PROMPT_LANG: 'PROMPT_LANG',
} as const;