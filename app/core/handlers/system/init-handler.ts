//app/core/handlers/system/init-handler.ts

import fs from 'node:fs';
import path from 'node:path';
import {BaseHandler} from '../base/base-handler';
import {
    CONFIG_FILE,
    DEFAULT_CONFIG_CONTENT,
    DEFAULT_VALUES,
    ENCODING,
    PLATFORM_TYPES,
    SEPARATOR_LENGTH,
    SUPPORTED_LANGUAGES,
    SUPPORTED_PLATFORMS,
    TOKEN_DISPLAY_LENGTH,
    VERSION
} from '@/constants';
import {getConfigManager} from '@/manager/config';
import {setLanguage} from '@/i18n';
import {input, message, select} from '@/utils/enquirer';

/**
 * Init command handler
 * Handles project and global initialization
 */
export class InitHandler extends BaseHandler {
    /**
     * Execute init command
     */
    async execute(): Promise<void> {
        const isGlobal = this.getParameter('global', false);
        const skipInteractive = this.getParameter('skip', false);
        
        if (isGlobal && skipInteractive) {
            await this.handleGlobalNonInteractive();
        } else if (isGlobal) {
            await this.handleGlobalInteractive();
        } else if (skipInteractive) {
            await this.handleLocalNonInteractive();
        } else {
            await this.handleLocalInteractive();
        }
    }

    /**
     * Check if already initialized
     */
    private isInitialized(global = false): boolean {
        const configManager = getConfigManager();
        const quartzDir = configManager.getConfigDir(global);
        const configPath = configManager.getConfigPath(global);
        return fs.existsSync(quartzDir) && fs.existsSync(configPath);
    }

    /**
     * Display information when global configuration is detected
     */
    private displayGlobalConfigDetected(globalConfigPath: string): void {
        this.logger.info(this.t('init.globalConfigDetected'));
        this.logger.log(this.t('init.globalConfigPath', {path: globalConfigPath}));
        this.logger.line();
        this.logger.info(this.t('init.canUseDirectly'));
        this.logger.log(this.t('init.projectConfigOptional'));
        this.logger.line();
    }

    /**
     * Display information when no global configuration is found
     */
    private displayNoGlobalConfig(): void {
        this.logger.info(this.t('init.noGlobalConfig'));
        this.logger.log(this.t('init.suggestGlobal'));
        this.logger.line();
    }

    /**
     * Display project config warning if global config exists
     */
    private displayProjectConfigWarning(hasGlobalConfig: boolean): void {
        if (hasGlobalConfig) {
            this.logger.warn(this.t('init.confirmProjectConfig'));
            this.logger.log(this.t('init.onlyNeededIf'));
            this.logger.line();
        }
    }

    /**
     * Ensure configuration directory exists
     */
    private ensureConfigDirectory(quartzDir: string, global = false): void {
        const configManager = getConfigManager();
        if (fs.existsSync(quartzDir)) {
            this.logger.info(this.t('init.dirExists', {dir: quartzDir}));
        } else {
            configManager.ensureConfigDir(global);
            this.logger.success(this.t('init.dirCreated', {dir: quartzDir}));
        }
    }

    /**
     * Create configuration file if not exists
     */
    private createConfigFile(configPath: string, global = false): void {
        const configManager = getConfigManager();
        const configFileNotExists = !configManager.configExists(global);

        if (configFileNotExists) {
            fs.writeFileSync(configPath, DEFAULT_CONFIG_CONTENT, ENCODING.UTF8);
            this.logger.success(this.t('init.configCreated', {path: configPath}));

            // Only initialize version metadata for project config
            if (!global) {
                configManager.initializeVersionMetadata();
                this.logger.info(this.t('init.versionInitialized'));
            }
        } else {
            this.logger.info(this.t('init.configExists', {path: configPath}));
        }
    }

    /**
     * Display success message with next steps
     */
    private displaySuccessMessage(): void {
        this.logger.line();

        const nextSteps = `${this.logger.text.success('✓')} ${this.t('init.success')}

${this.logger.text.dim(this.t('init.nextSteps'))}

  1. ${this.logger.text.primary('quartz config init')} - ${this.t('init.setupConfig')}
  2. ${this.logger.text.primary('quartz --help')} - ${this.t('init.viewCommands')}`;

        this.logger.box(nextSteps, {title: '🎉 ' + this.t('init.complete'), padding: 1});
        this.logger.line();
    }

    /**
     * Suggest adding .quartz to .gitignore
     */
    private suggestGitignore(): void {
        const gitignorePath = path.join(process.cwd(), '.gitignore');

        if (fs.existsSync(gitignorePath)) {
            const gitignoreContent = fs.readFileSync(gitignorePath, ENCODING.UTF8);
            if (!gitignoreContent.includes('.quartz')) {
                this.logger.info(this.t('init.gitignoreReminder'));
                console.log(this.logger.text.dim(`  echo ".quartz/quartz.jsonc" >> .gitignore`));
                this.logger.line();
            }
        }
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
     * Format sensitive value display
     */
    private formatSensitiveValue(value: string): string {
        return value.substring(0, TOKEN_DISPLAY_LENGTH) + '***';
    }

    /**
     * Ask question using enquirer
     */
    private async askQuestion(
        label: string,
        description?: string,
        initialValue?: string
    ): Promise<string> {
        const message = description ? `${label}\n\x1b[2m${description}\x1b[0m` : label;

        try {
            return await input(message, initialValue);
        } catch (error) {
            this.logger.warn('Input cancelled by user');
            return initialValue || '';
        }
    }

    /**
     * Interactive platform selector using enquirer
     */
    private async selectPlatform(currentPlatform?: string): Promise<string> {
        const selectedIndex = SUPPORTED_PLATFORMS.findIndex(p => p.value === currentPlatform);
        const initial = selectedIndex === -1 ? 0 : selectedIndex;

        const choices = SUPPORTED_PLATFORMS.map(p => ({
            name: p.value,
            value: p.value,
            message: p.label,
        }));

        try {
            return await select(
                this.t('config.keys.gitPlatform'),
                choices,
                initial
            );
        } catch (error) {
            this.logger.warn('Platform selection cancelled by user');
            return currentPlatform || PLATFORM_TYPES.GITHUB;
        }
    }

    /**
     * Interactive language selector using enquirer
     */
    private async selectLanguage(currentLang?: string, title?: string): Promise<string> {
        let selectedIndex = SUPPORTED_LANGUAGES.findIndex(l => l.value === currentLang);
        if (selectedIndex === -1) {
            selectedIndex = SUPPORTED_LANGUAGES.findIndex(l => l.value === DEFAULT_VALUES.LANGUAGE_UI);
        }

        const choices = SUPPORTED_LANGUAGES.map(l => ({
            name: l.value,
            value: l.value,
            message: l.label,
        }));

        try {
            return await select(
                title || this.t('config.keys.language'),
                choices,
                selectedIndex
            );
        } catch (error) {
            this.logger.warn('Language selection cancelled by user');
            return currentLang || DEFAULT_VALUES.LANGUAGE_UI;
        }
    }

    /**
     * Interactive setup wizard
     */
    private async setupWizard(): Promise<void> {
        console.clear();
        this.printLogo();
        this.logger.line();
        this.logger.log(this.t('config.wizard.welcome'));
        this.logger.line();
        this.logger.separator(SEPARATOR_LENGTH);

        const configManager = getConfigManager();
        const config = configManager.readConfig();

        try {
            await this.configureLanguages(config);
            const platform = await this.configurePlatform(config);
            await this.configureOpenAI(config);
            await this.configurePlatformTokens(config, platform);
            await this.saveWizardConfig(config);
        } catch (error) {
            this.logger.error('Setup wizard error:', error);
            throw error;
        }
    }

    /**
     * Configure UI and prompt languages
     */
    private async configureLanguages(config: any): Promise<void> {
        const currentLang = config.language.ui;
        const lang = await this.selectLanguage(currentLang, this.t('config.keys.language'));
        config.language.ui = lang;

        setLanguage(lang as any);

        const currentPromptLang = config.language.prompt || lang;
        config.language.prompt = await this.selectLanguage(currentPromptLang, this.t('config.keys.promptLanguage'));
    }

    /**
     * Configure git platform
     */
    private async configurePlatform(config: any): Promise<string> {
        const currentPlatform = config.platforms.length > 0 ? config.platforms[0].type : PLATFORM_TYPES.GITHUB;
        return await this.selectPlatform(currentPlatform);
    }

    /**
     * Configure OpenAI settings (API key, base URL, model)
     */
    private async configureOpenAI(config: any): Promise<void> {
        // API Key
        const currentApiKey = config.openai.apiKey;
        const apiKeyLabel = '🔑 ' + this.t('config.keys.apiKey');
        const apiKeyDesc = currentApiKey
            ? this.t('config.wizard.apiKeyWithCurrent', {current: this.formatSensitiveValue(currentApiKey)})
            : this.t('config.wizard.apiKey');

        const apiKey = await this.askQuestion(apiKeyLabel, apiKeyDesc, currentApiKey);
        if (apiKey.trim()) {
            config.openai.apiKey = apiKey.trim();
        }

        // Base URL
        const currentBaseUrl = config.openai.baseUrl;
        const defaultBaseUrl = currentBaseUrl || DEFAULT_VALUES.OPENAI_BASE_URL;
        const baseUrlLabel = '🌐 ' + this.t('config.keys.baseUrl');
        const baseUrlDesc = this.t('config.wizard.baseUrl', {default: defaultBaseUrl});

        const baseUrl = await this.askQuestion(baseUrlLabel, baseUrlDesc, defaultBaseUrl);
        if (baseUrl.trim()) {
            config.openai.baseUrl = baseUrl.trim();
        } else if (!currentBaseUrl) {
            config.openai.baseUrl = defaultBaseUrl;
        }

        // Model
        const currentModel = config.openai.model;
        const defaultModel = currentModel || DEFAULT_VALUES.OPENAI_MODEL;
        const modelLabel = '🤖 ' + this.t('config.keys.model');
        const modelDesc = this.t('config.wizard.model', {default: defaultModel});

        const model = await this.askQuestion(modelLabel, modelDesc, defaultModel);
        if (model.trim()) {
            config.openai.model = model.trim();
        } else if (!currentModel) {
            config.openai.model = defaultModel;
        }
    }

    /**
     * Configure platform-specific tokens
     */
    private async configurePlatformTokens(config: any, platform: string): Promise<void> {
        const configManager = getConfigManager();
        // Save current config before updating platform tokens
        configManager.writeConfig(config);

        if (platform === PLATFORM_TYPES.GITHUB) {
            await this.configureGitHubToken(config);
        } else if (platform === PLATFORM_TYPES.GITLAB) {
            await this.configureGitLabToken(config);
        }
    }

    /**
     * Configure GitHub token
     */
    private async configureGitHubToken(config: any): Promise<void> {
        const configManager = getConfigManager();
        const existingGithub = config.platforms.find((p: any) => p.type === PLATFORM_TYPES.GITHUB);
        const currentGithubToken = existingGithub?.token;
        const githubTokenLabel = '🔐 ' + this.t('config.keys.githubToken');
        const githubTokenDesc = currentGithubToken
            ? this.t('config.wizard.githubTokenWithCurrent', {current: this.formatSensitiveValue(currentGithubToken)})
            : this.t('config.wizard.githubToken');

        const githubToken = await this.askQuestion(githubTokenLabel, githubTokenDesc, currentGithubToken);
        if (githubToken.trim()) {
            configManager.upsertPlatformConfig({type: PLATFORM_TYPES.GITHUB, token: githubToken.trim()});
        }
    }

    /**
     * Configure GitLab token and URL
     */
    private async configureGitLabToken(config: any): Promise<void> {
        const configManager = getConfigManager();
        const existingGitlab = config.platforms.find((p: any) => p.type === PLATFORM_TYPES.GITLAB);
        const currentGitlabToken = existingGitlab?.token;
        const gitlabTokenLabel = '🔐 ' + this.t('config.keys.gitlabToken');
        const gitlabTokenDesc = currentGitlabToken
            ? this.t('config.wizard.gitlabTokenWithCurrent', {current: this.formatSensitiveValue(currentGitlabToken)})
            : this.t('config.wizard.gitlabToken');

        const gitlabToken = await this.askQuestion(gitlabTokenLabel, gitlabTokenDesc, currentGitlabToken);
        if (gitlabToken.trim()) {
            const currentGitlabUrl = existingGitlab?.url;
            const defaultGitlabUrl = currentGitlabUrl || DEFAULT_VALUES.GITLAB_URL;
            const gitlabUrlLabel = '🌐 ' + this.t('config.keys.gitlabUrl');
            const gitlabUrlDesc = this.t('config.wizard.gitlabUrl', {default: defaultGitlabUrl});

            const gitlabUrl = await this.askQuestion(gitlabUrlLabel, gitlabUrlDesc, defaultGitlabUrl);
            configManager.upsertPlatformConfig({
                type: PLATFORM_TYPES.GITLAB,
                token: gitlabToken.trim(),
                url: gitlabUrl.trim() || defaultGitlabUrl
            });
        }
    }

    /**
     * Save wizard configuration and show success message
     */
    private async saveWizardConfig(config: any): Promise<void> {
        const configManager = getConfigManager();
        // Read the latest config to ensure we have all updates including platform tokens
        const latestConfig = configManager.readConfig();

        // Merge the wizard config with latest config to preserve platform tokens
        const finalConfig = {
            openai: config.openai,
            language: config.language,
            platforms: latestConfig.platforms
        };

        configManager.writeConfig(finalConfig);
        this.logger.line();
        this.logger.separator(SEPARATOR_LENGTH);
        await message(
            this.t('config.wizard.success'),
            this.t('config.wizard.saved', {path: configManager.getConfigPath()}),
            'success'
        );
    }

    /**
     * Handle local interactive initialization
     */
    private async handleLocalInteractive(): Promise<void> {
        const configManager = getConfigManager();

        this.logger.line();
        this.logger.log(this.t('init.starting'));
        this.logger.line();

        const hasGlobalConfig = configManager.globalConfigExists();
        const globalConfigPath = configManager.getConfigPath(true);

        // Show global config status
        if (hasGlobalConfig) {
            this.displayGlobalConfigDetected(globalConfigPath);
        } else {
            this.displayNoGlobalConfig();
        }

        if (this.isInitialized()) {
            this.logger.warn(this.t('init.alreadyInitialized'));
            this.logger.info(this.t('init.reinitializeHint'));
            this.logger.line();
            return;
        }

        this.displayProjectConfigWarning(hasGlobalConfig);

        // Start interactive setup wizard
        await this.setupWizard();

        this.displaySuccessMessage();
        this.suggestGitignore();
    }

    /**
     * Handle local non-interactive initialization
     */
    private async handleLocalNonInteractive(): Promise<void> {
        const configManager = getConfigManager();

        const quartzDir = configManager.getConfigDir(false);
        const configPath = configManager.getConfigPath(false);
        const hasGlobalConfig = configManager.globalConfigExists();
        const globalConfigPath = configManager.getConfigPath(true);

        this.logger.line();
        this.logger.log(this.t('init.starting'));
        this.logger.line();

        // Show global config status
        if (hasGlobalConfig) {
            this.displayGlobalConfigDetected(globalConfigPath);
        } else {
            this.displayNoGlobalConfig();
        }

        if (this.isInitialized()) {
            this.logger.warn(this.t('init.alreadyInitialized'));
            this.logger.info(this.t('init.reinitializeHint'));
            this.logger.line();
            return;
        }

        this.displayProjectConfigWarning(hasGlobalConfig);
        this.ensureConfigDirectory(quartzDir, false);
        this.createConfigFile(configPath, false);
        this.displaySuccessMessage();
        this.suggestGitignore();
    }

    /**
     * Handle global interactive initialization
     */
    private async handleGlobalInteractive(): Promise<void> {
        const configManager = getConfigManager();
        const globalConfigPath = configManager.getConfigPath(true);

        this.logger.line();
        this.logger.log(this.t('config.initGlobal'));
        this.logger.line();

        if (this.isInitialized(true)) {
            this.logger.warn(this.t('config.globalConfigExists'));
            this.logger.log(this.t('config.globalConfigPath', {path: globalConfigPath}));
            this.logger.line();
            return;
        }

        // Start interactive setup wizard for global config
        await this.setupWizard();

        this.logger.line();
        this.logger.success(this.t('config.globalInitSuccess'));
        this.logger.info(this.t('config.globalConfigInfo'));
        this.logger.log(this.t('config.globalConfigPath', {path: globalConfigPath}));
        this.logger.line();
    }

    /**
     * Handle global non-interactive initialization
     */
    private async handleGlobalNonInteractive(): Promise<void> {
        const configManager = getConfigManager();
        const quartzDir = configManager.getConfigDir(true);
        const configPath = configManager.getConfigPath(true);

        this.logger.line();
        this.logger.log(this.t('config.initGlobal'));
        this.logger.line();

        if (this.isInitialized(true)) {
            this.logger.warn(this.t('config.globalConfigExists'));
            this.logger.log(this.t('config.globalConfigPath', {path: configPath}));
            this.logger.line();
            return;
        }

        this.ensureConfigDirectory(quartzDir, true);

        // Create config file first (without metadata)
        if (!configManager.configExists(true)) {
            fs.writeFileSync(configPath, DEFAULT_CONFIG_CONTENT, ENCODING.UTF8);
            this.logger.success(this.t('init.configCreated', {path: configPath}));
        }

        // Now read the file and add metadata
        const configFile = configManager.readConfigFile(true);
        configFile._metadata = {
            configVersion: VERSION.CURRENT_CONFIG,
            cliVersion: configManager.getCliVersion(),
            updatedAt: new Date().toISOString(),
            activeProfile: CONFIG_FILE.DEFAULT_PROFILE,
        };

        // Write back with metadata
        configManager.writeConfigFile(configFile, true);
        this.logger.info(this.t('init.versionInitialized'));

        this.logger.line();
        this.logger.success(this.t('config.globalInitSuccess'));
        this.logger.info(this.t('config.globalConfigInfo'));
        this.logger.log(this.t('config.globalConfigPath', {path: configPath}));
        this.logger.line();
    }
}