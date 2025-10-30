//utils/hooks.ts
/**
 * Pre-command hooks for automatic migrations and checks
 */

import { needsMigration, runMigrations } from '@/utils/migration';
import '@/utils/migrations'; // Import to register all migrations
import { logger } from '@/utils/logger';
import { t } from '@/i18n';

/**
 * Check and run migrations if needed before executing commands
 * This should be called before any command that requires config
 */
export async function checkAndMigrate(): Promise<void> {
  // Check both project and global configs for migration
  const needsProjectMigration = needsMigration(false);
  const needsGlobalMigration = needsMigration(true);
  
  if (!needsProjectMigration && !needsGlobalMigration) {
    return;
  }
  
  logger.line();
  logger.warn(t('migration.detected'));
  logger.info(t('migration.starting'));
  
  try {
    // Migrate global config first if needed
    if (needsGlobalMigration) {
      logger.info('Migrating global configuration...');
      const globalResult = await runMigrations(true);
      
      if (globalResult.migrated) {
        logger.line();
        logger.success(t('migration.success', {
          from: globalResult.fromVersion,
          to: globalResult.toVersion,
        }) + ' (Global)');
        
        if (globalResult.appliedMigrations.length > 0) {
          logger.info(t('migration.applied'));
          for (const version of globalResult.appliedMigrations) {
            logger.log(`  - ${version}`);
          }
        }
        
        logger.line();
      }
      
      if (globalResult.errors && globalResult.errors.length > 0) {
        logger.line();
        logger.error(t('migration.errors') + ' (Global)');
        for (const error of globalResult.errors) {
          logger.error(`  - ${error}`);
        }
        logger.line();
        throw new Error('Global migration failed');
      }
    }
    
    // Migrate project config if needed
    if (needsProjectMigration) {
      logger.info('Migrating project configuration...');
      const projectResult = await runMigrations(false);
      
      if (projectResult.migrated) {
        logger.line();
        logger.success(t('migration.success', {
          from: projectResult.fromVersion,
          to: projectResult.toVersion,
        }) + ' (Project)');
        
        if (projectResult.appliedMigrations.length > 0) {
          logger.info(t('migration.applied'));
          for (const version of projectResult.appliedMigrations) {
            logger.log(`  - ${version}`);
          }
        }
        
        logger.line();
      }
      
      if (projectResult.errors && projectResult.errors.length > 0) {
        logger.line();
        logger.error(t('migration.errors') + ' (Project)');
        for (const error of projectResult.errors) {
          logger.error(`  - ${error}`);
        }
        logger.line();
        throw new Error('Project migration failed');
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(t('migration.failed', { error: errorMessage }));
    throw error;
  }
}

/**
 * Commands that should skip migration check
 * These are commands that don't require config or are init-related
 */
const SKIP_MIGRATION_COMMANDS = new Set(['init', 'help', '--help', '-h', '--version', '-v']);

/**
 * Check if the command should skip migration
 */
export function shouldSkipMigration(command?: string): boolean {
    if (!command) return true;
    return SKIP_MIGRATION_COMMANDS.has(command);
}