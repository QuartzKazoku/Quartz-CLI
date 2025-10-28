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
