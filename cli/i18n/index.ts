import { Language, Translations, locales, defaultLanguage } from './locales';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Current language
let currentLanguage: Language = defaultLanguage;

// Get system language
function getSystemLanguage(): Language {
  const lang = process.env.LANG || process.env.LANGUAGE || '';
  
  if (lang.includes('zh_CN') || lang.includes('zh-CN')) {
    return 'zh-CN';
  } else if (lang.includes('zh_TW') || lang.includes('zh-TW')) {
    return 'zh-TW';
  } else if (lang.includes('ja')) {
    return 'ja';
  } else if (lang.includes('ko')) {
    return 'ko';
  }
  
  return defaultLanguage;
}

// Load language settings from config file
function loadLanguageFromConfig(): Language | null {
  // Priority 1: QUARTZ_LANG environment variable (from .env file)
  const quartzLang = process.env.QUARTZ_LANG;
  if (quartzLang && locales[quartzLang as Language]) {
    return quartzLang as Language;
  }

  // Priority 2: AI_LANG environment variable (legacy support)
  const envLang = process.env.AI_LANG;
  if (envLang && locales[envLang as Language]) {
    return envLang as Language;
  }

  // Priority 3: .ai-config.json file (legacy support)
  try {
    const configPath = join(process.cwd(), '.ai-config.json');
    if (existsSync(configPath)) {
      const config = JSON.parse(readFileSync(configPath, 'utf-8'));
      if (config.language && locales[config.language as Language]) {
        return config.language as Language;
      }
    }
  } catch (error) {
    // Ignore errors
  }
  
  return null;
}

// Initialize language
export function initLanguage(): Language {
  // Priority: QUARTZ_LANG env var (.env) > AI_LANG env var > .ai-config.json > system language > default language
  const configLang = loadLanguageFromConfig();
  currentLanguage = configLang || getSystemLanguage();
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
    Object.entries(params).forEach(([key, val]) => {
      result = result.replace(`{${key}}`, String(val));
    });
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