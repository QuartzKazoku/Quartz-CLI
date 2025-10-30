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
  // Check if migration is needed
  if (!needsMigration()) {
    return;
  }
  
  logger.line();
  logger.warn(t('migration.detected'));
  logger.info(t('migration.starting'));
  
  try {
    const result = await runMigrations();
    
    if (result.migrated) {
      logger.line();
      logger.success(t('migration.success', {
        from: result.fromVersion,
        to: result.toVersion,
      }));
      
      if (result.appliedMigrations.length > 0) {
        logger.info(t('migration.applied'));
        for (const version of result.appliedMigrations) {
          logger.log(`  - ${version}`);
        }
      }
      
      logger.line();
    }
    
    if (result.errors && result.errors.length > 0) {
      logger.line();
      logger.error(t('migration.errors'));
      for (const error of result.errors) {
        logger.error(`  - ${error}`);
      }
      logger.line();
      throw new Error('Migration failed');
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