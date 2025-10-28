//cli/commands/config.ts
import fs from 'node:fs';
import path from 'node:path';
import { setLanguage, t } from '../../i18n';
import {
    readQuartzConfig as readConfig,
    upsertPlatformConfig,
    writeQuartzConfig as writeConfig
} from '../../utils/config';
import { QuartzConfig } from '../../types/config';
import {
    CONFIG_FILE,
    CONFIG_KEYS,
    DEFAULT_VALUES,
    PLATFORM_TYPES,
    SUPPORTED_LANGUAGES,
    SUPPORTED_PLATFORMS,
    CONFIG_ICONS,
    SENSITIVE_KEYS,
    TOKEN_DISPLAY_LENGTH,
    SEPARATOR_LENGTH,
    INDENT,
} from '../../constants';
import { select, input, message } from '../../utils/enquirer';
import { logger } from '../../utils/logger';

/**
 * Get quartz.json file path
 */
function getQuartzPath(): string {
    return path.join(process.cwd(), CONFIG_FILE.NAME);
}

/**
 * Helper function to get display value from new configuration structure
 */
function getConfigDisplayValue(config: QuartzConfig, key: string): string | undefined {
    switch (key) {
        case CONFIG_KEYS.OPENAI_API_KEY:
            return config.openai.apiKey;
        case CONFIG_KEYS.OPENAI_BASE_URL:
            return config.openai.baseUrl;
        case CONFIG_KEYS.OPENAI_MODEL:
            return config.openai.model;
        case CONFIG_KEYS.QUARTZ_LANG:
            return config.language.ui;
        case CONFIG_KEYS.PROMPT_LANG:
            return config.language.prompt;
        case CONFIG_KEYS.GITHUB_TOKEN:
            return config.platforms.find(p => p.type === PLATFORM_TYPES.GITHUB)?.token;
        case CONFIG_KEYS.GITLAB_TOKEN:
            return config.platforms.find(p => p.type === PLATFORM_TYPES.GITLAB)?.token;
        case CONFIG_KEYS.GITLAB_URL:
            return config.platforms.find(p => p.type === PLATFORM_TYPES.GITLAB)?.url;
        case CONFIG_KEYS.GIT_PLATFORM:
            return config.platforms.length > 0 ? config.platforms[0].type : undefined;
        default:
            return undefined;
    }
}

/**
 * Check if configuration key is sensitive information
 */
function isSensitiveKey(key: string): boolean {
    return SENSITIVE_KEYS.includes(key as any);
}

/**
 * Format sensitive value display
 */
function formatSensitiveValue(value: string): string {
    return value.substring(0, TOKEN_DISPLAY_LENGTH) + '***';
}

/**
 * Set configuration value
 */
function setConfig(key: string, value: string) {
    const config = readConfig();

    switch (key) {
        case CONFIG_KEYS.OPENAI_API_KEY:
            config.openai.apiKey = value;
            break;
        case CONFIG_KEYS.OPENAI_BASE_URL:
            config.openai.baseUrl = value;
            break;
        case CONFIG_KEYS.OPENAI_MODEL:
            config.openai.model = value;
            break;
        case CONFIG_KEYS.QUARTZ_LANG:
            config.language.ui = value;
            break;
        case CONFIG_KEYS.PROMPT_LANG:
            config.language.prompt = value;
            break;
        case CONFIG_KEYS.GITHUB_TOKEN:
            upsertPlatformConfig({ type: PLATFORM_TYPES.GITHUB, token: value });
            logger.log(t('config.set', { key, value: '***' }));
            return;
        case CONFIG_KEYS.GITLAB_TOKEN: {
            const existingGitlab = config.platforms.find(p => p.type === PLATFORM_TYPES.GITLAB);
            upsertPlatformConfig({
                type: PLATFORM_TYPES.GITLAB,
                token: value,
                url: existingGitlab?.url || DEFAULT_VALUES.GITLAB_URL
            });
            logger.log(t('config.set', { key, value: '***' }));
            return;
        }
        case CONFIG_KEYS.GITLAB_URL: {
            const existingGitlab = config.platforms.find(p => p.type === PLATFORM_TYPES.GITLAB);
            if (existingGitlab) {
                upsertPlatformConfig({ ...existingGitlab, url: value });
            } else {
                logger.error(t('config.gitlabTokenSetFirst'));
                return;
            }
            logger.log(t('config.set', { key, value }));
            return;
        }
        case CONFIG_KEYS.GIT_PLATFORM:
            logger.warn(t('config.gitPlatformDeprecated'));
            return;
        default:
            logger.error(t('config.unknownKey', { key }));
            return;
    }

    writeConfig(config);
    logger.log(t('config.set', { key, value: isSensitiveKey(key) ? '***' : value }));
}

/**
 * Get configuration value
 */
function getConfig(key: string) {
    const config = readConfig();
    const value = getConfigDisplayValue(config, key);

    if (value) {
        const displayValue = isSensitiveKey(key) ? formatSensitiveValue(value) : value;
        logger.log(`${key}=${displayValue}`);
    } else {
        logger.log(t('config.notSet', { key }));
    }
}

/**
 * Get icon for configuration key
 */
function getConfigIcon(key: string): string {
    return CONFIG_ICONS[key] || '⚙️';
}

/**
 * List all configurations
 */
function listConfig() {
    const config = readConfig();

    logger.line();
    printLogo();
    logger.line();
    console.log(logger.text.bold(t('config.current')));
    logger.separator(SEPARATOR_LENGTH);
    logger.line();

    // Configuration items list
    const configItems = [
        { key: CONFIG_KEYS.OPENAI_API_KEY, label: t('config.keys.apiKey') },
        { key: CONFIG_KEYS.OPENAI_BASE_URL, label: t('config.keys.baseUrl') },
        { key: CONFIG_KEYS.OPENAI_MODEL, label: t('config.keys.model') },
        { key: CONFIG_KEYS.GITHUB_TOKEN, label: t('config.keys.githubToken') },
        { key: CONFIG_KEYS.GITLAB_TOKEN, label: t('config.keys.gitlabToken') },
        { key: CONFIG_KEYS.GITLAB_URL, label: t('config.keys.gitlabUrl') },
        { key: CONFIG_KEYS.QUARTZ_LANG, label: t('config.keys.language') },
        { key: CONFIG_KEYS.PROMPT_LANG, label: t('config.keys.promptLanguage') },
    ];

    for (const item of configItems) {
        const value = getConfigDisplayValue(config, item.key);
        const icon = getConfigIcon(item.key);

        if (value) {
            const displayValue = isSensitiveKey(item.key) ? formatSensitiveValue(value) : value;

            console.log(`${' '.repeat(INDENT.LEVEL_1)}${icon}  ${logger.text.bold(item.label)}`);
            console.log(`${' '.repeat(INDENT.LEVEL_3)}${logger.text.primary(displayValue)}`);
        } else {
            console.log(`${' '.repeat(INDENT.LEVEL_1)}${icon}  ${logger.text.bold(item.label)}`);
            console.log(`${' '.repeat(INDENT.LEVEL_3)}${logger.text.dim(logger.text.error(t('config.notConfigured')))}`);
        }
        logger.line();
    }

    // Display configured platform information
    if (config.platforms.length > 0) {
        console.log(logger.text.bold('🔧 ' + t('config.configuredPlatforms')));
        logger.line();
        for (const platform of config.platforms) {
            console.log(`${' '.repeat(INDENT.LEVEL_1)}✓ ${logger.text.primary(platform.type.toUpperCase())}`);
            if (platform.url) {
                console.log(`${' '.repeat(INDENT.LEVEL_2)}URL: ${platform.url}`);
            }
            console.log(`${' '.repeat(INDENT.LEVEL_2)}Token: ${formatSensitiveValue(platform.token)}`);
            logger.line();
        }
    }

    logger.separator(SEPARATOR_LENGTH);
    console.log(logger.text.dim(`💾 ${getQuartzPath()}`));
    logger.line();
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
 * Ask question using enquirer (improved formatting)
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
        // User cancelled
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
        // User cancelled
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
        // User cancelled
        return currentLang || DEFAULT_VALUES.LANGUAGE_UI;
    }
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

    const config = readConfig();

    try {
        // UI language
        const currentLang = config.language.ui;
        const lang = await selectLanguage(currentLang, t('config.keys.language'));
        config.language.ui = lang;

        process.env.QUARTZ_LANG = lang;
        setLanguage(lang as any);

        // Prompt language
        const currentPromptLang = config.language.prompt || lang;
        config.language.prompt = await selectLanguage(currentPromptLang, t('config.keys.promptLanguage'));

        // Git platform
        const currentPlatform = config.platforms.length > 0 ? config.platforms[0].type : PLATFORM_TYPES.GITHUB;
        const platform = await selectPlatform(currentPlatform);

        // OpenAI API Key
        const currentApiKey = config.openai.apiKey;
        const apiKeyLabel = '🔑 ' + t('config.keys.apiKey');
        const apiKeyDesc = currentApiKey
            ? t('config.wizard.apiKeyWithCurrent', { current: formatSensitiveValue(currentApiKey) })
            : t('config.wizard.apiKey');

        const apiKey = await askQuestion(apiKeyLabel, apiKeyDesc, currentApiKey);
        if (apiKey.trim()) {
            config.openai.apiKey = apiKey.trim();
        }

        // OpenAI Base URL
        const currentBaseUrl = config.openai.baseUrl;
        const defaultBaseUrl = currentBaseUrl || DEFAULT_VALUES.OPENAI_BASE_URL;
        const baseUrlLabel = '🌐 ' + t('config.keys.baseUrl');
        const baseUrlDesc = t('config.wizard.baseUrl', { default: defaultBaseUrl });

        const baseUrl = await askQuestion(baseUrlLabel, baseUrlDesc, defaultBaseUrl);
        if (baseUrl.trim()) {
            config.openai.baseUrl = baseUrl.trim();
        } else if (!currentBaseUrl) {
            config.openai.baseUrl = defaultBaseUrl;
        }

        // OpenAI Model
        const currentModel = config.openai.model;
        const defaultModel = currentModel || DEFAULT_VALUES.OPENAI_MODEL;
        const modelLabel = '🤖 ' + t('config.keys.model');
        const modelDesc = t('config.wizard.model', { default: defaultModel });

        const model = await askQuestion(modelLabel, modelDesc, defaultModel);
        if (model.trim()) {
            config.openai.model = model.trim();
        } else if (!currentModel) {
            config.openai.model = defaultModel;
        }

        // Git Token (based on selected platform)
        if (platform === PLATFORM_TYPES.GITHUB) {
            const existingGithub = config.platforms.find(p => p.type === PLATFORM_TYPES.GITHUB);
            const currentGithubToken = existingGithub?.token;
            const githubTokenLabel = '🔐 ' + t('config.keys.githubToken');
            const githubTokenDesc = currentGithubToken
                ? t('config.wizard.githubTokenWithCurrent', { current: formatSensitiveValue(currentGithubToken) })
                : t('config.wizard.githubToken');

            const githubToken = await askQuestion(githubTokenLabel, githubTokenDesc, currentGithubToken);
            if (githubToken.trim()) {
                upsertPlatformConfig({ type: PLATFORM_TYPES.GITHUB, token: githubToken.trim() });
            }
        } else if (platform === PLATFORM_TYPES.GITLAB) {
            const existingGitlab = config.platforms.find(p => p.type === PLATFORM_TYPES.GITLAB);
            const currentGitlabToken = existingGitlab?.token;
            const gitlabTokenLabel = '🔐 ' + t('config.keys.gitlabToken');
            const gitlabTokenDesc = currentGitlabToken
                ? t('config.wizard.gitlabTokenWithCurrent', { current: formatSensitiveValue(currentGitlabToken) })
                : t('config.wizard.gitlabToken');

            const gitlabToken = await askQuestion(gitlabTokenLabel, gitlabTokenDesc, currentGitlabToken);
            if (gitlabToken.trim()) {
                const currentGitlabUrl = existingGitlab?.url;
                const defaultGitlabUrl = currentGitlabUrl || DEFAULT_VALUES.GITLAB_URL;
                const gitlabUrlLabel = '🌐 ' + t('config.keys.gitlabUrl');
                const gitlabUrlDesc = t('config.wizard.gitlabUrl', { default: defaultGitlabUrl });

                const gitlabUrl = await askQuestion(gitlabUrlLabel, gitlabUrlDesc, defaultGitlabUrl);
                upsertPlatformConfig({
                    type: PLATFORM_TYPES.GITLAB,
                    token: gitlabToken.trim(),
                    url: gitlabUrl.trim() || defaultGitlabUrl
                });
            }
        }

        // Save configuration
        writeConfig(config);
        logger.line();
        logger.separator(SEPARATOR_LENGTH);
        await message(
            t('config.wizard.success'),
            t('config.wizard.saved', { path: getQuartzPath() }),
            'success'
        );

    } catch (error) {
        logger.error('Setup wizard error:', error);
        throw error;
    }
}

/**
 * Show usage help
 */
function showHelp() {
    logger.line();
    printLogo();
    logger.line();

    console.log(logger.text.bold('📖 ' + t('config.usage')));
    logger.separator(SEPARATOR_LENGTH);
    logger.line();

    console.log(logger.text.bold('⚡ ' + t('config.commands')));
    logger.line();
    logger.command('quartz config list', logger.text.dim(t('config.listDesc')));
    logger.command(`quartz config set ${logger.text.warning('<key>')} ${logger.text.warning('<value>')}`, logger.text.dim(t('config.setDesc')));
    logger.command(`quartz config get ${logger.text.warning('<key>')}`, logger.text.dim(t('config.getDesc')));
    logger.command('quartz config init', logger.text.dim(t('config.initDesc')));

    console.log(logger.text.bold('🔑 ' + t('config.availableKeys')));
    logger.line();
    console.log('  ' + getConfigIcon(CONFIG_KEYS.OPENAI_API_KEY) + '  ' + logger.text.warning(CONFIG_KEYS.OPENAI_API_KEY));
    console.log('     ' + logger.text.dim(t('config.keys.apiKey')));
    logger.line();
    console.log('  ' + getConfigIcon(CONFIG_KEYS.OPENAI_BASE_URL) + '  ' + logger.text.warning(CONFIG_KEYS.OPENAI_BASE_URL));
    console.log('     ' + logger.text.dim(t('config.keys.baseUrl')));
    logger.line();
    console.log('  ' + getConfigIcon(CONFIG_KEYS.OPENAI_MODEL) + '  ' + logger.text.warning(CONFIG_KEYS.OPENAI_MODEL));
    console.log('     ' + logger.text.dim(t('config.keys.model')));
    logger.line();
    console.log('  ' + getConfigIcon(CONFIG_KEYS.GITHUB_TOKEN) + '  ' + logger.text.warning(CONFIG_KEYS.GITHUB_TOKEN));
    console.log('     ' + logger.text.dim(t('config.keys.githubToken')));
    logger.line();
    console.log('  ' + getConfigIcon(CONFIG_KEYS.GITLAB_TOKEN) + '  ' + logger.text.warning(CONFIG_KEYS.GITLAB_TOKEN));
    console.log('     ' + logger.text.dim(t('config.keys.gitlabToken')));
    logger.line();
    console.log('  ' + getConfigIcon(CONFIG_KEYS.GITLAB_URL) + '  ' + logger.text.warning(CONFIG_KEYS.GITLAB_URL));
    console.log('     ' + logger.text.dim(t('config.keys.gitlabUrl')));
    logger.line();
    console.log('  ' + getConfigIcon(CONFIG_KEYS.QUARTZ_LANG) + '  ' + logger.text.warning(CONFIG_KEYS.QUARTZ_LANG));
    console.log('     ' + logger.text.dim(t('config.keys.language')));
    logger.line();
    console.log('  ' + getConfigIcon(CONFIG_KEYS.PROMPT_LANG) + '  ' + logger.text.warning(CONFIG_KEYS.PROMPT_LANG));
    console.log('     ' + logger.text.dim(t('config.keys.promptLanguage')));
    logger.line();

    console.log(logger.text.bold('💡 ' + t('config.examples')));
    logger.line();
    logger.example(t('config.initDesc'), 'quartz config init');
    logger.example(t('config.setDesc'), `quartz config set ${CONFIG_KEYS.OPENAI_API_KEY} sk-your-key`);
    logger.example('', `quartz config set ${CONFIG_KEYS.OPENAI_MODEL} ${DEFAULT_VALUES.OPENAI_MODEL}`);
    logger.example('', `quartz config set ${CONFIG_KEYS.QUARTZ_LANG} zh-CN`);
    logger.example('', `quartz config set ${CONFIG_KEYS.PROMPT_LANG} en`);
    logger.example(t('config.profilesDesc'), 'quartz config save-profile my-profile');
    logger.example('', 'quartz config load-profile my-profile');
    logger.example('', 'quartz config list-profiles');
    logger.example(t('config.getDesc'), `quartz config get ${CONFIG_KEYS.OPENAI_API_KEY}`);
    logger.example(t('config.listDesc'), 'quartz config list');
    logger.separator(SEPARATOR_LENGTH);
    logger.line();
}

/**
 * Save current configuration as profile
 */
function saveProfile(name: string) {
    const config = readConfig();
    writeConfig(config, name);
    logger.log(t('config.profileSaved', { name }));
}

/**
 * Load profiles from quartz.json
 */
function loadProfiles(): Record<string, any> {
    const quartzPath = getQuartzPath();
    if (fs.existsSync(quartzPath)) {
        try {
            const data = JSON.parse(fs.readFileSync(quartzPath, 'utf-8'));
            const { [CONFIG_FILE.DEFAULT_PROFILE]: _, ...profiles } = data;
            return profiles;
        } catch (error) {
            logger.error('Failed to load profiles:', error);
            return {};
        }
    }
    return {};
}

/**
 * Load configuration profile
 */
function loadProfile(name: string) {
    const quartzPath = getQuartzPath();
    let data: any = {};

    if (fs.existsSync(quartzPath)) {
        try {
            const content = fs.readFileSync(quartzPath, 'utf-8');
            data = JSON.parse(content);
        } catch (error) {
            logger.error('Failed to load quartz.json:', error);
            process.exit(1);
        }
    }

    if (!data[name]) {
        logger.error(t('config.profileNotFound', { name }));
        logger.log('\n' + t('config.availableProfiles'));
        listProfiles();
        process.exit(1);
    }

    // Update default profile with selected profile
    data[CONFIG_FILE.DEFAULT_PROFILE] = data[name];

    fs.writeFileSync(quartzPath, JSON.stringify(data, null, 2), 'utf-8');
    logger.log(t('config.profileLoaded', { name }));
}

/**
 * List all saved profiles
 */
function listProfiles() {
    const profiles = loadProfiles();
    const profileNames = Object.keys(profiles);

    if (profileNames.length === 0) {
        logger.log(t('config.noProfiles'));
        return;
    }

    logger.line();
    console.log(logger.text.bold('📋 ' + t('config.savedProfiles')));
    logger.separator(SEPARATOR_LENGTH);
    logger.line();

    for (const name of profileNames) {
        const profile = profiles[name];
        console.log(`${' '.repeat(INDENT.LEVEL_1)}📦 ${logger.text.primary(name)}`);
        if (profile.config) {
            const platformCount = profile.config.platforms?.length || 0;
            console.log(`${' '.repeat(INDENT.LEVEL_3)}${logger.text.dim(t('config.platformCount', { count: platformCount }))}`);
        }
        logger.line();
    }
}

/**
 * Delete configuration profile
 */
function deleteProfile(name: string) {
    const quartzPath = getQuartzPath();
    let data: any = {};

    if (fs.existsSync(quartzPath)) {
        try {
            const content = fs.readFileSync(quartzPath, 'utf-8');
            data = JSON.parse(content);
        } catch (error) {
            logger.error('Failed to load quartz.json:', error);
            process.exit(1);
        }
    }

    if (!data[name]) {
        logger.error(t('config.profileNotFound', { name }));
        process.exit(1);
    }

    delete data[name];
    fs.writeFileSync(quartzPath, JSON.stringify(data, null, 2), 'utf-8');
    logger.log(t('config.profileDeleted', { name }));
}

/**
 * Main configuration command handler
 */
export async function configCommand(args: string[]) {
    const subCommand = args[0];

    if (!subCommand || subCommand === 'help' || subCommand === '-h' || subCommand === '--help') {
        showHelp();
        return;
    }

    switch (subCommand) {
        case 'list':
        case 'ls':
            listConfig();
            break;

        case 'set':
            if (args.length < 3) {
                logger.error(t('config.errors.setUsage'));
                process.exit(1);
            }
            setConfig(args[1], args[2]);
            break;

        case 'get':
            if (args.length < 2) {
                logger.error(t('config.errors.getUsage'));
                process.exit(1);
            }
            getConfig(args[1]);
            break;

        case 'init':
        case 'setup':
            await setupWizard();
            break;

        case 'save-profile':
        case 'save':
            if (args.length < 2) {
                logger.error(t('config.errors.saveProfileUsage'));
                process.exit(1);
            }
            saveProfile(args[1]);
            break;

        case 'load-profile':
        case 'load':
            if (args.length < 2) {
                logger.error(t('config.errors.loadProfileUsage'));
                process.exit(1);
            }
            loadProfile(args[1]);
            break;

        case 'list-profiles':
        case 'profiles':
            listProfiles();
            break;

        case 'delete-profile':
        case 'delete':
        case 'rm':
            if (args.length < 2) {
                logger.error(t('config.errors.deleteProfileUsage'));
                process.exit(1);
            }
            deleteProfile(args[1]);
            break;

        default:
            logger.error(t('config.errors.unknownCommand', { command: subCommand }));
            showHelp();
            process.exit(1);
    }
}