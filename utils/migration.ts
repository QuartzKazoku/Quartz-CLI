//cli/utils/migration.ts
import fs from 'node:fs';
import path from 'node:path';
import {parse as parseJsonc} from 'jsonc-parser';
import type {Migration, MigrationResult, VersionMetadata} from '@/types/migration';
import {logger} from '@/utils/logger';
import {getQuartzPath} from '@/utils/path';
import {VERSION, ENCODING, JSON_FORMAT} from '@/constants';

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
 * Get current CLI version from package.json
 */
function getCliVersion(): string {
  try {
    const packageJsonPath = path.join(__dirname, '../../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, ENCODING.UTF8));
    return packageJson.version || VERSION.INITIAL_CLI;
  } catch {
    return VERSION.INITIAL_CLI;
  }
}

/**
 * Read version metadata from config file
 */
export function readVersionMetadata(): VersionMetadata | null {
  const quartzPath = getQuartzPath();
  
  if (!fs.existsSync(quartzPath)) {
    return null;
  }
  
  try {
    const content = fs.readFileSync(quartzPath, ENCODING.UTF8);
    const data = parseJsonc(content);
    
    if (data._metadata) {
      return data._metadata;
    }
    
    // No metadata means it's an old config (version 0.0.0)
    return {
      configVersion: VERSION.LEGACY_CONFIG,
      cliVersion: VERSION.LEGACY_CONFIG,
      updatedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

/**
 * Write version metadata to config file
 */
export function writeVersionMetadata(metadata: VersionMetadata): void {
  const quartzPath = getQuartzPath();
  
  if (!fs.existsSync(quartzPath)) {
    return;
  }
  
  try {
    const content = fs.readFileSync(quartzPath, ENCODING.UTF8);
    const data = parseJsonc(content);
    
    data._metadata = metadata;
    
    fs.writeFileSync(quartzPath, JSON.stringify(data, null, JSON_FORMAT.INDENT), ENCODING.UTF8);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Failed to write version metadata: ${errorMessage}`);
  }
}

/**
 * Check if migration is needed
 */
export function needsMigration(): boolean {
  const metadata = readVersionMetadata();
  
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
  const metadata = readVersionMetadata();
  
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
  
  const quartzPath = getQuartzPath();
  const content = fs.readFileSync(quartzPath, ENCODING.UTF8);
  let config = parseJsonc(content);
  
  const appliedMigrations: string[] = [];
  const errors: string[] = [];
  
  // Apply migrations sequentially
  for (const migration of migrationsToApply) {
    try {
      logger.info(`Applying migration: ${migration.version} - ${migration.description}`);
      config = migration.migrate(config);
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
    config._metadata = {
      configVersion: CURRENT_CONFIG_VERSION,
      cliVersion: getCliVersion(),
      updatedAt: new Date().toISOString(),
  };
  
  // Write migrated config
  try {
    fs.writeFileSync(quartzPath, JSON.stringify(config, null, JSON_FORMAT.INDENT), ENCODING.UTF8);
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

/**
 * Initialize version metadata for new config files
 */
export function initializeVersionMetadata(): VersionMetadata {
  const metadata: VersionMetadata = {
    configVersion: CURRENT_CONFIG_VERSION,
    cliVersion: getCliVersion(),
    updatedAt: new Date().toISOString(),
  };
  
  writeVersionMetadata(metadata);
  return metadata;
}