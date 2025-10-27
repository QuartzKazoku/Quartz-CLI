import fs from 'node:fs';
import path from 'node:path';

/**
 * Configuration structure
 */
export interface QuartzConfig {
  openaiApiKey: string;
  openaiBaseUrl: string;
  openaiModel: string;
  githubToken: string;
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
 * Parse a single environment variable line
 * @param line - Line from .env file
 * @returns Parsed key-value pair or null
 */
function parseEnvLine(line: string): { key: string; value: string } | null {
  const regex = /^([^=]+)=(.*)$/;
  const match = regex.exec(line);
  if (!match) return null;
  
  return {
    key: match[1].trim(),
    value: match[2].trim(),
  };
}

/**
 * Load configuration from .env file
 * @returns Configuration object or null
 */
function loadEnvFile(): Record<string, string> | null {
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    return null;
  }

  try {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const lines = envContent.split('\n');
    const config: Record<string, string> = {};
    
    for (const line of lines) {
      const parsed = parseEnvLine(line);
      if (parsed) {
        config[parsed.key] = parsed.value;
      }
    }
    
    return config;
  } catch (error) {
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
    githubToken: '',
  };

  // Load from quartz.json only
  const quartzConfig = loadQuartzJson();
  if (quartzConfig) {
    if (quartzConfig.OPENAI_API_KEY) config.openaiApiKey = quartzConfig.OPENAI_API_KEY;
    if (quartzConfig.OPENAI_BASE_URL) config.openaiBaseUrl = quartzConfig.OPENAI_BASE_URL;
    if (quartzConfig.OPENAI_MODEL) config.openaiModel = quartzConfig.OPENAI_MODEL;
    if (quartzConfig.GITHUB_TOKEN) config.githubToken = quartzConfig.GITHUB_TOKEN;
  }

  return config;
}