//types/index.ts
/**
 * @fileoverview Unified type system entry point
 * @description Centralizes all type definitions for better organization and easier imports
 * @author Quartz CLI Team
 * @version 1.0.0
 * @since 2025-11-02
 * @license MIT
 * 
 * @example
 *   // Import everything from unified entry
 *   import type { CommandVerb, PlatformConfig, QuartzConfig } from '@/types';
 *   
 *   // Or import specific modules
 *   import type { CommandDefinition, ExecutionContext } from '@/types';
 */

// Core enumerations
export * from './enums';

// Command system types
export * from './commands';

// Configuration types
export * from './config';

// Migration types
export * from './migration';

// Changelog types
export * from './changelog';