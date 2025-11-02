//app/core/handlers/config/show-config-handler.ts
import {BaseHandler, ConfigUtils} from '@/app/core/handlers';
import {getConfigManager} from "@/manager/config";
import {CONFIG_ICONS, INDENT, SEPARATOR_LENGTH} from "@/constants/ui";
import {getActiveRuntimeVars, logConfigurationSource} from "@/utils/runtime-config";

/**
 * Show configuration command handler
 * Handles displaying configuration values and profiles
 */
export class ShowConfigHandler extends BaseHandler {
    /**
     * Execute show config command
     */
    async execute(): Promise<void> {
        const isGlobal = this.getParameter('global', false);
        const object = this.command.object;

        if (object === 'profile') {
            this.showProfileConfig(isGlobal);
        } else {
            this.showAllConfig(isGlobal);
        }
    }

    /**
     * Show all configuration values
     */
    showAllConfig(isGlobal: boolean = false): void {
        const manager = getConfigManager();

        let config;
        let hasRuntimeOverrides;
        let hasGlobalConfig;
        let hasProjectConfig;

        if (isGlobal) {
            // 显示全局配置
            config = manager.readConfig(undefined, true); // 读取全局配置，不应用运行时覆盖
            hasRuntimeOverrides = false; // 全局配置不考虑运行时覆盖
            hasGlobalConfig = manager.globalConfigExists();
            hasProjectConfig = false; // 显示全局配置时不显示项目配置
        } else {
            config = manager.readRuntimeConfig();
            hasRuntimeOverrides = manager.hasRuntimeOverrides();
            hasGlobalConfig = manager.globalConfigExists();
            hasProjectConfig = manager.projectConfigExists();
        }

        this.logger.line();
        this.printLogo();
        this.logger.line();
        this.logger.log(this.t('config.current'));
        this.logger.separator(SEPARATOR_LENGTH);
        this.logger.line();

        this.displayConfigPriority();
        this.displayActiveSources(hasRuntimeOverrides, hasProjectConfig, hasGlobalConfig);
        this.displayConfigItems(config);
        this.displayPlatforms(config);
        this.displayConfigPaths(manager, hasProjectConfig, hasGlobalConfig);

        if (hasRuntimeOverrides && !isGlobal) {
            const baseConfig = manager.readBaseConfig();
            logConfigurationSource(baseConfig, config);
        }

        this.logger.line();
    }

    /**
     * Show current profile configuration
     */
    showProfileConfig(isGlobal: boolean = false): void {
        const manager = getConfigManager();

        let activeProfile;
        let config;

        if (isGlobal) {
            // 显示全局profile
            const globalConfigFile = manager.readConfigFile(true);
            activeProfile = globalConfigFile._metadata?.activeProfile || 'default';
            const globalProfile = globalConfigFile[activeProfile] as any;
            config = globalProfile?.config || manager.readConfig(activeProfile, false);
        } else {
            // 显示当前项目profile
            activeProfile = manager.getActiveProfile();
            config = manager.readConfig(activeProfile, false); // Don't apply runtime overrides for profile view
        }

        this.logger.line();
        this.printLogo();
        this.logger.line();
        this.logger.log(this.t('config.currentProfile'));
        this.logger.separator(SEPARATOR_LENGTH);
        this.logger.line();

        this.logger.log(`${' '.repeat(INDENT.LEVEL_1)}📦 ${this.logger.text.primary(activeProfile)}`);
        this.logger.line();

        this.logger.log(this.t('config.configItems'));
        this.logger.line();

        this.displayConfigItems(config);
        this.displayPlatforms(config);

        this.logger.line();
    }

    /**
     * Print ASCII art Logo
     */
    private printLogo(): void {
        const logo = `
   ██████╗ ██╗   ██╗ █████╗ ██████╗ ████████╗███████╗
  ██╔═══██╗██║   ██║██╔══██╗██╔══██╗╚══██╔══╝╚══███╔╝
  ██║   ██║██║   ██║███████║██████╔╝   ██║     ███╔╝
  ██║▄▄ ██║██║   ██║██╔══██║██╔══██╗   ██║    ███╔╝
  ╚██████╔╝╚██████╔╝██║  ██║██║  ██║   ██║   ███████╗
   ╚▀▀═╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   ╚══════╝
  `;
        this.logger.gradient(logo);
    }

    /**
     * Display configuration priority information
     */
    private displayConfigPriority(): void {
        console.log(this.logger.text.dim('📊 ' + this.t('config.priority')));
        this.logger.line();
    }

    /**
     * Display active configuration sources
     */
    private displayActiveSources(hasRuntimeOverrides: boolean, hasProjectConfig: boolean, hasGlobalConfig: boolean): void {
        const sources = [];
        if (hasRuntimeOverrides) {
            const activeVars = getActiveRuntimeVars();
            sources.push(this.logger.text.success(`✓ Environment (${Object.keys(activeVars).length} vars)`));
        }
        if (hasProjectConfig) {
            sources.push(this.logger.text.primary('✓ Project Config'));
        }
        if (hasGlobalConfig) {
            sources.push(this.logger.text.muted('✓ Global Config'));
        }
        sources.push(this.logger.text.dim('✓ Default Config'));

        console.log(this.logger.text.bold('📁 ' + this.t('config.activeSources')));
        for (const source of sources) {
            console.log(`  ${source}`);
        }
        this.logger.line();
    }

    /**
     * Display configuration items
     */
    private displayConfigItems(config: any): void {
        const configItems = ConfigUtils.getConfigItemsList(this.t);

        for (const item of configItems) {
            const value = ConfigUtils.getConfigDisplayValue(config, item.key);
            const icon = CONFIG_ICONS[item.key] || '⚙️';

            if (value) {
                const displayValue = ConfigUtils.isSensitiveKey(item.key)
                    ? ConfigUtils.formatSensitiveValue(value)
                    : value;
                console.log(`${' '.repeat(INDENT.LEVEL_1)}${icon}  ${this.logger.text.bold(item.label)}`);
                console.log(`${' '.repeat(INDENT.LEVEL_3)}${this.logger.text.primary(displayValue)}`);
            } else {
                console.log(`${' '.repeat(INDENT.LEVEL_1)}${icon}  ${this.logger.text.bold(item.label)}`);
                console.log(`${' '.repeat(INDENT.LEVEL_3)}${this.logger.text.dim(this.logger.text.error(this.t('config.notConfigured')))}`);
            }
            this.logger.line();
        }
    }

    /**
     * Display configured platforms
     */
    private displayPlatforms(config: any): void {
        if (config.platforms.length === 0) {
            return;
        }

        console.log(this.logger.text.bold('🔧 ' + this.t('config.configuredPlatforms')));
        this.logger.line();

        for (const platform of config.platforms) {
            console.log(`${' '.repeat(INDENT.LEVEL_1)}✓ ${this.logger.text.primary(platform.type.toUpperCase())}`);
            if (platform.url) {
                console.log(`${' '.repeat(INDENT.LEVEL_2)}URL: ${platform.url}`);
            }
            console.log(`${' '.repeat(INDENT.LEVEL_2)}Token: ${ConfigUtils.formatSensitiveValue(platform.token)}`);
            this.logger.line();
        }
    }

    /**
     * Display configuration file paths
     */
    private displayConfigPaths(manager: any, hasProjectConfig: boolean, hasGlobalConfig: boolean): void {
        this.logger.separator(SEPARATOR_LENGTH);

        if (hasProjectConfig) {
            console.log(this.logger.text.dim(`📄 Project: ${manager.getConfigPath()}`));
        }
        if (hasGlobalConfig) {
            console.log(this.logger.text.dim(`📄 Global:  ${manager.getConfigPath(true)}`));
        }
    }
}