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
 * Unified configuration manager
 * Responsible for configuration file reading/writing, version management, migration and all operations
 * Uses singleton pattern to ensure only one configuration manager instance globally
 */
export class ConfigManager {
    private static instance: ConfigManager;
    private configCache: QuartzConfigFile | null = null;
    private cacheTimestamp: number = 0;
    private readonly CACHE_TTL = 5000; // Cache for 5 seconds

    private constructor() {}

    /**
     * Get configuration manager singleton instance
     * @returns ConfigManager singleton instance
     */
    public static getInstance(): ConfigManager {
        if (!ConfigManager.instance) {
            ConfigManager.instance = new ConfigManager();
        }
        return ConfigManager.instance;
    }

    /**
     * Get configuration file path
     * @returns Path to configuration file
     */
    public getConfigPath(): string {
        return getQuartzPath();
    }

    /**
     * Get configuration directory path
     * @returns Path to configuration directory
     */
    public getConfigDir(): string {
        return getQuartzDir();
    }

    /**
     * Ensure configuration directory exists
     */
    public ensureConfigDir(): void {
        ensureQuartzDir();
    }

    /**
     * Check if configuration file exists
     * @returns True if configuration file exists
     */
    public configExists(): boolean {
        return fs.existsSync(this.getConfigPath());
    }

    /**
     * Clear cache
     */
    public clearCache(): void {
        this.configCache = null;
        this.cacheTimestamp = 0;
    }

    /**
     * Read complete configuration file (including all profiles and metadata)
     * @returns Complete configuration file object
     */
    public readConfigFile(): QuartzConfigFile {
        const now = Date.now();
        
        // Use cache
        if (this.configCache && (now - this.cacheTimestamp) < this.CACHE_TTL) {
            return this.configCache;
        }

        const quartzPath = this.getConfigPath();

        // If file doesn't exist, return default configuration file structure
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

            // If no metadata, add default metadata
            data._metadata ??= {
                configVersion: VERSION.LEGACY_CONFIG,
                cliVersion: VERSION.LEGACY_CONFIG,
                updatedAt: formatDate(DEFAULT_VALUES.LANGUAGE_UI),
            };

            // If no default profile, add default profile
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
     * Write complete configuration file
     * @param configFile - Complete configuration file object to write
     */
    public writeConfigFile(configFile: QuartzConfigFile): void {
        this.ensureConfigDir();
        const quartzPath = this.getConfigPath();

        try {
            // Update metadata timestamp
            if (configFile._metadata) {
                const currentConfig = configFile[CONFIG_FILE.DEFAULT_PROFILE] as QuartzProfile | undefined;
                const language = currentConfig?.config?.language?.ui || DEFAULT_VALUES.LANGUAGE_UI;
                configFile._metadata.updatedAt = formatDate(language);
            }

            fs.writeFileSync(
                quartzPath,
                JSON.stringify(configFile, null, JSON_FORMAT.INDENT),
                ENCODING.UTF8
            );

            // Clear cache to ensure next read gets latest data
            this.clearCache();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.error(`Failed to write config file: ${errorMessage}`);
            throw error;
        }
    }

    /**
     * Read configuration for specified profile
     * @param profileName - Profile name to read. If not specified, uses currently active profile
     * @returns Configuration object for the profile
     */
    public readConfig(profileName?: string): QuartzConfig {
        const configFile = this.readConfigFile();
        
        // If profileName not specified, use active profile
        const targetProfile = profileName || configFile._metadata?.activeProfile || CONFIG_FILE.DEFAULT_PROFILE;
        
        const profile = configFile[targetProfile] as QuartzProfile | undefined;

        if (profile?.config) {
            // Validate and supplement missing required fields
            return this.validateAndFixConfig(profile.config);
        }

        // If specified profile doesn't exist, return default configuration
        return this.createDefaultConfig();
    }

    /**
     * Validate and fix configuration object, ensuring all required fields exist and have correct types
     * @param config - Configuration object to validate
     * @returns Fixed configuration object
     */
    private validateAndFixConfig(config: any): QuartzConfig {
        const defaultConfig = this.createDefaultConfig();
        
        // Ensure config is an object
        if (!config || typeof config !== 'object') {
            logger.warn('Invalid config structure, using default config');
            return defaultConfig;
        }

        // Fix openai configuration
        if (!config.openai || typeof config.openai !== 'object') {
            config.openai = defaultConfig.openai;
        } else {
            config.openai.apiKey = config.openai.apiKey ?? defaultConfig.openai.apiKey;
            config.openai.baseUrl = config.openai.baseUrl ?? defaultConfig.openai.baseUrl;
            config.openai.model = config.openai.model ?? defaultConfig.openai.model;
        }
        const isNotArray = !Array.isArray(config.platforms);
        // Fix platforms configuration
        if (isNotArray) {
            logger.warn('Invalid platforms configuration, using empty array');
            config.platforms = [];
        } else {
            // Validate each platform configuration
            config.platforms = config.platforms.filter((p: any) => {
                if (!p || typeof p !== 'object') return false;
                if (!p.type || typeof p.type !== 'string') return false;
                if (!p.token || typeof p.token !== 'string') return false;
                return true;
            });
        }

        // Fix language configuration
        if (!config.language || typeof config.language !== 'object') {
            config.language = defaultConfig.language;
        } else {
            config.language.ui = config.language.ui ?? defaultConfig.language.ui;
            config.language.prompt = config.language.prompt ?? defaultConfig.language.prompt;
        }

        return config as QuartzConfig;
    }

    /**
     * Write configuration for specified profile
     * @param config - Configuration object to write
     * @param profileName - Profile name to write to. If not specified, uses currently active profile
     */
    public writeConfig(config: QuartzConfig, profileName?: string): void {
        const configFile = this.readConfigFile();
        
        // If profileName not specified, use active profile
        const targetProfile = profileName || configFile._metadata?.activeProfile || CONFIG_FILE.DEFAULT_PROFILE;

        // Update or create profile
        configFile[targetProfile] = {
            name: targetProfile,
            config,
        };

        this.writeConfigFile(configFile);
    }

    /**
     * Create default configuration
     * @returns Default configuration object
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
     * Create default version metadata
     * @returns Default version metadata object
     */
    private createDefaultMetadata(): VersionMetadata {
        return {
            configVersion: CURRENT_CONFIG_VERSION,
            cliVersion: this.getCliVersion(),
            updatedAt: formatDate(DEFAULT_VALUES.LANGUAGE_UI),
            activeProfile: CONFIG_FILE.DEFAULT_PROFILE,
        };
    }

    /**
     * Get CLI version from package.json
     * @returns CLI version string
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

    // ==================== Version Management Methods ====================

    /**
     * Read version metadata
     * @returns Version metadata object or null if not found
     */
    public readVersionMetadata(): VersionMetadata | null {
        if (!this.configExists()) {
            return null;
        }

        const configFile = this.readConfigFile();
        return configFile._metadata || null;
    }

    /**
     * Write version metadata
     * @param metadata - Version metadata to write
     */
    public writeVersionMetadata(metadata: VersionMetadata): void {
        const configFile = this.readConfigFile();
        configFile._metadata = metadata;
        this.writeConfigFile(configFile);
    }

    /**
     * Initialize version metadata
     * @returns Initialized version metadata object
     */
    public initializeVersionMetadata(): VersionMetadata {
        const metadata = this.createDefaultMetadata();
        this.writeVersionMetadata(metadata);
        return metadata;
    }

    // ==================== Active Profile Management ====================

    /**
     * Get currently active profile name
     * @returns Active profile name
     */
    public getActiveProfile(): string {
        const metadata = this.readVersionMetadata();
        return metadata?.activeProfile || CONFIG_FILE.DEFAULT_PROFILE;
    }

    /**
     * Set currently active profile
     * @param profileName - Profile name to activate
     * @throws Error if profile doesn't exist
     */
    public setActiveProfile(profileName: string): void {
        if (!this.profileExists(profileName)) {
            throw new Error(`Profile '${profileName}' does not exist`);
        }

        const configFile = this.readConfigFile();
        configFile._metadata ??= this.createDefaultMetadata();
        configFile._metadata.activeProfile = profileName;
        this.writeConfigFile(configFile);
    }

    // ==================== Platform Configuration Methods ====================

    /**
     * Get all platform configurations
     * @param profileName - Profile name to read from. If not specified, uses currently active profile
     * @returns Array of platform configurations
     */
    public getPlatformConfigs(profileName?: string): PlatformConfig[] {
        const config = this.readConfig(profileName);
        return config.platforms;
    }

    /**
     * Get platform configuration by type
     * @param type - Platform type (github or gitlab)
     * @param profileName - Profile name to read from. If not specified, uses currently active profile
     * @returns Platform configuration or undefined if not found
     */
    public getPlatformConfig(
        type: 'github' | 'gitlab',
        profileName?: string
    ): PlatformConfig | undefined {
        const config = this.readConfig(profileName);
        return config.platforms.find(p => p.type === type);
    }

    /**
     * Add or update platform configuration
     * @param platformConfig - Platform configuration to upsert
     * @param profileName - Profile name to write to. If not specified, uses currently active profile
     */
    public upsertPlatformConfig(
        platformConfig: PlatformConfig,
        profileName?: string
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
     * Remove platform configuration
     * @param type - Platform type to remove
     * @param url - Platform URL (optional, for specific instance)
     * @param profileName - Profile name to modify. If not specified, uses currently active profile
     */
    public removePlatformConfig(
        type: 'github' | 'gitlab',
        url?: string,
        profileName?: string
    ): void {
        const config = this.readConfig(profileName);
        config.platforms = config.platforms.filter(p => {
            if (p.type !== type) return true;
            return !!(url && p.url !== url);
        });
        this.writeConfig(config, profileName);
    }

    // ==================== Profile Management Methods ====================

    /**
     * Get all profile names
     * @returns Array of profile names
     */
    public listProfiles(): string[] {
        const configFile = this.readConfigFile();
        return Object.keys(configFile).filter(key => key !== '_metadata');
    }

    /**
     * Check if profile exists
     * @param profileName - Profile name to check
     * @returns True if profile exists
     */
    public profileExists(profileName: string): boolean {
        const configFile = this.readConfigFile();
        return profileName in configFile && profileName !== '_metadata';
    }

    /**
     * Delete profile
     * @param profileName - Profile name to delete
     * @throws Error if trying to delete default profile or profile doesn't exist
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
     * Copy profile
     * @param sourceProfile - Source profile name to copy from
     * @param targetProfile - Target profile name to copy to
     * @throws Error if source doesn't exist or target already exists
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
     * Rename profile
     * @param oldName - Current profile name
     * @param newName - New profile name
     * @throws Error if trying to rename default profile, old profile doesn't exist, or new name already exists
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

    // ==================== Configuration Value Read/Write Methods ====================

    /**
     * Set OpenAI API Key
     * @param apiKey - API key to set
     * @param profileName - Profile name to modify. If not specified, uses currently active profile
     */
    public setOpenAIApiKey(apiKey: string, profileName?: string): void {
        const config = this.readConfig(profileName);
        config.openai.apiKey = apiKey;
        this.writeConfig(config, profileName);
    }

    /**
     * Set OpenAI Base URL
     * @param baseUrl - Base URL to set
     * @param profileName - Profile name to modify. If not specified, uses currently active profile
     */
    public setOpenAIBaseUrl(baseUrl: string, profileName?: string): void {
        const config = this.readConfig(profileName);
        config.openai.baseUrl = baseUrl;
        this.writeConfig(config, profileName);
    }

    /**
     * Set OpenAI Model
     * @param model - Model name to set
     * @param profileName - Profile name to modify. If not specified, uses currently active profile
     */
    public setOpenAIModel(model: string, profileName?: string): void {
        const config = this.readConfig(profileName);
        config.openai.model = model;
        this.writeConfig(config, profileName);
    }

    /**
     * Set UI language
     * @param language - Language code to set
     * @param profileName - Profile name to modify. If not specified, uses currently active profile
     */
    public setUILanguage(language: string, profileName?: string): void {
        const config = this.readConfig(profileName);
        config.language.ui = language;
        this.writeConfig(config, profileName);
    }

    /**
     * Set Prompt language
     * @param language - Language code to set
     * @param profileName - Profile name to modify. If not specified, uses currently active profile
     */
    public setPromptLanguage(language: string, profileName?: string): void {
        const config = this.readConfig(profileName);
        config.language.prompt = language;
        this.writeConfig(config, profileName);
    }

    // ==================== Export and Import ====================

    /**
     * Export configuration to JSON string
     * @param profileName - Profile name to export. If not specified, uses currently active profile
     * @returns JSON string representation of configuration
     */
    public exportConfig(profileName?: string): string {
        const config = this.readConfig(profileName);
        return JSON.stringify(config, null, JSON_FORMAT.INDENT);
    }

    /**
     * Import configuration from JSON string
     * @param jsonString - JSON string to import
     * @param profileName - Profile name to import to. If not specified, uses currently active profile
     * @throws Error if JSON parsing fails
     */
    public importConfig(jsonString: string, profileName?: string): void {
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
 * Get global configuration manager instance
 * @returns ConfigManager singleton instance
 */
export function getConfigManager(): ConfigManager {
    return ConfigManager.getInstance();
}

// Export commonly used methods
export const configManager = getConfigManager();