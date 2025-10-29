//cli/tests/config-manager.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { getConfigManager } from '@/manager/config';
import { CONFIG_FILE } from '@/constants';

describe('ConfigManager', () => {
  const testDir = path.join(process.cwd(), '.quartz-test');
  const testConfigPath = path.join(testDir, CONFIG_FILE.NAME);
  let originalCwd: string;

  beforeEach(() => {
    // 保存原始工作目录
    originalCwd = process.cwd();
    
    // 创建测试目录
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testDir, { recursive: true });
    
    // 清除配置管理器缓存
    const configManager = getConfigManager();
    configManager.clearCache();
  });

  afterEach(() => {
    // 清理测试目录
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    
    // 恢复工作目录
    process.chdir(originalCwd);
  });

  describe('基本功能', () => {
    it('应该返回单例实例', () => {
      const manager1 = getConfigManager();
      const manager2 = getConfigManager();
      expect(manager1).toBe(manager2);
    });

    it('应该正确检查配置文件是否存在', () => {
      const configManager = getConfigManager();
      const exists = configManager.configExists();
      expect(typeof exists).toBe('boolean');
    });

    it('应该能够创建配置目录', () => {
      const configManager = getConfigManager();
      configManager.ensureConfigDir();
      const configDir = configManager.getConfigDir();
      expect(fs.existsSync(configDir)).toBe(true);
    });
  });

  describe('配置读写', () => {
    it('应该能够读取默认配置', () => {
      const configManager = getConfigManager();
      const config = configManager.readConfig();
      
      expect(config).toBeDefined();
      expect(config.openai).toBeDefined();
      expect(config.platforms).toBeDefined();
      expect(config.language).toBeDefined();
    });

    it('应该能够写入配置', () => {
      const configManager = getConfigManager();
      const config = configManager.readConfig();
      
      config.openai.apiKey = 'test-api-key';
      configManager.writeConfig(config);
      
      // 清除缓存后重新读取
      configManager.clearCache();
      const updatedConfig = configManager.readConfig();
      
      expect(updatedConfig.openai.apiKey).toBe('test-api-key');
    });
  });

  describe('平台配置管理', () => {
    it('应该能够添加平台配置', () => {
      const configManager = getConfigManager();
      
      configManager.upsertPlatformConfig({
        type: 'github',
        token: 'github-token',
      });
      
      const platforms = configManager.getPlatformConfigs();
      expect(platforms).toHaveLength(1);
      expect(platforms[0].type).toBe('github');
      expect(platforms[0].token).toBe('github-token');
    });

    it('应该能够更新平台配置', () => {
      const configManager = getConfigManager();
      
      configManager.upsertPlatformConfig({
        type: 'github',
        token: 'old-token',
      });
      
      configManager.upsertPlatformConfig({
        type: 'github',
        token: 'new-token',
      });
      
      const platforms = configManager.getPlatformConfigs();
      expect(platforms).toHaveLength(1);
      expect(platforms[0].token).toBe('new-token');
    });

    it('应该能够获取特定平台配置', () => {
      const configManager = getConfigManager();
      
      configManager.upsertPlatformConfig({
        type: 'github',
        token: 'github-token',
      });
      
      const githubConfig = configManager.getPlatformConfig('github');
      expect(githubConfig).toBeDefined();
      expect(githubConfig?.token).toBe('github-token');
      
      const gitlabConfig = configManager.getPlatformConfig('gitlab');
      expect(gitlabConfig).toBeUndefined();
    });

    it('应该能够删除平台配置', () => {
      const configManager = getConfigManager();
      
      configManager.upsertPlatformConfig({
        type: 'github',
        token: 'github-token',
      });
      
      configManager.removePlatformConfig('github');
      
      const platforms = configManager.getPlatformConfigs();
      expect(platforms).toHaveLength(0);
    });
  });

  describe('Profile 管理', () => {
    it('应该能够列出所有 profiles', () => {
      const configManager = getConfigManager();
      const profiles = configManager.listProfiles();
      
      expect(Array.isArray(profiles)).toBe(true);
      expect(profiles).toContain('default');
    });

    it('应该能够检查 profile 是否存在', () => {
      const configManager = getConfigManager();
      
      expect(configManager.profileExists('default')).toBe(true);
      expect(configManager.profileExists('non-existent')).toBe(false);
    });

    it('应该能够创建新 profile', () => {
      const configManager = getConfigManager();
      const config = configManager.readConfig();
      
      config.openai.apiKey = 'work-api-key';
      configManager.writeConfig(config, 'work');
      
      expect(configManager.profileExists('work')).toBe(true);
      
      const workConfig = configManager.readConfig('work');
      expect(workConfig.openai.apiKey).toBe('work-api-key');
    });

    it('应该能够复制 profile', () => {
      const configManager = getConfigManager();
      const config = configManager.readConfig();
      
      config.openai.apiKey = 'original-key';
      configManager.writeConfig(config, 'original');
      
      configManager.copyProfile('original', 'copy');
      
      expect(configManager.profileExists('copy')).toBe(true);
      
      const copiedConfig = configManager.readConfig('copy');
      expect(copiedConfig.openai.apiKey).toBe('original-key');
    });

    it('应该能够删除 profile', () => {
      const configManager = getConfigManager();
      const config = configManager.readConfig();
      
      configManager.writeConfig(config, 'temp');
      expect(configManager.profileExists('temp')).toBe(true);
      
      configManager.deleteProfile('temp');
      expect(configManager.profileExists('temp')).toBe(false);
    });

    it('不应该能够删除 default profile', () => {
      const configManager = getConfigManager();
      
      expect(() => {
        configManager.deleteProfile('default');
      }).toThrow();
    });
  });

  describe('配置值设置', () => {
    it('应该能够设置 OpenAI API Key', () => {
      const configManager = getConfigManager();
      
      configManager.setOpenAIApiKey('new-api-key');
      
      const config = configManager.readConfig();
      expect(config.openai.apiKey).toBe('new-api-key');
    });

    it('应该能够设置 OpenAI Base URL', () => {
      const configManager = getConfigManager();
      
      configManager.setOpenAIBaseUrl('https://custom.api.com/v1');
      
      const config = configManager.readConfig();
      expect(config.openai.baseUrl).toBe('https://custom.api.com/v1');
    });

    it('应该能够设置 OpenAI Model', () => {
      const configManager = getConfigManager();
      
      configManager.setOpenAIModel('gpt-4');
      
      const config = configManager.readConfig();
      expect(config.openai.model).toBe('gpt-4');
    });

    it('应该能够设置 UI 语言', () => {
      const configManager = getConfigManager();
      
      configManager.setUILanguage('zh-CN');
      
      const config = configManager.readConfig();
      expect(config.language.ui).toBe('zh-CN');
    });

    it('应该能够设置 Prompt 语言', () => {
      const configManager = getConfigManager();
      
      configManager.setPromptLanguage('ja');
      
      const config = configManager.readConfig();
      expect(config.language.prompt).toBe('ja');
    });
  });

  describe('版本管理', () => {
    it('应该能够初始化版本元数据', () => {
      const configManager = getConfigManager();
      
      const metadata = configManager.initializeVersionMetadata();
      
      expect(metadata).toBeDefined();
      expect(metadata.configVersion).toBeDefined();
      expect(metadata.cliVersion).toBeDefined();
      expect(metadata.updatedAt).toBeDefined();
    });

    it('应该能够读取版本元数据', () => {
      const configManager = getConfigManager();
      
      configManager.initializeVersionMetadata();
      const metadata = configManager.readVersionMetadata();
      
      expect(metadata).toBeDefined();
      expect(metadata?.configVersion).toBeDefined();
    });
  });

  describe('缓存机制', () => {
    it('应该能够清除缓存', () => {
      const configManager = getConfigManager();
      
      // 读取配置以填充缓存
      configManager.readConfig();
      
      // 清除缓存应该不会抛出错误
      expect(() => {
        configManager.clearCache();
      }).not.toThrow();
    });
  });

  describe('导入导出', () => {
    it('应该能够导出配置', () => {
      const configManager = getConfigManager();
      const config = configManager.readConfig();
      
      config.openai.apiKey = 'test-key';
      configManager.writeConfig(config);
      
      const exported = configManager.exportConfig();
      
      expect(typeof exported).toBe('string');
      expect(exported).toContain('test-key');
    });

    it('应该能够导入配置', () => {
      const configManager = getConfigManager();
      
      const importData = JSON.stringify({
        openai: {
          apiKey: 'imported-key',
          baseUrl: 'https://api.openai.com/v1',
          model: 'gpt-4',
        },
        platforms: [],
        language: {
          ui: 'en',
          prompt: 'en',
        },
      });
      
      configManager.importConfig(importData, 'imported');
      
      const config = configManager.readConfig('imported');
      expect(config.openai.apiKey).toBe('imported-key');
    });
  });
});