//cli/manager/config.ts
import fs from 'node:fs';
import {parse as parseJsonc} from 'jsonc-parser';
import type {PlatformConfig, QuartzConfig, QuartzConfigFile, QuartzProfile} from '@/types/config';
import type {VersionMetadata} from '@/types/migration';
import {CONFIG_FILE, DEFAULT_VALUES, ENCODING, JSON_FORMAT, VERSION} from '@/constants';
import {logger} from '@/utils/logger';
import {ensureQuartzDir, getQuartzDir, getQuartzPath} from '@/utils/path';
import {CURRENT_CONFIG_VERSION} from "@/utils/migration";
import {formatDate} from "@/utils/date";

/**
 * 统一的配置管理器
 * 负责配置文件的读写、版本管理、迁移等所有操作
 * 使用单例模式确保全局只有一个配置管理器实例
 */
export class ConfigManager {
    private static instance: ConfigManager;
    private configCache: QuartzConfigFile | null = null;
    private cacheTimestamp: number = 0;
    private readonly CACHE_TTL = 5000; // 缓存5秒

    private constructor() {}

    /**
     * 获取配置管理器单例实例
     */
    public static getInstance(): ConfigManager {
        if (!ConfigManager.instance) {
            ConfigManager.instance = new ConfigManager();
        }
        return ConfigManager.instance;
    }

    /**
     * 获取配置文件路径
     */
    public getConfigPath(): string {
        return getQuartzPath();
    }

    /**
     * 获取配置目录路径
     */
    public getConfigDir(): string {
        return getQuartzDir();
    }

    /**
     * 确保配置目录存在
     */
    public ensureConfigDir(): void {
        ensureQuartzDir();
    }

    /**
     * 检查配置文件是否存在
     */
    public configExists(): boolean {
        return fs.existsSync(this.getConfigPath());
    }

    /**
     * 清除缓存
     */
    public clearCache(): void {
        this.configCache = null;
        this.cacheTimestamp = 0;
    }

    /**
     * 读取完整的配置文件（包含所有profile和metadata）
     */
    public readConfigFile(): QuartzConfigFile {
        const now = Date.now();
        
        // 使用缓存
        if (this.configCache && (now - this.cacheTimestamp) < this.CACHE_TTL) {
            return this.configCache;
        }

        const quartzPath = this.getConfigPath();

        // 如果文件不存在，返回默认配置文件结构
        if (!fs.existsSync(quartzPath)) {
            const defaultConfigFile: QuartzConfigFile = {
                _metadata: this.createDefaultMetadata(),
                default: {
                    name: CONFIG_FILE.DEFAULT_PROFILE,
                    config: this.createDefaultConfig(),
                },
            };
            this.configCache = defaultConfigFile;
            this.cacheTimestamp = now;
            return defaultConfigFile;
        }

        try {
            const content = fs.readFileSync(quartzPath, ENCODING.UTF8);
            const data = parseJsonc(content) as QuartzConfigFile;

            // 如果没有metadata，添加默认metadata
            data._metadata ??= {
                configVersion: VERSION.LEGACY_CONFIG,
                cliVersion: VERSION.LEGACY_CONFIG,
                updatedAt: formatDate(this.readConfig().language.ui),
            };

            // 如果没有default profile，添加默认profile
            if (!data.default) {
                data.default = {
                    name: CONFIG_FILE.DEFAULT_PROFILE,
                    config: this.createDefaultConfig(),
                };
            }

            this.configCache = data;
            this.cacheTimestamp = now;
            return data;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.warn(`Failed to parse config file: ${errorMessage}. Using default config.`);
            
            const defaultConfigFile: QuartzConfigFile = {
                _metadata: this.createDefaultMetadata(),
                default: {
                    name: CONFIG_FILE.DEFAULT_PROFILE,
                    config: this.createDefaultConfig(),
                },
            };
            this.configCache = defaultConfigFile;
            this.cacheTimestamp = now;
            return defaultConfigFile;
        }
    }

    /**
     * 写入完整的配置文件
     */
    public writeConfigFile(configFile: QuartzConfigFile): void {
        this.ensureConfigDir();
        const quartzPath = this.getConfigPath();

        try {
            // 更新metadata的时间戳
            if (configFile._metadata) {
                configFile._metadata.updatedAt = formatDate(this.readConfig().language.ui);
            }

            fs.writeFileSync(
                quartzPath,
                JSON.stringify(configFile, null, JSON_FORMAT.INDENT),
                ENCODING.UTF8
            );

            // 清除缓存，确保下次读取最新数据
            this.clearCache();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.error(`Failed to write config file: ${errorMessage}`);
            throw error;
        }
    }

    /**
     * 读取指定profile的配置
     */
    public readConfig(profileName: string = CONFIG_FILE.DEFAULT_PROFILE): QuartzConfig {
        const configFile = this.readConfigFile();
        const profile = configFile[profileName] as QuartzProfile | undefined;

        if (profile?.config) {
            return profile.config;
        }

        // 如果指定的profile不存在，返回默认配置
        return this.createDefaultConfig();
    }

    /**
     * 写入指定profile的配置
     */
    public writeConfig(config: QuartzConfig, profileName: string = CONFIG_FILE.DEFAULT_PROFILE): void {
        const configFile = this.readConfigFile();

        // 更新或创建profile
        configFile[profileName] = {
            name: profileName,
            config,
        };

        this.writeConfigFile(configFile);
    }

    /**
     * 创建默认配置
     */
    private createDefaultConfig(): QuartzConfig {
        return {
            openai: {
                apiKey: '',
                baseUrl: DEFAULT_VALUES.OPENAI_BASE_URL,
                model: DEFAULT_VALUES.OPENAI_MODEL,
            },
            platforms: [],
            language: {
                ui: DEFAULT_VALUES.LANGUAGE_UI,
                prompt: DEFAULT_VALUES.LANGUAGE_PROMPT,
            },
        };
    }

    /**
     * 创建默认的版本元数据
     */
    private createDefaultMetadata(): VersionMetadata {
        return {
            configVersion: CURRENT_CONFIG_VERSION,
            cliVersion: this.getCliVersion(),
            updatedAt: formatDate(this.readConfig().language.ui),
        };
    }

    /**
     * 获取CLI版本
     */
    public getCliVersion(): string {
        try {
            const packageJsonPath = require.resolve('../../package.json');
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, ENCODING.UTF8));
            return packageJson.version || VERSION.INITIAL_CLI;
        } catch {
            return VERSION.INITIAL_CLI;
        }
    }

    // ==================== 版本管理相关方法 ====================

    /**
     * 读取版本元数据
     */
    public readVersionMetadata(): VersionMetadata | null {
        if (!this.configExists()) {
            return null;
        }

        const configFile = this.readConfigFile();
        return configFile._metadata || null;
    }

    /**
     * 写入版本元数据
     */
    public writeVersionMetadata(metadata: VersionMetadata): void {
        const configFile = this.readConfigFile();
        configFile._metadata = metadata;
        this.writeConfigFile(configFile);
    }

    /**
     * 初始化版本元数据
     */
    public initializeVersionMetadata(): VersionMetadata {
        const metadata = this.createDefaultMetadata();
        this.writeVersionMetadata(metadata);
        return metadata;
    }

    // ==================== 平台配置相关方法 ====================

    /**
     * 获取所有平台配置
     */
    public getPlatformConfigs(profileName: string = CONFIG_FILE.DEFAULT_PROFILE): PlatformConfig[] {
        const config = this.readConfig(profileName);
        return config.platforms;
    }

    /**
     * 根据平台类型获取配置
     */
    public getPlatformConfig(
        type: 'github' | 'gitlab',
        profileName: string = CONFIG_FILE.DEFAULT_PROFILE
    ): PlatformConfig | undefined {
        const config = this.readConfig(profileName);
        return config.platforms.find(p => p.type === type);
    }

    /**
     * 添加或更新平台配置
     */
    public upsertPlatformConfig(
        platformConfig: PlatformConfig,
        profileName: string = CONFIG_FILE.DEFAULT_PROFILE
    ): void {
        const config = this.readConfig(profileName);
        const existingIndex = config.platforms.findIndex(
            p => p.type === platformConfig.type && p.url === platformConfig.url
        );

        if (existingIndex >= 0) {
            config.platforms[existingIndex] = platformConfig;
        } else {
            config.platforms.push(platformConfig);
        }

        this.writeConfig(config, profileName);
    }

    /**
     * 删除平台配置
     */
    public removePlatformConfig(
        type: 'github' | 'gitlab',
        url?: string,
        profileName: string = CONFIG_FILE.DEFAULT_PROFILE
    ): void {
        const config = this.readConfig(profileName);
        config.platforms = config.platforms.filter(p => {
            if (p.type !== type) return true;
            return !!(url && p.url !== url);
        });
        this.writeConfig(config, profileName);
    }

    // ==================== Profile管理相关方法 ====================

    /**
     * 获取所有profile名称
     */
    public listProfiles(): string[] {
        const configFile = this.readConfigFile();
        return Object.keys(configFile).filter(key => key !== '_metadata');
    }

    /**
     * 检查profile是否存在
     */
    public profileExists(profileName: string): boolean {
        const configFile = this.readConfigFile();
        return profileName in configFile && profileName !== '_metadata';
    }

    /**
     * 删除profile
     */
    public deleteProfile(profileName: string): void {
        if (profileName === CONFIG_FILE.DEFAULT_PROFILE) {
            throw new Error('Cannot delete default profile');
        }

        const configFile = this.readConfigFile();
        
        if (!this.profileExists(profileName)) {
            throw new Error(`Profile '${profileName}' does not exist`);
        }

        delete configFile[profileName];
        this.writeConfigFile(configFile);
    }

    /**
     * 复制profile
     */
    public copyProfile(sourceProfile: string, targetProfile: string): void {
        const configFile = this.readConfigFile();
        
        if (!this.profileExists(sourceProfile)) {
            throw new Error(`Source profile '${sourceProfile}' does not exist`);
        }

        if (this.profileExists(targetProfile)) {
            throw new Error(`Target profile '${targetProfile}' already exists`);
        }

        const source = configFile[sourceProfile] as QuartzProfile;
        configFile[targetProfile] = {
            name: targetProfile,
            config: structuredClone(source.config)
        };

        this.writeConfigFile(configFile);
    }

    /**
     * 重命名profile
     */
    public renameProfile(oldName: string, newName: string): void {
        if (oldName === CONFIG_FILE.DEFAULT_PROFILE) {
            throw new Error('Cannot rename default profile');
        }

        const configFile = this.readConfigFile();
        
        if (!this.profileExists(oldName)) {
            throw new Error(`Profile '${oldName}' does not exist`);
        }

        if (this.profileExists(newName)) {
            throw new Error(`Profile '${newName}' already exists`);
        }

        const profile = configFile[oldName] as QuartzProfile;
        profile.name = newName;
        configFile[newName] = profile;
        delete configFile[oldName];

        this.writeConfigFile(configFile);
    }

    // ==================== 配置值读写相关方法 ====================

    /**
     * 设置OpenAI API Key
     */
    public setOpenAIApiKey(apiKey: string, profileName: string = CONFIG_FILE.DEFAULT_PROFILE): void {
        const config = this.readConfig(profileName);
        config.openai.apiKey = apiKey;
        this.writeConfig(config, profileName);
    }

    /**
     * 设置OpenAI Base URL
     */
    public setOpenAIBaseUrl(baseUrl: string, profileName: string = CONFIG_FILE.DEFAULT_PROFILE): void {
        const config = this.readConfig(profileName);
        config.openai.baseUrl = baseUrl;
        this.writeConfig(config, profileName);
    }

    /**
     * 设置OpenAI Model
     */
    public setOpenAIModel(model: string, profileName: string = CONFIG_FILE.DEFAULT_PROFILE): void {
        const config = this.readConfig(profileName);
        config.openai.model = model;
        this.writeConfig(config, profileName);
    }

    /**
     * 设置UI语言
     */
    public setUILanguage(language: string, profileName: string = CONFIG_FILE.DEFAULT_PROFILE): void {
        const config = this.readConfig(profileName);
        config.language.ui = language;
        this.writeConfig(config, profileName);
    }

    /**
     * 设置Prompt语言
     */
    public setPromptLanguage(language: string, profileName: string = CONFIG_FILE.DEFAULT_PROFILE): void {
        const config = this.readConfig(profileName);
        config.language.prompt = language;
        this.writeConfig(config, profileName);
    }

    // ==================== 导出和导入 ====================

    /**
     * 导出配置到JSON字符串
     */
    public exportConfig(profileName: string = CONFIG_FILE.DEFAULT_PROFILE): string {
        const config = this.readConfig(profileName);
        return JSON.stringify(config, null, JSON_FORMAT.INDENT);
    }

    /**
     * 从JSON字符串导入配置
     */
    public importConfig(jsonString: string, profileName: string = CONFIG_FILE.DEFAULT_PROFILE): void {
        try {
            const config = JSON.parse(jsonString) as QuartzConfig;
            this.writeConfig(config, profileName);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to import config: ${errorMessage}`);
        }
    }
}

/**
 * 获取全局配置管理器实例
 */
export function getConfigManager(): ConfigManager {
    return ConfigManager.getInstance();
}

// 导出常用方法
export const configManager = getConfigManager();