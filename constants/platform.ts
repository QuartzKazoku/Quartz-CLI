//cli/constants/platform.ts
/**
 * Platform type constants
 */
export const PLATFORM_TYPES = {
    GITHUB: 'github',
    GITLAB: 'gitlab',
} as const;

/**
 * List of supported platforms
 */
export const SUPPORTED_PLATFORMS = [
    { value: 'github', label: 'GitHub' },
    { value: 'gitlab', label: 'GitLab' },
] as const;