//cli/i18n/index.ts
import type { Language, Translations } from './locales';
import { locales, defaultLanguage } from './locales';

/**
 * Current active language
 */
let currentLanguage: Language = defaultLanguage;

/**
 * Initialize language to default
 * @returns Initialized language code
 */
export function initLanguage(): Language {
  currentLanguage = defaultLanguage;
  return currentLanguage;
}

/**
 * Set current language
 * @param lang - Language code to set
 */
export function setLanguage(lang: Language) {
  if (locales[lang]) {
    currentLanguage = lang;
  }
}

/**
 * Get current active language
 * @returns Current language code
 */
export function getLanguage(): Language {
  return currentLanguage;
}

/**
 * Get translations for current language
 * @returns Translations object for current language
 */
export function getTranslations(): Translations {
  return locales[currentLanguage] || locales[defaultLanguage];
}

/**
 * Translate a key to localized text
 * @param key - Translation key (supports nested keys with dot notation, e.g., 'review.starting')
 * @param params - Optional parameters to interpolate into the translation
 * @returns Translated text with parameters replaced
 */
export function t(key: string, params?: Record<string, string | number>): string {
  const translations = getTranslations();
  
  // Support nested keys using dot notation
  const keys = key.split('.');
  let value: any = translations;
  
  for (const k of keys) {
    value = value?.[k];
    if (value === undefined) {
      return key; // Return key if translation not found
    }
  }
  
  let result = String(value);
  
  // Interpolate parameters into translation
  if (params) {
    for (const [key1, val] of Object.entries(params)) {
      result = result.replace(`{${key1}}`, String(val));
    }
  }
  
  return result;
}

/**
 * i18n utility object with translation methods
 */
export const i18n = {
  init: initLanguage,
  set: setLanguage,
  get: getLanguage,
  t,
  translations: getTranslations,
};

// Auto-initialize language on module load
initLanguage();