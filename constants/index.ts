/**
 * @fileoverview Constants module entry point for Quartz CLI
 * @description Centralizes and exports all constants from submodules for unified access
 * @author Quartz CLI Team
 * @version 1.0.0
 * @since 2025-10-28
 * @license MIT
 * @copyright (c) 2025 Quartz
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