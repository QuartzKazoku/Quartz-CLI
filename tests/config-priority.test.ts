//tests/config-priority.test.ts
import {describe, it, expect, beforeEach, afterEach, vi} from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {ConfigManager} from '@/manager/config';
import type {QuartzConfig} from '@/types/config';

describe('Configuration Priority System', () => {
    let configManager: ConfigManager;
    let testProjectDir: string;
    let testGlobalDir: string;
    let originalCwd: string;
    let originalHome: string;

    beforeEach(() => {
        // Save original environment
        originalCwd = process.cwd();
        originalHome = os.homedir();

        // Create temporary test directories
        testProjectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'quartz-test-project-'));
        testGlobalDir = fs.mkdtempSync(path.join(os.tmpdir(), 'quartz-test-home-'));

        // Mock process.cwd() and os.homedir()
        vi.spyOn(process, 'cwd').mockReturnValue(testProjectDir);
        vi.spyOn(os, 'homedir').mockReturnValue(testGlobalDir);

        // Clear environment variables
        delete process.env.QUARTZ_OPENAI_API_KEY;
        delete process.env.QUARTZ_OPENAI_MODEL;
        delete process.env.QUARTZ_GITHUB_TOKEN;

        // Get fresh ConfigManager instance
        configManager = ConfigManager.getInstance();
        configManager.clearCache();
    });

    afterEach(() => {
        // Restore mocks
        vi.restoreAllMocks();

        // Cleanup test directories
        if (fs.existsSync(testProjectDir)) {
            fs.rmSync(testProjectDir, {recursive: true, force: true});
        }
        if (fs.existsSync(testGlobalDir)) {
            fs.rmSync(testGlobalDir, {recursive: true, force: true});
        }

        // Clear cache
        configManager.clearCache();
    });

    it('should use default config when no configs exist', () => {
        const config = configManager.readConfig(undefined, false);

        expect(config.openai.apiKey).toBe('');
        expect(config.openai.baseUrl).toBe('https://api.openai.com/v1');
        expect(config.openai.model).toBe('gpt-5');
        expect(config.platforms).toEqual([]);
    });

    it('should use global config when only global config exists', () => {
        // Create global config
        const globalConfig: QuartzConfig = {
            openai: {
                apiKey: 'global-api-key',
                baseUrl: 'https://global.api.com/v1',
                model: 'gpt-4',
            },
            platforms: [{type: 'github', token: 'global-github-token'}],
            language: {ui: 'en', prompt: 'en'},
        };

        configManager.writeConfig(globalConfig, undefined, true);
        configManager.clearCache();

        const config = configManager.readConfig(undefined, false);

        expect(config.openai.apiKey).toBe('global-api-key');
        expect(config.openai.model).toBe('gpt-4');
        expect(config.platforms[0].token).toBe('global-github-token');
    });

    it('should use project config when only project config exists', () => {
        // Create project config
        const projectConfig: QuartzConfig = {
            openai: {
                apiKey: 'project-api-key',
                baseUrl: 'https://project.api.com/v1',
                model: 'gpt-3.5-turbo',
            },
            platforms: [{type: 'gitlab', token: 'project-gitlab-token', url: 'https://gitlab.com'}],
            language: {ui: 'zh-CN', prompt: 'zh-CN'},
        };

        configManager.writeConfig(projectConfig, undefined, false);
        configManager.clearCache();

        const config = configManager.readConfig(undefined, false);

        expect(config.openai.apiKey).toBe('project-api-key');
        expect(config.openai.model).toBe('gpt-3.5-turbo');
        expect(config.language.ui).toBe('zh-CN');
    });

    it('should prioritize project config over global config', () => {
        // Create global config
        const globalConfig: QuartzConfig = {
            openai: {
                apiKey: 'global-api-key',
                baseUrl: 'https://global.api.com/v1',
                model: 'gpt-4',
            },
            platforms: [{type: 'github', token: 'global-github-token'}],
            language: {ui: 'en', prompt: 'en'},
        };

        // Create project config
        const projectConfig: QuartzConfig = {
            openai: {
                apiKey: 'project-api-key',
                baseUrl: 'https://project.api.com/v1',
                model: 'gpt-3.5-turbo',
            },
            platforms: [{type: 'gitlab', token: 'project-gitlab-token', url: 'https://gitlab.com'}],
            language: {ui: 'zh-CN', prompt: 'zh-CN'},
        };

        configManager.writeConfig(globalConfig, undefined, true);
        configManager.writeConfig(projectConfig, undefined, false);
        configManager.clearCache();

        const config = configManager.readConfig(undefined, false);

        // Project config should override global config
        expect(config.openai.apiKey).toBe('project-api-key');
        expect(config.openai.model).toBe('gpt-3.5-turbo');
        expect(config.language.ui).toBe('zh-CN');
        expect(config.platforms[0].type).toBe('gitlab');
    });

    it('should merge configs correctly with partial project config', () => {
        // Global config with full settings
        const globalConfig: QuartzConfig = {
            openai: {
                apiKey: 'global-api-key',
                baseUrl: 'https://global.api.com/v1',
                model: 'gpt-4',
            },
            platforms: [{type: 'github', token: 'global-github-token'}],
            language: {ui: 'en', prompt: 'en'},
        };

        // Project config with only partial settings
        const projectConfig: QuartzConfig = {
            openai: {
                apiKey: 'project-api-key',
                baseUrl: '',
                model: '',
            },
            platforms: [],
            language: {ui: 'zh-CN', prompt: ''},
        };

        configManager.writeConfig(globalConfig, undefined, true);
        configManager.writeConfig(projectConfig, undefined, false);
        configManager.clearCache();

        const config = configManager.readConfig(undefined, false);

        // Should use project apiKey and ui language
        expect(config.openai.apiKey).toBe('project-api-key');
        expect(config.language.ui).toBe('zh-CN');

        // Should fall back to global for empty values
        expect(config.openai.baseUrl).toBe('https://global.api.com/v1');
        expect(config.openai.model).toBe('gpt-4');
        expect(config.language.prompt).toBe('en');
        expect(config.platforms[0].token).toBe('global-github-token');
    });

    it('should prioritize environment variables over all configs', () => {
        // Set up configs
        const globalConfig: QuartzConfig = {
            openai: {
                apiKey: 'global-api-key',
                baseUrl: 'https://global.api.com/v1',
                model: 'gpt-4',
            },
            platforms: [],
            language: {ui: 'en', prompt: 'en'},
        };

        const projectConfig: QuartzConfig = {
            openai: {
                apiKey: 'project-api-key',
                baseUrl: 'https://project.api.com/v1',
                model: 'gpt-3.5-turbo',
            },
            platforms: [],
            language: {ui: 'zh-CN', prompt: 'zh-CN'},
        };

        configManager.writeConfig(globalConfig, undefined, true);
        configManager.writeConfig(projectConfig, undefined, false);

        // Set environment variables
        process.env.QUARTZ_OPENAI_API_KEY = 'env-api-key';
        process.env.QUARTZ_OPENAI_MODEL = 'gpt-4-turbo';
        process.env.QUARTZ_GITHUB_TOKEN = 'env-github-token';

        configManager.clearCache();

        const config = configManager.readConfig(undefined, true);

        // Environment variables should have highest priority
        expect(config.openai.apiKey).toBe('env-api-key');
        expect(config.openai.model).toBe('gpt-4-turbo');
        expect(config.platforms.some(p => p.type === 'github' && p.token === 'env-github-token')).toBe(true);

        // Non-overridden values should come from project config
        expect(config.openai.baseUrl).toBe('https://project.api.com/v1');
    });

    it('should respect applyRuntimeOverrides flag', () => {
        const projectConfig: QuartzConfig = {
            openai: {
                apiKey: 'project-api-key',
                baseUrl: 'https://project.api.com/v1',
                model: 'gpt-3.5-turbo',
            },
            platforms: [],
            language: {ui: 'en', prompt: 'en'},
        };

        configManager.writeConfig(projectConfig, undefined, false);

        // Set environment variable
        process.env.QUARTZ_OPENAI_API_KEY = 'env-api-key';

        configManager.clearCache();

        // Without runtime overrides
        const configWithoutEnv = configManager.readConfig(undefined, false);
        expect(configWithoutEnv.openai.apiKey).toBe('project-api-key');

        // With runtime overrides
        const configWithEnv = configManager.readConfig(undefined, true);
        expect(configWithEnv.openai.apiKey).toBe('env-api-key');
    });

    it('should handle missing directories gracefully', () => {
        // No config files exist
        expect(configManager.globalConfigExists()).toBe(false);
        expect(configManager.projectConfigExists()).toBe(false);

        // Should return default config without errors
        const config = configManager.readConfig(undefined, false);
        expect(config).toBeDefined();
        expect(config.openai.baseUrl).toBe('https://api.openai.com/v1');
    });
});