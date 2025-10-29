/**
 * @fileoverview UI-related constants for Quartz CLI
 * @description Defines UI elements, languages, icons, and terminal control constants
 * @author @GeWuYou
 * @since 2025-10-28
 *
 * @example
 *   import { SUPPORTED_LANGUAGES, CONFIG_ICONS, TERMINAL } from '@/constants/ui';
 *   console.log(SUPPORTED_LANGUAGES[0].label); // => '简体中文 (Simplified Chinese)'
 *   console.log(CONFIG_ICONS[CONFIG_KEYS.OPENAI_API_KEY]); // => '🔑'
 *   console.log(TERMINAL.CLEAR); // => '\x1B[2J\x1B[0f'
 *
 * @namespace UIConstants
 * @module constants/ui
 */

import { CONFIG_KEYS } from "./config";

/**
 * List of supported languages
 * Contains language codes and their display labels for internationalization
 * @type {Array<{value: string, label: string}>}
 * @readonly
 */
export const SUPPORTED_LANGUAGES = [
    /** Simplified Chinese - Mainland China */
    { value: 'zh-CN', label: '简体中文 (Simplified Chinese)' },
    /** Traditional Chinese - Taiwan, Hong Kong */
    { value: 'zh-TW', label: '繁體中文 (Traditional Chinese)' },
    /** Japanese - Japan */
    { value: 'ja', label: '日本語 (Japanese)' },
    /** Korean - South Korea */
    { value: 'ko', label: '한국어 (Korean)' },
    /** English - International */
    { value: 'en', label: 'English' },
] as const;

/**
 * Configuration key icon mapping
 * Maps configuration keys to their corresponding display icons for better UI visualization
 * @type {Record<string, string>}
 * @readonly
 */
export const CONFIG_ICONS: Record<string, string> = {
    /** Icon for OpenAI API key configuration */
    [CONFIG_KEYS.OPENAI_API_KEY]: '🔑',
    /** Icon for OpenAI base URL configuration */
    [CONFIG_KEYS.OPENAI_BASE_URL]: '🌐',
    /** Icon for OpenAI model configuration */
    [CONFIG_KEYS.OPENAI_MODEL]: '🤖',
    /** Icon for Git platform selection configuration */
    [CONFIG_KEYS.GIT_PLATFORM]: '🔧',
    /** Icon for GitHub token configuration */
    [CONFIG_KEYS.GITHUB_TOKEN]: '🔐',
    /** Icon for GitLab token configuration */
    [CONFIG_KEYS.GITLAB_TOKEN]: '🔐',
    /** Icon for GitLab URL configuration */
    [CONFIG_KEYS.GITLAB_URL]: '🌐',
    /** Icon for Quartz language configuration */
    [CONFIG_KEYS.QUARTZ_LANG]: '🌍',
    /** Icon for prompt language configuration */
    [CONFIG_KEYS.PROMPT_LANG]: '🗣️',
} as const;

/**
 * Terminal control characters
 * Contains ANSI escape codes and special characters for terminal control and input handling
 * @type {object}
 * @readonly
 * @property {string} CLEAR - Clear screen and move cursor to top-left
 * @property {string} ARROW_UP - Up arrow key escape sequence
 * @property {string} ARROW_DOWN - Down arrow key escape sequence
 * @property {string} ENTER - Carriage return character
 * @property {string} NEWLINE - Line feed character
 * @property {string} ESC - Escape character
 * @property {string} CTRL_C - Control-C interrupt character
 */
export const TERMINAL = {
    /** Clear entire screen and reset cursor position */
    CLEAR: '\x1B[2J\x1B[0f',
    /** Up arrow key ANSI escape sequence */
    ARROW_UP: '\u001B[A',
    /** Down arrow key ANSI escape sequence */
    ARROW_DOWN: '\u001B[B',
    /** Enter/Return key character */
    ENTER: '\r',
    /** New line character */
    NEWLINE: '\n',
    /** Escape key character */
    ESC: '\u001B',
    /** Control-C interrupt signal */
    CTRL_C: '\u0003',
} as const;

/**
 * Sensitive configuration keys
 * List of configuration keys that contain sensitive data and should be masked in display
 * @type {string[]}
 * @readonly
 */
export const SENSITIVE_KEYS = [
    /** OpenAI API key - should be masked in UI */
    CONFIG_KEYS.OPENAI_API_KEY,
    /** GitHub personal access token - should be masked in UI */
    CONFIG_KEYS.GITHUB_TOKEN,
    /** GitLab personal access token - should be masked in UI */
    CONFIG_KEYS.GITLAB_TOKEN,
] as const;

/**
 * Token display length
 * Number of characters to show when displaying sensitive tokens (e.g., 'abcd...')
 * @type {number}
 * @readonly
 */
export const TOKEN_DISPLAY_LENGTH = 8;

/**
 * Separator line length
 * Number of characters for UI separator lines and borders
 * @type {number}
 * @readonly
 */
export const SEPARATOR_LENGTH = 70;

/**
 * Indentation space count
 * Defines indentation levels for consistent UI formatting and text alignment
 * @type {object}
 * @readonly
 * @property {number} LEVEL_1 - First level indentation (2 spaces)
 * @property {number} LEVEL_2 - Second level indentation (4 spaces)
 * @property {number} LEVEL_3 - Third level indentation (6 spaces)
 */
export const INDENT = {
    /** First level indentation - 2 spaces */
    LEVEL_1: 2,
    /** Second level indentation - 4 spaces */
    LEVEL_2: 4,
    /** Third level indentation - 6 spaces */
    LEVEL_3: 6,
} as const;
