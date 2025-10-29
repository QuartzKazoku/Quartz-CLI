//cli/commands/init.ts
import fs from 'node:fs';
import path from 'node:path';
import {DEFAULT_CONFIG_CONTENT, ENCODING} from '@/constants';
import {getConfigManager} from '@/manager/config';
import {logger} from '@/utils/logger';
import {t} from '@/i18n';

// Get configuration manager instance
const configManager = getConfigManager();

/**
 * Check if already initialized
 */
function isInitialized(): boolean {
    const quartzDir = configManager.getConfigDir();
    const configPath = configManager.getConfigPath();
    return fs.existsSync(quartzDir) && fs.existsSync(configPath);
}

/**
 * Initialize Quartz configuration
 */
export async function initCommand(args: string[]): Promise<void> {
    const quartzDir = configManager.getConfigDir();
    const configPath = configManager.getConfigPath();

    logger.line();
    logger.log(t('init.starting'));
    logger.line();

    // Check if already initialized
    if (isInitialized()) {
        logger.warn(t('init.alreadyInitialized'));
        logger.info(t('init.reinitializeHint'));
        logger.line();
        return;
    }

    // Check if .quartz directory already exists
    if (fs.existsSync(quartzDir)) {
        logger.info(t('init.dirExists', {dir: quartzDir}));
    } else {
        // Create .quartz directory
        configManager.ensureConfigDir();
        logger.success(t('init.dirCreated', {dir: quartzDir}));
    }

    const configFileNotExists = !configManager.configExists();
    // Create quartz.jsonc
    if (configFileNotExists) {
        fs.writeFileSync(configPath, DEFAULT_CONFIG_CONTENT, ENCODING.UTF8);
        logger.success(t('init.configCreated', {path: configPath}));
        
        // Initialize version metadata using ConfigManager
        configManager.initializeVersionMetadata();
        logger.info(t('init.versionInitialized'));
    } else {
        logger.info(t('init.configExists', {path: configPath}));
    }

    logger.line();
    logger.box(
        `${logger.text.success('✓')} ${t('init.success')}

${logger.text.dim(t('init.nextSteps'))}

  1. ${logger.text.primary('quartz config init')} - ${t('init.setupConfig')}
  2. ${logger.text.primary('quartz --help')} - ${t('init.viewCommands')}`,
        {title: '🎉 ' + t('init.complete'), padding: 1}
    );
    logger.line();

    // Suggest adding .quartz to .gitignore
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