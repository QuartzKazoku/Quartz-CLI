//cli/commands/init.ts
import fs from 'node:fs';
import path from 'node:path';
import {CONFIG_FILE} from '@/constants';
import {ensureQuartzDir} from '@/utils/config';
import {logger} from '@/utils/logger';
import {t} from '@/i18n';

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
 * Get the template content for quartz.example.jsonc
 */
function getExampleConfigContent(): string {
    return `{
  "default": {
    "name": "default",
    "config": {
      "openai": {
        "apiKey": "sk-",
        "baseUrl": "https://api.openai.com/v1",
        "model": "gpt-5"
      },
      "platforms": [
        {
          "type": "github",
          "token": ""
        },
        {
          "type": "gitlab",
          "url": "https://gitlab.com",
          "token": "glpat-your-gitlab-token-here"
        }
      ],
      "language": {
        "ui": "zh-CN",
        "prompt": "en"
      }
    }
  },
  "work": {
    "name": "work",
    "config": {
      "openai": {
        "apiKey": "sk-your-work-openai-api-key",
        "baseUrl": "https://api.openai.com/v1",
        "model": "gpt-5"
      },
      "platforms": [
        {
          "type": "gitlab",
          "url": "https://gitlab.company.com",
          "token": "glpat-your-company-gitlab-token"
        }
      ],
      "language": {
        "ui": "zh-CN",
        "prompt": "zh-CN"
      }
    }
  }
}`;
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
    const content = fs.readFileSync(oldConfigPath, 'utf-8');
    fs.writeFileSync(newConfigPath, content, 'utf-8');
    logger.success(t('init.migrated', {from: oldConfigPath, to: newConfigPath}));

    // Ask user if they want to remove old config
    logger.info(t('init.oldConfigReminder', {path: oldConfigPath}));
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
        const exampleContent = getExampleConfigContent();
        fs.writeFileSync(configPath, exampleContent, 'utf-8');
        logger.success(t('init.configCreated', {path: configPath}));
    } else {
        logger.info(t('init.configExists', {path: configPath}));
    }
    const exampleNotExists = !fs.existsSync(examplePath);
    // Create quartz.example.jsonc
    if (exampleNotExists) {
        const exampleContent = getExampleConfigContent();
        fs.writeFileSync(examplePath, exampleContent, 'utf-8');
        logger.success(t('init.exampleCreated', {path: examplePath}));
    } else {
        logger.info(t('init.exampleExists', {path: examplePath}));
    }

    logger.line();
    logger.box(
        `${logger.text.success('✓')} ${t('init.success')}\n\n${logger.text.dim(t('init.nextSteps'))}\n\n  1. ${logger.text.primary('quartz config init')} - ${t('init.setupConfig')}\n  2. ${logger.text.primary('quartz --help')} - ${t('init.viewCommands')}`,
        {title: '🎉 ' + t('init.complete'), padding: 1}
    );
    logger.line();

    // Suggest adding .quartz to .gitignore
    const gitignorePath = path.join(process.cwd(), '.gitignore');
    if (fs.existsSync(gitignorePath)) {
        const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
        if (!gitignoreContent.includes('.quartz')) {
            logger.info(t('init.gitignoreReminder'));
            console.log(logger.text.dim(`  echo ".quartz/quartz.jsonc" >> .gitignore`));
            logger.line();
        }
    }
}