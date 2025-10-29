//cli/constants/ui.ts


import {CONFIG_KEYS} from "./config";

/**
 * 支持的语言列表
 */
export const SUPPORTED_LANGUAGES = [
    {value: 'zh-CN', label: '简体中文 (Simplified Chinese)'},
    {value: 'zh-TW', label: '繁體中文 (Traditional Chinese)'},
    {value: 'ja', label: '日本語 (Japanese)'},
    {value: 'ko', label: '한국어 (Korean)'},
    {value: 'en', label: 'English'},
] as const;

/**
 * 配置键图标映射
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
 * 终端控制字符
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
 * 敏感配置键（需要隐藏显示）
 */
export const SENSITIVE_KEYS = [
    CONFIG_KEYS.OPENAI_API_KEY,
    CONFIG_KEYS.GITHUB_TOKEN,
    CONFIG_KEYS.GITLAB_TOKEN,
] as const;

/**
 * Token 显示长度（前N个字符）
 */
export const TOKEN_DISPLAY_LENGTH = 8;

/**
 * 分隔线长度
 */
export const SEPARATOR_LENGTH = 70;

/**
 * 缩进空格数
 */
export const INDENT = {
    LEVEL_1: 2,
    LEVEL_2: 4,
    LEVEL_3: 6,
} as const;
