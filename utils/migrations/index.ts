//cli/utils/migrations/index.ts
/**
 * Migration registry
 * Import and register all migrations here
 */

import { registerMigration } from '@/utils/migration';
import { migration_1_2_0 } from './1.2.0';
import { migration_1_5_0 } from './1.5.0';

/**
 * Register all migrations in order
 */
export function registerAllMigrations(): void {
  registerMigration(migration_1_2_0);
  registerMigration(migration_1_5_0);
  // Add new migrations here
}