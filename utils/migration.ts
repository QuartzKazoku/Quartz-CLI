//cli/utils/migration.ts
import type {Migration, MigrationResult} from '@/types/migration';
import {logger} from '@/utils/logger';
import {getConfigManager} from '@/manager/config';
import {VERSION} from '@/constants';

/**
 * Current configuration schema version
 * Update this when making breaking changes to config structure
 */
export const CURRENT_CONFIG_VERSION = VERSION.CURRENT_CONFIG;

/**
 * Registry of all migrations
 * Migrations are executed in order based on semver comparison
 */
const migrations: Migration[] = [];

/**
 * Register a migration
 */
export function registerMigration(migration: Migration): void {
    migrations.push(migration);
    // Sort migrations by version
    migrations.sort((a, b) => compareVersions(a.version, b.version));
}

/**
 * Compare two semantic versions
 * @returns -1 if a < b, 0 if a === b, 1 if a > b
 */
function compareVersions(a: string, b: string): number {
    const aParts = a.split('.').map(Number);
    const bParts = b.split('.').map(Number);

    for (let i = 0; i < 3; i++) {
        const aVal = aParts[i] || 0;
        const bVal = bParts[i] || 0;
        if (aVal < bVal) return -1;
        if (aVal > bVal) return 1;
    }

    return 0;
}


/**
 * Check if migration is needed
 */
export function needsMigration(): boolean {
    const metadata = getConfigManager().readVersionMetadata();

    if (!metadata) {
        return false;
    }

    return compareVersions(metadata.configVersion, CURRENT_CONFIG_VERSION) < 0;
}

/**
 * Get migrations that need to be applied
 */
function getMigrationsToApply(fromVersion: string): Migration[] {
    return migrations.filter(m => {
        return compareVersions(fromVersion, m.version) < 0 &&
            compareVersions(m.version, CURRENT_CONFIG_VERSION) <= 0;
    });
}

/**
 * Execute migrations
 */
export async function runMigrations(): Promise<MigrationResult> {
    const configManager = getConfigManager();
    const metadata = configManager.readVersionMetadata();

    if (!metadata) {
        return {
            migrated: false,
            fromVersion: 'unknown',
            toVersion: CURRENT_CONFIG_VERSION,
            appliedMigrations: [],
        };
    }

    const fromVersion = metadata.configVersion;
    const migrationsToApply = getMigrationsToApply(fromVersion);

    if (migrationsToApply.length === 0) {
        return {
            migrated: false,
            fromVersion,
            toVersion: CURRENT_CONFIG_VERSION,
            appliedMigrations: [],
        };
    }

    // 使用 ConfigManager 读取配置文件
    let configFile = configManager.readConfigFile();

    const appliedMigrations: string[] = [];
    const errors: string[] = [];

    // Apply migrations sequentially
    for (const migration of migrationsToApply) {
        try {
            logger.info(`Applying migration: ${migration.version} - ${migration.description}`);
            configFile = migration.migrate(configFile);
            appliedMigrations.push(migration.version);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorMsg = `Failed to apply migration ${migration.version}: ${errorMessage}`;
            logger.error(errorMsg);
            errors.push(errorMsg);
            break;
        }
    }

    // Update metadata
    configFile._metadata = {
        configVersion: CURRENT_CONFIG_VERSION,
        cliVersion: configManager.getCliVersion(),
        updatedAt: new Date().toISOString(),
    };

    // Write migrated config using ConfigManager
    try {
        configManager.writeConfigFile(configFile);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push(`Failed to write migrated config: ${errorMessage}`);
    }

    return {
        migrated: appliedMigrations.length > 0,
        fromVersion,
        toVersion: CURRENT_CONFIG_VERSION,
        appliedMigrations,
        errors: errors.length > 0 ? errors : undefined,
    };
}