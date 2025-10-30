//app/commands/init.ts
import fs from 'node:fs';
import path from 'node:path';
import {DEFAULT_CONFIG_CONTENT, ENCODING} from '@/constants';
import {configManager} from '@/manager/config';
import {logger} from '@/utils/logger';
import {t} from '@/i18n';


/**
 * Check if already initialized
 */
function isInitialized(): boolean {
    const quartzDir = configManager.getConfigDir();
    const configPath = configManager.getConfigPath();
    return fs.existsSync(quartzDir) && fs.existsSync(configPath);
}

/**
 * Display information when global configuration is detected
 * @param globalConfigPath - Path to the global configuration file
 */
function displayGlobalConfigDetected(globalConfigPath: string) {
    // Display global configuration detected message
    logger.info(t('init.globalConfigDetected', {default: '🌍 Global configuration detected'}));
    logger.log(t('init.globalConfigPath', {default: '   Path: {path}', path: globalConfigPath}));
    logger.line();

    // Display usage suggestions and project configuration notes
    logger.info(t('init.canUseDirectly', {default: '✓ You can use Quartz commands directly without project-specific config'}));
    logger.log(t('init.projectConfigOptional', {default: '  Project config is only needed if you want project-specific settings'}));
    logger.line();
}

/**
 * Display information when no global configuration is found
 */
function displayNoGlobalConfig() {
    // Display no global config message and suggest initializing global config
    logger.info(t('init.noGlobalConfig', {default: '💡 No global configuration found'}));
    logger.log(t('init.suggestGlobal', {default: '   Consider using "quartz config init --global" for shared settings across all projects'}));
    logger.line();
}

/**
 * Display project config warning if global config exists
 */
function displayProjectConfigWarning(hasGlobalConfig: boolean) {
    if (hasGlobalConfig) {
        logger.warn(t('init.confirmProjectConfig', {default: '⚠️  Project configuration will override global settings'}));
        logger.log(t('init.onlyNeededIf', {default: '   Only create project config if you need project-specific settings'}));
        logger.line();
    }
}

/**
 * Ensure configuration directory exists
 */
function ensureConfigDirectory(quartzDir: string) {
    if (fs.existsSync(quartzDir)) {
        logger.info(t('init.dirExists', {dir: quartzDir}));
    } else {
        configManager.ensureConfigDir();
        logger.success(t('init.dirCreated', {dir: quartzDir}));
    }
}

/**
 * Create configuration file if not exists
 */
function createConfigFile(configPath: string) {
    const configFileNotExists = !configManager.configExists();

    if (configFileNotExists) {
        fs.writeFileSync(configPath, DEFAULT_CONFIG_CONTENT, ENCODING.UTF8);
        logger.success(t('init.configCreated', {path: configPath}));

        configManager.initializeVersionMetadata();
        logger.info(t('init.versionInitialized'));
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
 * Initialize Quartz configuration
 */
export async function initCommand(args: string[]): Promise<void> {
    const quartzDir = configManager.getConfigDir();
    const configPath = configManager.getConfigPath();
    const hasGlobalConfig = configManager.globalConfigExists();
    const globalConfigPath = configManager.getConfigPath(true);

    logger.line();
    logger.log(t('init.starting'));
    logger.line();

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
    ensureConfigDirectory(quartzDir);
    createConfigFile(configPath);
    displaySuccessMessage();
    suggestGitignore();
}