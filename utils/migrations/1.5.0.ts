//cli/utils/migrations/1.5.0.ts
import type { Migration } from '@/types/migration';

/**
 * Migration to version 1.5.0
 * Example: Normalize platform URLs and add default values
 */
export const migration_1_5_0: Migration = {
  version: '1.5.0',
  description: 'Normalize platform URLs and ensure required fields',
  migrate: (config: any) => {
    // Iterate through all profiles
    for (const profileKey in config) {
      if (profileKey === '_metadata') continue;
      
      const profile = config[profileKey];
      if (!profile.config) continue;
      
      // Ensure platforms array exists
      if (!profile.config.platforms) {
        profile.config.platforms = [];
      }
      
      // Normalize each platform configuration
      profile.config.platforms = profile.config.platforms.map((platform: any) => {
        // Add default URL for GitHub if missing
        if (platform.type === 'github' && !platform.url) {
          platform.url = 'https://github.com';
        }
        
        // Add default URL for GitLab if missing
        if (platform.type === 'gitlab' && !platform.url) {
          platform.url = 'https://gitlab.com';
        }
        
        // Ensure token exists
        if (!platform.token) {
          platform.token = '';
        }
        
        return platform;
      });
      
      // Ensure OpenAI config has all required fields
      if (profile.config.openai) {
        if (!profile.config.openai.apiKey) {
          profile.config.openai.apiKey = '';
        }
        if (!profile.config.openai.baseUrl) {
          profile.config.openai.baseUrl = 'https://api.openai.com/v1';
        }
        if (!profile.config.openai.model) {
          profile.config.openai.model = 'gpt-5';
        }
      }
    }
    
    return config;
  },
};