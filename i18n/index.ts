//cli/i18n/index.ts
import type { Language, Translations } from './locales';
import { locales, defaultLanguage } from './locales';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// Current language
let currentLanguage: Language = defaultLanguage;

// Load language settings from config file
function loadLanguageFromConfig(): Language | null {
  // Priority 1: .ai-config.json file (legacy support)
  try {
    const configPath = join(process.cwd(), '.ai-config.json');
    if (existsSync(configPath)) {
      const config = JSON.parse(readFileSync(configPath, 'utf-8'));
      if (config.language && locales[config.language as Language]) {
        return config.language as Language;
      }
    }
  } catch (error) {
      console.warn('Failed to load or parse .ai-config.json:', error);
  }
  
  return null;
}

// Initialize language
export function initLanguage(): Language {
  // Priority: .ai-config.json > default language
  const configLang = loadLanguageFromConfig();
  currentLanguage = configLang || defaultLanguage;
  return currentLanguage;
}

// Set language
export function setLanguage(lang: Language) {
  if (locales[lang]) {
    currentLanguage = lang;
  }
}

// Get current language
export function getLanguage(): Language {
  return currentLanguage;
}

// Get translations
export function getTranslations(): Translations {
  return locales[currentLanguage] || locales[defaultLanguage];
}

// Translation function
export function t(key: string, params?: Record<string, string | number>): string {
  const translations = getTranslations();
  
  // Support nested keys, e.g., 'review.starting'
  const keys = key.split('.');
  let value: any = translations;
  
  for (const k of keys) {
    value = value?.[k];
    if (value === undefined) {
      return key; // If translation not found, return the key itself
    }
  }
  
  let result = String(value);
  
  // Replace parameters
  if (params) {
    for (const [key1, val] of Object.entries(params)) {
      result = result.replace(`{${key1}}`, String(val));
    }
  }
  
  return result;
}

// Export common translation shortcuts
export const i18n = {
  init: initLanguage,
  set: setLanguage,
  get: getLanguage,
  t,
  translations: getTranslations,
};

// Auto-initialize
initLanguage();