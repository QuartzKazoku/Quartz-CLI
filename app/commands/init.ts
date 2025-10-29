//cli/commands/init.ts
import fs from 'node:fs';
import path from 'node:path';
import {CONFIG_FILE, DEFAULT_CONFIG_CONTENT, ENCODING, EXAMPLE_CONFIG_CONTENT} from '@/constants';
import {ensureQuartzDir} from '@/utils/config';
import {logger} from '@/utils/logger';
import {t} from '@/i18n';
import {initializeVersionMetadata} from '@/utils/migration';

/**
 * Get .quartz directory path
 */
function getQuartzDir(): string {
    return path.join(process.cwd(), CONFIG_FILE.DIR);
}

/**
 * Get quartz.jsonc file path in .quartz directory
 */
function getQuartzConfigPath(): string {
    return path.join(getQuartzDir(), CONFIG_FILE.NAME);
}

/**
 * Get quartz.example.jsonc file path in .quartz directory
 */
function getQuartzExamplePath(): string {
    return path.join(getQuartzDir(), CONFIG_FILE.EXAMPLE_NAME);
}

/**
 * Check if old config exists in project root
 */
function checkOldConfig(): string | null {
    const oldConfigPath = path.join(process.cwd(), CONFIG_FILE.NAME);
    if (fs.existsSync(oldConfigPath)) {
        return oldConfigPath;
    }
    return null;
}

/**
 * Migrate old config to new location
 */
function migrateOldConfig(oldConfigPath: string): void {
    const newConfigPath = getQuartzConfigPath();
    const content = fs.readFileSync(oldConfigPath, ENCODING.UTF8);
    fs.writeFileSync(newConfigPath, content, ENCODING.UTF8);
    logger.success(t('init.migrated', {from: oldConfigPath, to: newConfigPath}));

    // Ask user if they want to remove old config
    logger.info(t('init.oldConfigReminder', {path: oldConfigPath}));
}

/**
 * Check if already initialized
 */
function isInitialized(): boolean {
    const quartzDir = getQuartzDir();
    const configPath = getQuartzConfigPath();
    return fs.existsSync(quartzDir) && fs.existsSync(configPath);
}

/**
 * Initialize Quartz configuration
 */
export async function initCommand(args: string[]): Promise<void> {
    const quartzDir = getQuartzDir();
    const configPath = getQuartzConfigPath();
    const examplePath = getQuartzExamplePath();

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
        ensureQuartzDir();
        logger.success(t('init.dirCreated', {dir: quartzDir}));
    }

    // Check for old config and migrate if exists
    const oldConfigPath = checkOldConfig();
    const configNotExists = !fs.existsSync(configPath);
    if (oldConfigPath && configNotExists) {
        logger.info(t('init.foundOldConfig', {path: oldConfigPath}));
        migrateOldConfig(oldConfigPath);
    } else if (configNotExists) {
        // Create quartz.jsonc if it doesn't exist
        fs.writeFileSync(configPath, DEFAULT_CONFIG_CONTENT, ENCODING.UTF8);
        logger.success(t('init.configCreated', {path: configPath}));
        
        // Initialize version metadata
        initializeVersionMetadata();
        logger.info(t('init.versionInitialized'));
    } else {
        logger.info(t('init.configExists', {path: configPath}));
    }
    const exampleNotExists = !fs.existsSync(examplePath);
    // Create quartz.example.jsonc
    if (exampleNotExists) {
        fs.writeFileSync(examplePath, EXAMPLE_CONFIG_CONTENT, ENCODING.UTF8);
        logger.success(t('init.exampleCreated', {path: examplePath}));
    } else {
        logger.info(t('init.exampleExists', {path: examplePath}));
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