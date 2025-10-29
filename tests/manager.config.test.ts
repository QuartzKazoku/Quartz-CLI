//cli/tests/config-manager.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { getConfigManager } from '@/manager/config';
import { CONFIG_FILE } from '@/constants';

// 兼容的递归删除函数
function removeRecursive(dir: string) {
  if (!fs.existsSync(dir)) return;
  
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      removeRecursive(filePath);
    } else {
      fs.unlinkSync(filePath);
    }
  }
  
  fs.rmdirSync(dir);
}

describe('ConfigManager', () => {
  const testDir = path.join(process.cwd(), '.quartz-test');
  const testConfigPath = path.join(testDir, CONFIG_FILE.NAME);
  let originalCwd: string;

  beforeEach(() => {
    // 保存原始工作目录
    originalCwd = process.cwd();
    
    // 创建测试目录
    if (fs.existsSync(testDir)) {
      removeRecursive(testDir);
    }
    fs.mkdirSync(testDir, { recursive: true });
    
    // 清除配置管理器缓存
    const configManager = getConfigManager();
    configManager.clearCache();
  });

  afterEach(() => {
    // 清理测试目录
    if (fs.existsSync(testDir)) {
      removeRecursive(testDir);
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
      
      // 先清空所有平台配置
      const config = configManager.readConfig();
      config.platforms = [];
      configManager.writeConfig(config);
      
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
      
      // 先清空所有平台配置
      const config = configManager.readConfig();
      config.platforms = [];
      configManager.writeConfig(config);
      
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
      
      // 先清空所有平台配置
      const config = configManager.readConfig();
      config.platforms = [];
      configManager.writeConfig(config);
      
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
      
      // 先清空所有平台配置
      const config = configManager.readConfig();
      config.platforms = [];
      configManager.writeConfig(config);
      
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
      
      // 先删除可能存在的 copy profile
      if (configManager.profileExists('copy')) {
        configManager.deleteProfile('copy');
      }
      
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

  describe('Active Profile 管理', () => {
    it('应该返回默认的 active profile', () => {
      const configManager = getConfigManager();
      configManager.initializeVersionMetadata();
      
      const activeProfile = configManager.getActiveProfile();
      expect(activeProfile).toBe('default');
    });

    it('应该能够切换 active profile', () => {
      const configManager = getConfigManager();
      
      // 创建一个新 profile
      const config = configManager.readConfig();
      config.openai.apiKey = 'work-api-key';
      configManager.writeConfig(config, 'work');
      
      // 切换到新 profile
      configManager.setActiveProfile('work');
      
      const activeProfile = configManager.getActiveProfile();
      expect(activeProfile).toBe('work');
    });

    it('切换 profile 后读取配置应该使用新的 active profile', () => {
      const configManager = getConfigManager();
      
      // 设置 default profile 的配置
      const defaultConfig = configManager.readConfig();
      defaultConfig.openai.apiKey = 'default-key';
      configManager.writeConfig(defaultConfig);
      
      // 创建并设置 work profile
      const workConfig = configManager.readConfig();
      workConfig.openai.apiKey = 'work-key';
      configManager.writeConfig(workConfig, 'work');
      
      // 切换到 work profile
      configManager.setActiveProfile('work');
      configManager.clearCache();
      
      // 不指定 profileName，应该读取 active profile
      const config = configManager.readConfig();
      expect(config.openai.apiKey).toBe('work-key');
    });

    it('应该在切换回 default profile 后正确读取配置', () => {
      const configManager = getConfigManager();
      
      // 确保从干净的状态开始
      configManager.setActiveProfile('default');
      
      // 设置 default profile
      const defaultConfig = configManager.readConfig('default');
      defaultConfig.openai.apiKey = 'default-key';
      configManager.writeConfig(defaultConfig, 'default');
      configManager.clearCache();
      
      // 创建独立的 work profile
      const baseConfig = configManager.readConfig('default');
      const workConfig = { ...baseConfig, openai: { ...baseConfig.openai, apiKey: 'work-key' } };
      configManager.writeConfig(workConfig, 'work');
      configManager.clearCache();
      
      // 切换到 work
      configManager.setActiveProfile('work');
      configManager.clearCache();
      expect(configManager.readConfig().openai.apiKey).toBe('work-key');
      
      // 切换回 default
      configManager.setActiveProfile('default');
      configManager.clearCache();
      expect(configManager.readConfig().openai.apiKey).toBe('default-key');
    });

    it('尝试切换到不存在的 profile 应该抛出错误', () => {
      const configManager = getConfigManager();
      
      expect(() => {
        configManager.setActiveProfile('non-existent');
      }).toThrow("Profile 'non-existent' does not exist");
    });

    it('写入配置时不指定 profile 应该使用 active profile', () => {
      const configManager = getConfigManager();
      
      // 创建 work profile 并切换
      const config = configManager.readConfig();
      configManager.writeConfig(config, 'work');
      configManager.setActiveProfile('work');
      
      // 修改配置但不指定 profile
      const updatedConfig = configManager.readConfig();
      updatedConfig.openai.apiKey = 'new-work-key';
      configManager.writeConfig(updatedConfig);
      
      // 验证更新的是 work profile
      configManager.clearCache();
      const workConfig = configManager.readConfig('work');
      expect(workConfig.openai.apiKey).toBe('new-work-key');
      
      // 验证 default profile 未被修改
      const defaultConfig = configManager.readConfig('default');
      expect(defaultConfig.openai.apiKey).not.toBe('new-work-key');
    });

    it('平台配置操作应该使用 active profile', () => {
      const configManager = getConfigManager();
      
      // 清空 default profile 的平台配置
      const defaultConfig = configManager.readConfig('default');
      defaultConfig.platforms = [];
      configManager.writeConfig(defaultConfig, 'default');
      
      // 创建 work profile 并清空平台配置
      const workConfig = configManager.readConfig('default');
      workConfig.platforms = [];
      configManager.writeConfig(workConfig, 'work');
      
      // 切换到 work profile
      configManager.setActiveProfile('work');
      
      // 添加平台配置（不指定 profile）
      configManager.upsertPlatformConfig({
        type: 'github',
        token: 'work-github-token',
      });
      
      // 验证平台配置添加到了 work profile
      configManager.clearCache();
      const workPlatforms = configManager.getPlatformConfigs('work');
      expect(workPlatforms).toHaveLength(1);
      expect(workPlatforms[0].token).toBe('work-github-token');
      
      // 验证 default profile 没有这个平台配置
      const defaultPlatforms = configManager.getPlatformConfigs('default');
      expect(defaultPlatforms).toHaveLength(0);
    });

    it('metadata 应该正确保存和读取 activeProfile', () => {
      const configManager = getConfigManager();
      
      // 初始化元数据
      configManager.initializeVersionMetadata();
      
      // 创建新 profile 并切换
      const config = configManager.readConfig();
      configManager.writeConfig(config, 'work');
      configManager.setActiveProfile('work');
      
      // 清除缓存后读取 metadata
      configManager.clearCache();
      const metadata = configManager.readVersionMetadata();
      
      expect(metadata).toBeDefined();
      expect(metadata?.activeProfile).toBe('work');
    });

    it('多次切换 profile 应该正确更新状态', () => {
      const configManager = getConfigManager();
      
      // 获取默认配置作为基础
      const baseConfig = configManager.readConfig('default');
      
      // 创建多个 profiles
      ['work', 'personal', 'test'].forEach(name => {
        const config = { ...baseConfig };
        config.openai.apiKey = `${name}-key`;
        configManager.writeConfig(config, name);
      });
      
      // 依次切换并验证
      configManager.setActiveProfile('work');
      configManager.clearCache();
      expect(configManager.getActiveProfile()).toBe('work');
      expect(configManager.readConfig().openai.apiKey).toBe('work-key');
      
      configManager.setActiveProfile('personal');
      configManager.clearCache();
      expect(configManager.getActiveProfile()).toBe('personal');
      expect(configManager.readConfig().openai.apiKey).toBe('personal-key');
      
      configManager.setActiveProfile('test');
      configManager.clearCache();
      expect(configManager.getActiveProfile()).toBe('test');
      expect(configManager.readConfig().openai.apiKey).toBe('test-key');
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