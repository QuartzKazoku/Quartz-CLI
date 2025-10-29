//cli/utils/migrations/1.2.0.ts
import type { Migration } from '@/types/migration';

/**
 * Migration to version 1.2.0
 * Example: Add new language configuration structure
 */
export const migration_1_2_0: Migration = {
  version: '1.2.0',
  description: 'Add separate UI and prompt language configuration',
  migrate: (config: any) => {
    // Iterate through all profiles
    for (const profileKey in config) {
      if (profileKey === '_metadata') continue;
      
      const profile = config[profileKey];
      if (!profile.config) continue;
      
      // If old language field exists as string, migrate to new structure
      if (typeof profile.config.language === 'string') {
        const oldLang = profile.config.language;
        profile.config.language = {
          ui: oldLang,
          prompt: oldLang,
        };
      }
      
      // Ensure language object has both fields
      if (profile.config.language && typeof profile.config.language === 'object') {
        if (!profile.config.language.ui) {
          profile.config.language.ui = 'en';
        }
        if (!profile.config.language.prompt) {
          profile.config.language.prompt = 'en';
        }
      }
    }
    
    return config;
  },
};