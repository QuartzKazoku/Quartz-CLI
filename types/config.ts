//cli/types/config.ts
/**
 * Platform configuration interface
 */
export interface PlatformConfig {
  type: 'github' | 'gitlab';
  url?: string;
  token: string;
}

/**
 * Language configuration interface
 */
export interface LanguageConfig {
  ui: string;        // UI language (QUARTZ_LANG)
  prompt: string;    // Prompt language (PROMPT_LANG)
}

/**
 * OpenAI configuration interface
 */
export interface OpenAIConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

/**
 * Quartz configuration structure
 */
export interface QuartzConfig {
  openai: OpenAIConfig;
  platforms: PlatformConfig[];
  language: LanguageConfig;
}

/**
 * Configuration file structure
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
