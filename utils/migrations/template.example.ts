//utils/migrations/template.example.ts
import type {Migration} from '@/types/migration';

/**
 * Migration to version template.example
 * Example: Add new language configuration structure
 */
export const migration_template_example: Migration = {
    version: 'template.example.version',
    description: 'Add separate UI and prompt language configuration',
    migrate: (config: any) => {
        // Iterate through all profiles
        for (const profileKey of Object.keys(config)) {
            if (profileKey === '_metadata') continue;

            const profile = config[profileKey];
            if (!profile.config) continue;

            migrateLanguageConfig(profile.config);
        }

        return config;
    },
};

function migrateLanguageConfig(config: any): void {
    if (typeof config.language === 'string') {
        migrateFromString(config);
    }

    if (config.language && typeof config.language === 'object') {
        ensureLanguageFields(config);
    }
}

function migrateFromString(config: any): void {
    const oldLang = config.language;
    config.language = {
        ui: oldLang,
        prompt: oldLang,
    };
}

function ensureLanguageFields(config: any): void {
    if (!config.language.ui) {
        config.language.ui = 'en';
    }
    if (!config.language.prompt) {
        config.language.prompt = 'en';
    }
}
