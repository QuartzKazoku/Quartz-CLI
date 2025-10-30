//constants/platform.ts
/**
 * @fileoverview Platform-related constants for Quartz CLI
 * @description Defines supported Git platform types and their display labels
 * @author @GeWuYou
 * @since 2025-10-28
 *
 * @example
 *   import { PLATFORM_TYPES, SUPPORTED_PLATFORMS } from '@/constants/platform';
 *   console.log(PLATFORM_TYPES.GITHUB); // => 'github'
 *   console.log(SUPPORTED_PLATFORMS[0].label); // => 'GitHub'
 *
 * @namespace PlatformConstants
 * @module constants/platform
 * @exports {PLATFORM_TYPES, SUPPORTED_PLATFORMS}
 */


/**
 * Platform type constants
 * Defines the supported Git platform identifiers used throughout the application
 * @enum {string}
 * @readonly
 * @property {string} GITHUB - GitHub platform identifier
 * @property {string} GITLAB - GitLab platform identifier
 */
export const PLATFORM_TYPES = {
    /** GitHub platform identifier */
    GITHUB: 'github',
    /** GitLab platform identifier */
    GITLAB: 'gitlab',
} as const;

/**
 * List of supported platforms
 * Contains platform configuration with display labels for user interface
 * @type {Array<{value: string, label: string}>}
 * @readonly
 */
export const SUPPORTED_PLATFORMS = [
    /** GitHub platform configuration */
    { value: 'github', label: 'GitHub' },
    /** GitLab platform configuration */
    { value: 'gitlab', label: 'GitLab' },
] as const;