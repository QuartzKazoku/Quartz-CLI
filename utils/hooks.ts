//utils/hooks.ts
/**
 * Pre-command hooks for automatic migrations and checks
 */

import {needsMigration, runMigrations} from '@/utils/migration';
import '@/utils/migrations'; // Import to register all migrations
import {logger} from '@/utils/logger';
import {t} from '@/i18n';
import {MigrationResult} from "@/types/migration";

/**
 * Run migrations for a given scope (global or project) and handle logging.
 *
 * @param isGlobal - true = global config, false = project config
 * @returns the MigrationResult returned by runMigrations
 * @throws Error when migration reports errors (the caller may catch and rethrow)
 */
async function runAndLogMigration(isGlobal: boolean): Promise<MigrationResult> {
    const scopeName = isGlobal ? 'Global' : 'Project';
    logger.info(`Migrating ${scopeName.toLowerCase()} configuration...`);
    const result: MigrationResult = await runMigrations(isGlobal);

    if (result.migrated) {
        logger.line();
        logger.success(
            t('migration.success', {
                from: result.fromVersion,
                to: result.toVersion,
            }) + ` (${scopeName})`
        );

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
        logger.error(t('migration.errors') + ` (${scopeName})`);
        for (const error of result.errors) {
            logger.error(`  - ${error}`);
        }
        logger.line();
        throw new Error(`${scopeName} migration failed`);
    }

    return result;
}

/**
 * Check whether any migration is required for either project or global config.
 *
 * This function centralizes the two needsMigration calls so callers don't repeat them.
 *
 * @returns an object with boolean flags for project/global migration needs
 */
function checkMigrationNeeds(): { project: boolean; global: boolean } {
    const project = needsMigration(false);
    const global = needsMigration(true);
    return {project, global};
}

/**
 * Orchestrates migration for a specific scope only when needed.
 *
 * @param isGlobal - true for global config, false for project config
 * @returns void
 * @throws Error if migration for the given scope fails
 */
async function migrateIfNeeded(isGlobal: boolean): Promise<void> {
    const needs = needsMigration(isGlobal);
    if (!needs) return;

    await runAndLogMigration(isGlobal);
}

/**
 * Check and run migrations if needed before executing commands.
 *
 * Call this before any command that requires configuration to ensure both
 * global and project configurations are migrated and consistent.
 *
 * @example
 * await checkAndMigrate();
 *
 * @throws Error when either global or project migration fails (error is logged and rethrown)
 */
export async function checkAndMigrate(): Promise<void> {
    const {project: needsProjectMigration, global: needsGlobalMigration} = checkMigrationNeeds();

    if (!needsProjectMigration && !needsGlobalMigration) {
        return;
    }

    logger.line();
    logger.warn(t('migration.detected'));
    logger.info(t('migration.starting'));

    try {
        // migrate global first (if required) then project
        if (needsGlobalMigration) {
            await migrateIfNeeded(true);
        }

        if (needsProjectMigration) {
            await migrateIfNeeded(false);
        }
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        logger.error(t('migration.failed', {error: errorMessage}));
        throw err;
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