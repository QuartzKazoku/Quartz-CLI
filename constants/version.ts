/**
 * @fileoverview Version-related constants for Quartz CLI
 * @description Defines version numbers and version-related constants
 * @author Quartz CLI Team
 * @version 1.0.0
 * @since 2025-10-29
 * @license MIT
 * @copyright (c) 2025 Quartz
 *
 * @example
 *   import { VERSION } from '@/constants/version';
 *   console.log(VERSION.CURRENT_CONFIG); // => '0.1.1'
 *
 * @namespace VersionConstants
 * @module constants/version
 */

/**
 * Version constants
 * Defines version numbers used throughout the application
 * @type {object}
 * @readonly
 * @property {string} CURRENT_CONFIG - Current configuration schema version
 * @property {string} LEGACY_CONFIG - Legacy/old configuration version
 * @property {string} INITIAL_CLI - Initial CLI version fallback
 */
export const VERSION = {
    /** Current configuration schema version */
    CURRENT_CONFIG: '0.0.1',
    /** Legacy/old configuration version for migration */
    LEGACY_CONFIG: '0.0.0',
    /** Initial CLI version fallback */
    INITIAL_CLI: '0.1.0',
} as const;