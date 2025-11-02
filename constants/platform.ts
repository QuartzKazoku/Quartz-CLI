//constants/platform.ts
/**
 * @fileoverview Platform-related constants for Quartz CLI
 * @description Defines supported Git platform types and their display labels
 * @author @GeWuYou
 * @version 2.0.0
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

import { PlatformType } from '@/types/enums';

/**
 * Platform type constants
 * Defines the supported Git platform identifiers used throughout the application
 * Now linked to PlatformType enum for better type safety
 * @type {object}
 * @readonly
 * @property {string} GITHUB - GitHub platform identifier
 * @property {string} GITLAB - GitLab platform identifier
 */
export const PLATFORM_TYPES = {
    /** GitHub platform identifier */
    GITHUB: PlatformType.GITHUB,
    /** GitLab platform identifier */
    GITLAB: PlatformType.GITLAB,
} as const;

/**
 * List of supported platforms
 * Contains platform configuration with display labels for user interface
 * @type {Array<{value: PlatformType, label: string}>}
 * @readonly
 */
export const SUPPORTED_PLATFORMS = [
    /** GitHub platform configuration */
    { value: PlatformType.GITHUB, label: 'GitHub' },
    /** GitLab platform configuration */
    { value: PlatformType.GITLAB, label: 'GitLab' },
] as const;