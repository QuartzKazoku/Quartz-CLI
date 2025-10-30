//types/migration.ts
/**
 * Migration system type definitions
 */

/**
 * Migration function type
 * @param config - Current configuration object
 * @returns Migrated configuration object
 */
export type MigrationFunction = (config: any) => any;

/**
 * Migration definition
 */
export interface Migration {
  /** Version to migrate to (e.g., "1.2.0") */
  version: string;
  /** Migration description */
  description: string;
  /** Migration function */
  migrate: MigrationFunction;
}

/**
 * Migration result
 */
export interface MigrationResult {
  /** Whether migration was performed */
  migrated: boolean;
  /** Original version */
  fromVersion: string;
  /** Target version */
  toVersion: string;
  /** Applied migrations */
  appliedMigrations: string[];
  /** Any errors encountered */
  errors?: string[];
}

/**
 * Version metadata in config file
 */
export interface VersionMetadata {
  /** Configuration schema version */
  configVersion: string;
  /** CLI version that created/updated this config */
  cliVersion: string;
  /** Last update timestamp */
  updatedAt: string;
  /** Currently active profile name */
  activeProfile?: string;
}