//app/commands/init.ts
import fs from 'node:fs';
import path from 'node:path';
import {DEFAULT_CONFIG_CONTENT, ENCODING, VERSION, CONFIG_FILE} from '@/constants';
import {configManager} from '@/manager/config';
import {logger} from '@/utils/logger';
import {t} from '@/i18n';


/**
 * Check if already initialized
 * @param global - If true, checks global config; otherwise, checks project config
 */
function isInitialized(global = false): boolean {
    const quartzDir = configManager.getConfigDir(global);
    const configPath = configManager.getConfigPath(global);
    return fs.existsSync(quartzDir) && fs.existsSync(configPath);
}

/**
 * Display information when global configuration is detected
 * @param globalConfigPath - Path to the global configuration file
 */
function displayGlobalConfigDetected(globalConfigPath: string) {
    // Display global configuration detected message
    logger.info(t('init.globalConfigDetected'));
    logger.log(t('init.globalConfigPath', {path: globalConfigPath}));
    logger.line();

    // Display usage suggestions and project configuration notes
    logger.info(t('init.canUseDirectly'));
    logger.log(t('init.projectConfigOptional'));
    logger.line();
}

/**
 * Display information when no global configuration is found
 */
function displayNoGlobalConfig() {
    // Display no global config message and suggest initializing global config
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
 * @param quartzDir - Path to configuration directory
 * @param global - If true, ensures global directory; otherwise, ensures project directory
 */
function ensureConfigDirectory(quartzDir: string, global = false) {
    if (fs.existsSync(quartzDir)) {
        logger.info(t('init.dirExists', {dir: quartzDir}));
    } else {
        configManager.ensureConfigDir(global);
        logger.success(t('init.dirCreated', {dir: quartzDir}));
    }
}

/**
 * Create configuration file if not exists
 * @param configPath - Path to configuration file
 * @param global - If true, creates global config; otherwise, creates project config
 */
function createConfigFile(configPath: string, global = false) {
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
 * Initialize Quartz configuration
 */
export async function initCommand(args: string[]): Promise<void> {
    // Check if --global flag is present
    const isGlobal = args.includes('--global') || args.includes('-g');
    
    const quartzDir = configManager.getConfigDir(isGlobal);
    const configPath = configManager.getConfigPath(isGlobal);
    const hasGlobalConfig = configManager.globalConfigExists();
    const globalConfigPath = configManager.getConfigPath(true);

    logger.line();
    logger.log(t('init.starting'));
    logger.line();

    // For global init, skip project config checks
    if (isGlobal) {
        logger.info(t('config.initGlobal'));
        logger.line();
        
        if (isInitialized(true)) {
            logger.warn(t('config.globalConfigExists'));
            logger.log(t('config.globalConfigPath', {path: globalConfigPath}));
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
        return;
    }

    // For project init, show global config status
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