//cli/constants/ui.ts
import {CONFIG_KEYS} from "./config.ts";

/**
 * List of supported languages
 */
export const SUPPORTED_LANGUAGES = [
    {value: 'zh-CN', label: '简体中文 (Simplified Chinese)'},
    {value: 'zh-TW', label: '繁體中文 (Traditional Chinese)'},
    {value: 'ja', label: '日本語 (Japanese)'},
    {value: 'ko', label: '한국어 (Korean)'},
    {value: 'en', label: 'English'},
] as const;

/**
 * Configuration key icon mapping
 */
export const CONFIG_ICONS: Record<string, string> = {
    [CONFIG_KEYS.OPENAI_API_KEY]: '🔑',
    [CONFIG_KEYS.OPENAI_BASE_URL]: '🌐',
    [CONFIG_KEYS.OPENAI_MODEL]: '🤖',
    [CONFIG_KEYS.GIT_PLATFORM]: '🔧',
    [CONFIG_KEYS.GITHUB_TOKEN]: '🔐',
    [CONFIG_KEYS.GITLAB_TOKEN]: '🔐',
    [CONFIG_KEYS.GITLAB_URL]: '🌐',
    [CONFIG_KEYS.QUARTZ_LANG]: '🌍',
    [CONFIG_KEYS.PROMPT_LANG]: '🗣️',
} as const;

/**
 * Terminal control characters
 */
export const TERMINAL = {
    CLEAR: '\x1B[2J\x1B[0f',
    ARROW_UP: '\u001B[A',
    ARROW_DOWN: '\u001B[B',
    ENTER: '\r',
    NEWLINE: '\n',
    ESC: '\u001B',
    CTRL_C: '\u0003',
} as const;

/**
 * Sensitive configuration keys (need to hide display)
 */
export const SENSITIVE_KEYS = [
    CONFIG_KEYS.OPENAI_API_KEY,
    CONFIG_KEYS.GITHUB_TOKEN,
    CONFIG_KEYS.GITLAB_TOKEN,
] as const;

/**
 * Token display length (first N characters)
 */
export const TOKEN_DISPLAY_LENGTH = 8;

/**
 * Separator line length
 */
export const SEPARATOR_LENGTH = 70;

/**
 * Indentation space count
 */
export const INDENT = {
    LEVEL_1: 2,
    LEVEL_2: 4,
    LEVEL_3: 6,
} as const;
