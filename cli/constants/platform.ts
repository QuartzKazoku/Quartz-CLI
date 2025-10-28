//cli/constants/platform.ts
/**
 * 平台类型常量
 */
export const PLATFORM_TYPES = {
    GITHUB: 'github',
    GITLAB: 'gitlab',
} as const;

/**
 * 支持的平台列表
 */
export const SUPPORTED_PLATFORMS = [
    { value: 'github', label: 'GitHub' },
    { value: 'gitlab', label: 'GitLab' },
] as const;