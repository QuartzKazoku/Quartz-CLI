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
            console.log(t('config.set', { key, value: '***' }));
            return;
        case CONFIG_KEYS.GITLAB_TOKEN: {
            const existingGitlab = config.platforms.find(p => p.type === PLATFORM_TYPES.GITLAB);
            upsertPlatformConfig({
                type: PLATFORM_TYPES.GITLAB,
                token: value,
                url: existingGitlab?.url || DEFAULT_VALUES.GITLAB_URL
            });
            console.log(t('config.set', { key, value: '***' }));
            return;
        }
        case CONFIG_KEYS.GITLAB_URL: {
            const existingGitlab = config.platforms.find(p => p.type === PLATFORM_TYPES.GITLAB);
            if (existingGitlab) {
                upsertPlatformConfig({ ...existingGitlab, url: value });
            } else {
                console.error(t('config.gitlabTokenSetFirst'));
                return;
            }
            console.log(t('config.set', { key, value }));
            return;
        }
        case CONFIG_KEYS.GIT_PLATFORM:
            console.warn(t('config.gitPlatformDeprecated'));
            return;
        default:
            console.error(t('config.unknownKey', { key }));
            return;
    }

    writeConfig(config);
    console.log(t('config.set', { key, value: isSensitiveKey(key) ? '***' : value }));
}

/**
 * Get configuration value
 */
function getConfig(key: string) {
    const config = readConfig();
    const value = getConfigDisplayValue(config, key);

    if (value) {
        const displayValue = isSensitiveKey(key) ? formatSensitiveValue(value) : value;
        console.log(`${key}=${displayValue}`);
    } else {
        console.log(t('config.notSet', { key }));
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

    console.log('');
    printLogo();
    console.log('');
    console.log('\x1b[1m%s\x1b[0m', t('config.current'));
    console.log('\x1b[2m%s\x1b[0m', '━'.repeat(SEPARATOR_LENGTH));
    console.log('');

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

            console.log(`${' '.repeat(INDENT.LEVEL_1)}${icon}  \x1b[1m${item.label}\x1b[0m`);
            console.log(`${' '.repeat(INDENT.LEVEL_3)}\x1b[36m${displayValue}\x1b[0m`);
        } else {
            console.log(`${' '.repeat(INDENT.LEVEL_1)}${icon}  \x1b[1m${item.label}\x1b[0m`);
            console.log(`${' '.repeat(INDENT.LEVEL_3)}\x1b[2m\x1b[31m${t('config.notConfigured')}\x1b[0m`);
        }
        console.log('');
    }

    // Display configured platform information
    if (config.platforms.length > 0) {
        console.log('\x1b[1m%s\x1b[0m', '🔧 ' + t('config.configuredPlatforms'));
        console.log('');
        for (const platform of config.platforms) {
            console.log(`${' '.repeat(INDENT.LEVEL_1)}✓ \x1b[36m${platform.type.toUpperCase()}\x1b[0m`);
            if (platform.url) {
                console.log(`${' '.repeat(INDENT.LEVEL_2)}URL: ${platform.url}`);
            }
            console.log(`${' '.repeat(INDENT.LEVEL_2)}Token: ${formatSensitiveValue(platform.token)}`);
            console.log('');
        }
    }

    console.log('\x1b[2m%s\x1b[0m', '━'.repeat(SEPARATOR_LENGTH));
    console.log('\x1b[2m%s\x1b[0m', `💾 ${getQuartzPath()}`);
    console.log('');
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
    console.log('\x1b[36m%s\x1b[0m', logo);
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
    console.log('');
    console.log(t('config.wizard.welcome'));
    console.log('');
    console.log('\x1b[2m%s\x1b[0m', '━'.repeat(SEPARATOR_LENGTH));

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
        console.log('');
        console.log('\x1b[2m%s\x1b[0m', '━'.repeat(SEPARATOR_LENGTH));
        await message(
            t('config.wizard.success'),
            t('config.wizard.saved', { path: getQuartzPath() }),
            'success'
        );

    } catch (error) {
        console.error('Setup wizard error:', error);
        throw error;
    }
}

/**
 * Show usage help
 */
function showHelp() {
    console.log('');
    printLogo();
    console.log('');

    console.log('\x1b[1m%s\x1b[0m', '📖 ' + t('config.usage'));
    console.log('\x1b[2m%s\x1b[0m', '━'.repeat(SEPARATOR_LENGTH));
    console.log('');

    console.log('\x1b[1m%s\x1b[0m', '⚡ ' + t('config.commands'));
    console.log('');
    console.log('  \x1b[36mquartz config list\x1b[0m');
    console.log('  \x1b[2m' + t('config.listDesc') + '\x1b[0m');
    console.log('');
    console.log('  \x1b[36mquartz config set\x1b[0m \x1b[33m<key>\x1b[0m \x1b[33m<value>\x1b[0m');
    console.log('  \x1b[2m' + t('config.setDesc') + '\x1b[0m');
    console.log('');
    console.log('  \x1b[36mquartz config get\x1b[0m \x1b[33m<key>\x1b[0m');
    console.log('  \x1b[2m' + t('config.getDesc') + '\x1b[0m');
    console.log('');
    console.log('  \x1b[36mquartz config init\x1b[0m');
    console.log('  \x1b[2m' + t('config.initDesc') + '\x1b[0m');
    console.log('');

    console.log('\x1b[1m%s\x1b[0m', '🔑 ' + t('config.availableKeys'));
    console.log('');
    console.log('  ' + getConfigIcon(CONFIG_KEYS.OPENAI_API_KEY) + '  \x1b[33m' + CONFIG_KEYS.OPENAI_API_KEY + '\x1b[0m');
    console.log('     \x1b[2m' + t('config.keys.apiKey') + '\x1b[0m');
    console.log('');
    console.log('  ' + getConfigIcon(CONFIG_KEYS.OPENAI_BASE_URL) + '  \x1b[33m' + CONFIG_KEYS.OPENAI_BASE_URL + '\x1b[0m');
    console.log('     \x1b[2m' + t('config.keys.baseUrl') + '\x1b[0m');
    console.log('');
    console.log('  ' + getConfigIcon(CONFIG_KEYS.OPENAI_MODEL) + '  \x1b[33m' + CONFIG_KEYS.OPENAI_MODEL + '\x1b[0m');
    console.log('     \x1b[2m' + t('config.keys.model') + '\x1b[0m');
    console.log('');
    console.log('  ' + getConfigIcon(CONFIG_KEYS.GITHUB_TOKEN) + '  \x1b[33m' + CONFIG_KEYS.GITHUB_TOKEN + '\x1b[0m');
    console.log('     \x1b[2m' + t('config.keys.githubToken') + '\x1b[0m');
    console.log('');
    console.log('  ' + getConfigIcon(CONFIG_KEYS.GITLAB_TOKEN) + '  \x1b[33m' + CONFIG_KEYS.GITLAB_TOKEN + '\x1b[0m');
    console.log('     \x1b[2m' + t('config.keys.gitlabToken') + '\x1b[0m');
    console.log('');
    console.log('  ' + getConfigIcon(CONFIG_KEYS.GITLAB_URL) + '  \x1b[33m' + CONFIG_KEYS.GITLAB_URL + '\x1b[0m');
    console.log('     \x1b[2m' + t('config.keys.gitlabUrl') + '\x1b[0m');
    console.log('');
    console.log('  ' + getConfigIcon(CONFIG_KEYS.QUARTZ_LANG) + '  \x1b[33m' + CONFIG_KEYS.QUARTZ_LANG + '\x1b[0m');
    console.log('     \x1b[2m' + t('config.keys.language') + '\x1b[0m');
    console.log('');
    console.log('  ' + getConfigIcon(CONFIG_KEYS.PROMPT_LANG) + '  \x1b[33m' + CONFIG_KEYS.PROMPT_LANG + '\x1b[0m');
    console.log('     \x1b[2m' + t('config.keys.promptLanguage') + '\x1b[0m');
    console.log('');

    console.log('\x1b[1m%s\x1b[0m', '💡 ' + t('config.examples'));
    console.log('');
    console.log('  \x1b[2m# ' + t('config.initDesc') + '\x1b[0m');
    console.log('  \x1b[32m$\x1b[0m quartz config init');
    console.log('');
    console.log('  \x1b[2m# ' + t('config.setDesc') + '\x1b[0m');
    console.log('  \x1b[32m$\x1b[0m quartz config set ' + CONFIG_KEYS.OPENAI_API_KEY + ' sk-your-key');
    console.log('  \x1b[32m$\x1b[0m quartz config set ' + CONFIG_KEYS.OPENAI_MODEL + ' ' + DEFAULT_VALUES.OPENAI_MODEL);
    console.log('  \x1b[32m$\x1b[0m quartz config set ' + CONFIG_KEYS.QUARTZ_LANG + ' zh-CN');
    console.log('  \x1b[32m$\x1b[0m quartz config set ' + CONFIG_KEYS.PROMPT_LANG + ' en');
    console.log('');
    console.log('  \x1b[2m# ' + t('config.profilesDesc') + '\x1b[0m');
    console.log('  \x1b[32m$\x1b[0m quartz config save-profile my-profile');
    console.log('  \x1b[32m$\x1b[0m quartz config load-profile my-profile');
    console.log('  \x1b[32m$\x1b[0m quartz config list-profiles');
    console.log('');
    console.log('  \x1b[2m# ' + t('config.getDesc') + '\x1b[0m');
    console.log('  \x1b[32m$\x1b[0m quartz config get ' + CONFIG_KEYS.OPENAI_API_KEY);
    console.log('');
    console.log('  \x1b[2m# ' + t('config.listDesc') + '\x1b[0m');
    console.log('  \x1b[32m$\x1b[0m quartz config list');
    console.log('');
    console.log('\x1b[2m%s\x1b[0m', '━'.repeat(SEPARATOR_LENGTH));
    console.log('');
}

/**
 * Save current configuration as profile
 */
function saveProfile(name: string) {
    const config = readConfig();
    writeConfig(config, name);
    console.log(t('config.profileSaved', { name }));
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
            console.error('Failed to load profiles:', error);
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
            console.error('Failed to load quartz.json:', error);
            process.exit(1);
        }
    }

    if (!data[name]) {
        console.error(t('config.profileNotFound', { name }));
        console.log('\n' + t('config.availableProfiles'));
        listProfiles();
        process.exit(1);
    }

    // Update default profile with selected profile
    data[CONFIG_FILE.DEFAULT_PROFILE] = data[name];

    fs.writeFileSync(quartzPath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(t('config.profileLoaded', { name }));
}

/**
 * List all saved profiles
 */
function listProfiles() {
    const profiles = loadProfiles();
    const profileNames = Object.keys(profiles);

    if (profileNames.length === 0) {
        console.log(t('config.noProfiles'));
        return;
    }

    console.log('');
    console.log('\x1b[1m%s\x1b[0m', '📋 ' + t('config.savedProfiles'));
    console.log('\x1b[2m%s\x1b[0m', '━'.repeat(SEPARATOR_LENGTH));
    console.log('');

    for (const name of profileNames) {
        const profile = profiles[name];
        console.log(`${' '.repeat(INDENT.LEVEL_1)}📦 \x1b[36m${name}\x1b[0m`);
        if (profile.config) {
            const platformCount = profile.config.platforms?.length || 0;
            console.log(`${' '.repeat(INDENT.LEVEL_3)}\x1b[2m${t('config.platformCount', { count: platformCount })}\x1b[0m`);
        }
        console.log('');
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
            console.error('Failed to load quartz.json:', error);
            process.exit(1);
        }
    }

    if (!data[name]) {
        console.error(t('config.profileNotFound', { name }));
        process.exit(1);
    }

    delete data[name];
    fs.writeFileSync(quartzPath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(t('config.profileDeleted', { name }));
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
                console.error(t('config.errors.setUsage'));
                process.exit(1);
            }
            setConfig(args[1], args[2]);
            break;

        case 'get':
            if (args.length < 2) {
                console.error(t('config.errors.getUsage'));
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
                console.error(t('config.errors.saveProfileUsage'));
                process.exit(1);
            }
            saveProfile(args[1]);
            break;

        case 'load-profile':
        case 'load':
            if (args.length < 2) {
                console.error(t('config.errors.loadProfileUsage'));
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
                console.error(t('config.errors.deleteProfileUsage'));
                process.exit(1);
            }
            deleteProfile(args[1]);
            break;

        default:
            console.error(t('config.errors.unknownCommand', { command: subCommand }));
            showHelp();
            process.exit(1);
    }
}