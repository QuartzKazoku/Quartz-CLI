//constants/index.ts
/**
 * @fileoverview Constants module entry point for Quartz CLI
 * @description Centralizes and exports all constants from submodules for unified access
 * @author @GeWuYou
 * @since 2025-10-28
 *
 * @example
 *   // Import all constants at once
 *   import * as constants from '@/constants';
 *   console.log(constants.PLATFORM_TYPES.GITHUB);
 *   console.log(constants.SUPPORTED_LANGUAGES);
 *   console.log(constants.CONFIG_KEYS.OPENAI_API_KEY);
 *
 *   // Or import specific constants
 *   import { PLATFORM_TYPES, SUPPORTED_LANGUAGES, CONFIG_KEYS } from '@/constants';
 *
 * @namespace ConstantsModule
 * @module constants/index
 */

// Re-export all constants from submodules for centralized access
export * from './platform';  // Platform-related constants (GitHub, GitLab)
export * from './ui';        // UI-related constants (languages, icons, terminal)
export * from './config';    // Configuration-related constants (keys, defaults)
export * from './version';   // Version-related constants (config version, CLI version)
export * from './encoding';  // Encoding and formatting constants (UTF-8, JSON indent)
export * from './cli';       // CLI-related constants (argument parsing)
export * from './review';    // Code review constants (score thresholds)