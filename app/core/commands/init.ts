//app/core/commands/init.ts
import fs from 'node:fs';
import path from 'node:path';
import {CommandDefinition} from '../interfaces';
import {CommandObject, CommandVerb} from '../enums';
import {CommandHandler} from '../types';
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
import {logger} from '@/utils/logger';
import {setLanguage, t} from '@/i18n';
import {input, message, select} from '@/utils/enquirer';

/**
 * Check if already initialized
 */
function isInitialized(global = false): boolean {
    const configManager = getConfigManager();
    const quartzDir = configManager.getConfigDir(global);
    const configPath = configManager.getConfigPath(global);
    return fs.existsSync(quartzDir) && fs.existsSync(configPath);
}

/**
 * Display information when global configuration is detected
 */
function displayGlobalConfigDetected(globalConfigPath: string) {
    logger.info(t('init.globalConfigDetected'));
    logger.log(t('init.globalConfigPath', {path: globalConfigPath}));
    logger.line();
    logger.info(t('init.canUseDirectly'));
    logger.log(t('init.projectConfigOptional'));
    logger.line();
}

/**
 * Display information when no global configuration is found
 */
function displayNoGlobalConfig() {
    logger.info(t('init.noGlobalConfig'));
    logger.log(t('init.suggestGlobal'));
    logger.line();
}

/**
 * Display project config warning if global config exists
 */
function displayProjectConfigWarning(hasGlobalConfig: boolean) {
    if (hasGlobalConfig) {
        logger.warn(t('init.confirmProjectConfig'));
        logger.log(t('init.onlyNeededIf'));
        logger.line();
    }
}

/**
 * Ensure configuration directory exists
 */
function ensureConfigDirectory(quartzDir: string, global = false) {
    const configManager = getConfigManager();
    if (fs.existsSync(quartzDir)) {
        logger.info(t('init.dirExists', {dir: quartzDir}));
    } else {
        configManager.ensureConfigDir(global);
        logger.success(t('init.dirCreated', {dir: quartzDir}));
    }
}

/**
 * Create configuration file if not exists
 */
function createConfigFile(configPath: string, global = false) {
    const configManager = getConfigManager();
    const configFileNotExists = !configManager.configExists(global);

    if (configFileNotExists) {
        fs.writeFileSync(configPath, DEFAULT_CONFIG_CONTENT, ENCODING.UTF8);
        logger.success(t('init.configCreated', {path: configPath}));

        // Only initialize version metadata for project config
        if (!global) {
            configManager.initializeVersionMetadata();
            logger.info(t('init.versionInitialized'));
        }
    } else {
        logger.info(t('init.configExists', {path: configPath}));
    }
}

/**
 * Display success message with next steps
 */
function displaySuccessMessage() {
    logger.line();

    const nextSteps = `${logger.text.success('✓')} ${t('init.success')}

${logger.text.dim(t('init.nextSteps'))}

  1. ${logger.text.primary('quartz config init')} - ${t('init.setupConfig')}
  2. ${logger.text.primary('quartz --help')} - ${t('init.viewCommands')}`;

    logger.box(nextSteps, {title: '🎉 ' + t('init.complete'), padding: 1});
    logger.line();
}

/**
 * Suggest adding .quartz to .gitignore
 */
function suggestGitignore() {
    const gitignorePath = path.join(process.cwd(), '.gitignore');

    if (fs.existsSync(gitignorePath)) {
        const gitignoreContent = fs.readFileSync(gitignorePath, ENCODING.UTF8);
        if (!gitignoreContent.includes('.quartz')) {
            logger.info(t('init.gitignoreReminder'));
            console.log(logger.text.dim(`  echo ".quartz/quartz.jsonc" >> .gitignore`));
            logger.line();
        }
    }
}

/**
 * Print ASCII art Logo
 */
function printLogo() {
    const logo = `
   ██████╗ ██╗   ██╗ █████╗ ██████╗ ████████╗███████╗
  ██╔═══██╗██║   ██║██╔══██╗██╔══██╗╚══██╔══╝╚══███╔╝
  ██║   ██║██║   ██║███████║██████╔╝   ██║     ███╔╝
  ██║▄▄ ██║██║   ██║██╔══██║██╔══██╗   ██║    ███╔╝
  ╚██████╔╝╚██████╔╝██║  ██║██║  ██║   ██║   ███████╗
   ╚══▀▀═╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   ╚══════╝
  `;
    logger.gradient(logo);
}

/**
 * Format sensitive value display
 */
function formatSensitiveValue(value: string): string {
    return value.substring(0, TOKEN_DISPLAY_LENGTH) + '***';
}

/**
 * Ask question using enquirer
 */
async function askQuestion(
    label: string,
    description?: string,
    initialValue?: string
): Promise<string> {
    const message = description ? `${label}\n\x1b[2m${description}\x1b[0m` : label;

    try {
        return await input(message, initialValue);
    } catch (error) {
        logger.warn('Input cancelled by user');
        return initialValue || '';
    }
}

/**
 * Interactive platform selector using enquirer
 */
async function selectPlatform(currentPlatform?: string): Promise<string> {
    const selectedIndex = SUPPORTED_PLATFORMS.findIndex(p => p.value === currentPlatform);
    const initial = selectedIndex === -1 ? 0 : selectedIndex;

    const choices = SUPPORTED_PLATFORMS.map(p => ({
        name: p.value,
        value: p.value,
        message: p.label,
    }));

    try {
        return await select(
            t('config.keys.gitPlatform'),
            choices,
            initial
        );
    } catch (error) {
        logger.warn('Platform selection cancelled by user');
        return currentPlatform || PLATFORM_TYPES.GITHUB;
    }
}

/**
 * Interactive language selector using enquirer
 */
async function selectLanguage(currentLang?: string, title?: string): Promise<string> {
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
            title || t('config.keys.language'),
            choices,
            selectedIndex
        );
    } catch (error) {
        logger.warn('Language selection cancelled by user');
        return currentLang || DEFAULT_VALUES.LANGUAGE_UI;
    }
}

/**
 * Configure UI and prompt languages
 */
async function configureLanguages(config: any) {
    const currentLang = config.language.ui;
    const lang = await selectLanguage(currentLang, t('config.keys.language'));
    config.language.ui = lang;

    setLanguage(lang as any);

    const currentPromptLang = config.language.prompt || lang;
    config.language.prompt = await selectLanguage(currentPromptLang, t('config.keys.promptLanguage'));
}

/**
 * Configure git platform
 */
async function configurePlatform(config: any): Promise<string> {
    const currentPlatform = config.platforms.length > 0 ? config.platforms[0].type : PLATFORM_TYPES.GITHUB;
    return await selectPlatform(currentPlatform);
}

/**
 * Configure OpenAI settings (API key, base URL, model)
 */
async function configureOpenAI(config: any) {
    // API Key
    const currentApiKey = config.openai.apiKey;
    const apiKeyLabel = '🔑 ' + t('config.keys.apiKey');
    const apiKeyDesc = currentApiKey
        ? t('config.wizard.apiKeyWithCurrent', {current: formatSensitiveValue(currentApiKey)})
        : t('config.wizard.apiKey');

    const apiKey = await askQuestion(apiKeyLabel, apiKeyDesc, currentApiKey);
    if (apiKey.trim()) {
        config.openai.apiKey = apiKey.trim();
    }

    // Base URL
    const currentBaseUrl = config.openai.baseUrl;
    const defaultBaseUrl = currentBaseUrl || DEFAULT_VALUES.OPENAI_BASE_URL;
    const baseUrlLabel = '🌐 ' + t('config.keys.baseUrl');
    const baseUrlDesc = t('config.wizard.baseUrl', {default: defaultBaseUrl});

    const baseUrl = await askQuestion(baseUrlLabel, baseUrlDesc, defaultBaseUrl);
    if (baseUrl.trim()) {
        config.openai.baseUrl = baseUrl.trim();
    } else if (!currentBaseUrl) {
        config.openai.baseUrl = defaultBaseUrl;
    }

    // Model
    const currentModel = config.openai.model;
    const defaultModel = currentModel || DEFAULT_VALUES.OPENAI_MODEL;
    const modelLabel = '🤖 ' + t('config.keys.model');
    const modelDesc = t('config.wizard.model', {default: defaultModel});

    const model = await askQuestion(modelLabel, modelDesc, defaultModel);
    if (model.trim()) {
        config.openai.model = model.trim();
    } else if (!currentModel) {
        config.openai.model = defaultModel;
    }
}

/**
 * Configure platform-specific tokens
 */
async function configurePlatformTokens(config: any, platform: string) {
    const configManager = getConfigManager();
    // Save current config before updating platform tokens
    configManager.writeConfig(config);

    if (platform === PLATFORM_TYPES.GITHUB) {
        await configureGitHubToken(config);
    } else if (platform === PLATFORM_TYPES.GITLAB) {
        await configureGitLabToken(config);
    }
}

/**
 * Configure GitHub token
 */
async function configureGitHubToken(config: any) {
    const configManager = getConfigManager();
    const existingGithub = config.platforms.find((p: any) => p.type === PLATFORM_TYPES.GITHUB);
    const currentGithubToken = existingGithub?.token;
    const githubTokenLabel = '🔐 ' + t('config.keys.githubToken');
    const githubTokenDesc = currentGithubToken
        ? t('config.wizard.githubTokenWithCurrent', {current: formatSensitiveValue(currentGithubToken)})
        : t('config.wizard.githubToken');

    const githubToken = await askQuestion(githubTokenLabel, githubTokenDesc, currentGithubToken);
    if (githubToken.trim()) {
        configManager.upsertPlatformConfig({type: PLATFORM_TYPES.GITHUB, token: githubToken.trim()});
    }
}

/**
 * Configure GitLab token and URL
 */
async function configureGitLabToken(config: any) {
    const configManager = getConfigManager();
    const existingGitlab = config.platforms.find((p: any) => p.type === PLATFORM_TYPES.GITLAB);
    const currentGitlabToken = existingGitlab?.token;
    const gitlabTokenLabel = '🔐 ' + t('config.keys.gitlabToken');
    const gitlabTokenDesc = currentGitlabToken
        ? t('config.wizard.gitlabTokenWithCurrent', {current: formatSensitiveValue(currentGitlabToken)})
        : t('config.wizard.gitlabToken');

    const gitlabToken = await askQuestion(gitlabTokenLabel, gitlabTokenDesc, currentGitlabToken);
    if (gitlabToken.trim()) {
        const currentGitlabUrl = existingGitlab?.url;
        const defaultGitlabUrl = currentGitlabUrl || DEFAULT_VALUES.GITLAB_URL;
        const gitlabUrlLabel = '🌐 ' + t('config.keys.gitlabUrl');
        const gitlabUrlDesc = t('config.wizard.gitlabUrl', {default: defaultGitlabUrl});

        const gitlabUrl = await askQuestion(gitlabUrlLabel, gitlabUrlDesc, defaultGitlabUrl);
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
async function saveWizardConfig(config: any) {
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
    logger.line();
    logger.separator(SEPARATOR_LENGTH);
    await message(
        t('config.wizard.success'),
        t('config.wizard.saved', {path: configManager.getConfigPath()}),
        'success'
    );
}

/**
 * Interactive setup wizard
 */
async function setupWizard() {
    console.clear();
    printLogo();
    logger.line();
    logger.log(t('config.wizard.welcome'));
    logger.line();
    logger.separator(SEPARATOR_LENGTH);

    const configManager = getConfigManager();
    const config = configManager.readConfig();

    try {
        await configureLanguages(config);
        const platform = await configurePlatform(config);
        await configureOpenAI(config);
        await configurePlatformTokens(config, platform);
        await saveWizardConfig(config);
    } catch (error) {
        logger.error('Setup wizard error:', error);
        throw error;
    }
}

/**
 * Handle local interactive initialization
 */
const handleLocalInteractive: CommandHandler = async (context) => {
    const {logger, t} = context;
    const configManager = getConfigManager();

    logger.line();
    logger.log(t('init.starting'));
    logger.line();

    const hasGlobalConfig = configManager.globalConfigExists();
    const globalConfigPath = configManager.getConfigPath(true);

    // Show global config status
    if (hasGlobalConfig) {
        displayGlobalConfigDetected(globalConfigPath);
    } else {
        displayNoGlobalConfig();
    }

    if (isInitialized()) {
        logger.warn(t('init.alreadyInitialized'));
        logger.info(t('init.reinitializeHint'));
        logger.line();
        return;
    }

    displayProjectConfigWarning(hasGlobalConfig);

    // Start interactive setup wizard
    await setupWizard();

    displaySuccessMessage();
    suggestGitignore();
};

/**
 * Handle local non-interactive initialization
 */
const handleLocalNonInteractive: CommandHandler = async (context) => {
    const {logger, t} = context;
    const configManager = getConfigManager();

    const quartzDir = configManager.getConfigDir(false);
    const configPath = configManager.getConfigPath(false);
    const hasGlobalConfig = configManager.globalConfigExists();
    const globalConfigPath = configManager.getConfigPath(true);

    logger.line();
    logger.log(t('init.starting'));
    logger.line();

    // Show global config status
    if (hasGlobalConfig) {
        displayGlobalConfigDetected(globalConfigPath);
    } else {
        displayNoGlobalConfig();
    }

    if (isInitialized()) {
        logger.warn(t('init.alreadyInitialized'));
        logger.info(t('init.reinitializeHint'));
        logger.line();
        return;
    }

    displayProjectConfigWarning(hasGlobalConfig);
    ensureConfigDirectory(quartzDir, false);
    createConfigFile(configPath, false);
    displaySuccessMessage();
    suggestGitignore();
};

/**
 * Handle global interactive initialization
 */
const handleGlobalInteractive: CommandHandler = async (context) => {
    const {logger, t} = context;
    const configManager = getConfigManager();
    const globalConfigPath = configManager.getConfigPath(true);

    logger.line();
    logger.log(t('config.initGlobal'));
    logger.line();

    if (isInitialized(true)) {
        logger.warn(t('config.globalConfigExists'));
        logger.log(t('config.globalConfigPath', {path: globalConfigPath}));
        logger.line();
        return;
    }

    // Start interactive setup wizard for global config
    await setupWizard();

    logger.line();
    logger.success(t('config.globalInitSuccess'));
    logger.info(t('config.globalConfigInfo'));
    logger.log(t('config.globalConfigPath', {path: globalConfigPath}));
    logger.line();
};

/**
 * Handle global non-interactive initialization
 */
const handleGlobalNonInteractive: CommandHandler = async (context) => {
    const {logger, t} = context;
    const configManager = getConfigManager();
    const quartzDir = configManager.getConfigDir(true);
    const configPath = configManager.getConfigPath(true);

    logger.line();
    logger.log(t('config.initGlobal'));
    logger.line();

    if (isInitialized(true)) {
        logger.warn(t('config.globalConfigExists'));
        logger.log(t('config.globalConfigPath', {path: configPath}));
        logger.line();
        return;
    }

    ensureConfigDirectory(quartzDir, true);

    // Create config file first (without metadata)
    if (!configManager.configExists(true)) {
        fs.writeFileSync(configPath, DEFAULT_CONFIG_CONTENT, ENCODING.UTF8);
        logger.success(t('init.configCreated', {path: configPath}));
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
    logger.info(t('init.versionInitialized'));

    logger.line();
    logger.success(t('config.globalInitSuccess'));
    logger.info(t('config.globalConfigInfo'));
    logger.log(t('config.globalConfigPath', {path: configPath}));
    logger.line();
};

/**
 * Interactive init command handler
 */
const interactiveInitHandler: CommandHandler = async (context) => {
    const {command} = context;
    const isGlobal = command.parameters.global || false;
    const skipInteractive = command.parameters.skip || false;
    if (isGlobal && skipInteractive) {
        await handleGlobalNonInteractive(context);
    } else if (isGlobal) {
        await handleGlobalInteractive(context);
    } else if (skipInteractive) {
        await handleLocalNonInteractive(context);
    } else {
        await handleLocalInteractive(context);
    }
};

/**
 * Export init command definitions
 */
export const INIT_COMMANDS: CommandDefinition[] = [
    {
        verb: CommandVerb.INIT,
        object: CommandObject.CONFIG,
        description: 'Interactive Config initialization',
        parameters: [
            {
                name: 'skip',
                type: 'boolean',
                required: false,
                defaultValue: false,
                description: 'Skip interactive setup and use defaults',
                aliases: ['s'],
            },
            {
                name: 'global',
                type: 'boolean',
                required: false,
                defaultValue: false,
                description: 'Initialize global configuration',
                aliases: ['g'],
            },
        ],
        examples: [
            'init',
            'init --skip',
            'init -s',
            'init --global',
            'init -g',
            'init --global --skip',
            'init -g -s',
        ],
        category: 'initialization',
        handler: interactiveInitHandler,
    },
];
