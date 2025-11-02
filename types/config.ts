//types/config.ts
/**
 * @fileoverview Configuration type definitions
 * @description Defines all configuration-related types for Quartz CLI
 * @author Quartz CLI Team
 * @version 1.0.0
 * @since 2025-11-02
 * @license MIT
 */

import type { PlatformType } from './enums';
import type { VersionMetadata } from './migration';

/**
 * Platform configuration interface
 */
export interface PlatformConfig {
  type: PlatformType;
  url?: string;
  token: string;
}

/**
 * Language configuration interface
 */
export interface LanguageConfig {
  ui: string;        // UI language (QUARTZ_LANG)
  prompt: string;    // Prompt language (PROMPT_LANG)
}

/**
 * OpenAI configuration interface
 */
export interface OpenAIConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

/**
 * Quartz configuration structure
 */
export interface QuartzConfig {
  openai: OpenAIConfig;
  platforms: PlatformConfig[];
  language: LanguageConfig;
}

/**
 * Profile structure in config file
 */
export interface QuartzProfile {
  name: string;
  config: QuartzConfig;
}

/**
 * Configuration file structure with version metadata
 */
export interface QuartzConfigFile {
  /** Version metadata for migration tracking */
  _metadata?: VersionMetadata;
  /** Default profile */
  default: QuartzProfile;
  /** Additional profiles */
  [profileName: string]: QuartzProfile | VersionMetadata | undefined;
}

/**
 * Subcommand processor definitions
 */
export type CommandHandler = (args: string[], isGlobal: boolean) => Promise<void> | void;
