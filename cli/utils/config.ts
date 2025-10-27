import fs from 'node:fs';
import path from 'node:path';

/**
 * Configuration structure
 */
export interface QuartzConfig {
  openaiApiKey: string;
  openaiBaseUrl: string;
  openaiModel: string;
  gitPlatform: 'github' | 'gitlab';
  githubToken: string;
  gitlabToken: string;
  gitlabUrl: string;
}

/**
 * Load configuration from quartz.json
 * @returns Configuration object from default profile or null
 */
function loadQuartzJson(): Record<string, string> | null {
  const quartzPath = path.join(process.cwd(), 'quartz.json');
  if (!fs.existsSync(quartzPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(quartzPath, 'utf-8');
    const data = JSON.parse(content);
    
    // Get default profile
    if (data.default && data.default.configs) {
      return data.default.configs;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to parse quartz.json:', error);
    return null;
  }
}


/**
 * Load configuration from quartz.json only
 *
 * @returns Configuration object
 */
export function loadConfig(): QuartzConfig {
  const config: QuartzConfig = {
    openaiApiKey: '',
    openaiBaseUrl: 'https://api.openai.com/v1',
    openaiModel: 'gpt-4-turbo-preview',
    gitPlatform: 'github',
    githubToken: '',
    gitlabToken: '',
    gitlabUrl: 'https://gitlab.com',
  };

  // Load from quartz.json only
  const quartzConfig = loadQuartzJson();
  if (quartzConfig) {
    if (quartzConfig.OPENAI_API_KEY) config.openaiApiKey = quartzConfig.OPENAI_API_KEY;
    if (quartzConfig.OPENAI_BASE_URL) config.openaiBaseUrl = quartzConfig.OPENAI_BASE_URL;
    if (quartzConfig.OPENAI_MODEL) config.openaiModel = quartzConfig.OPENAI_MODEL;
    if (quartzConfig.GIT_PLATFORM) config.gitPlatform = quartzConfig.GIT_PLATFORM as 'github' | 'gitlab';
    if (quartzConfig.GITHUB_TOKEN) config.githubToken = quartzConfig.GITHUB_TOKEN;
    if (quartzConfig.GITLAB_TOKEN) config.gitlabToken = quartzConfig.GITLAB_TOKEN;
    if (quartzConfig.GITLAB_URL) config.gitlabUrl = quartzConfig.GITLAB_URL;
  }

  return config;
}