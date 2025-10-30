/**
 * @fileoverview CLI-related constants for Quartz CLI
 * @description Defines CLI argument parsing and command-line interface constants
 * @author Quartz CLI Team
 * @version 1.0.0
 * @since 2025-10-29
 * @license MIT
 * @copyright (c) 2025 Quartz
 *
 * @example
 *   import { CLI } from '@/constants/cli';
 *   const args = process.argv.slice(CLI.ARGS_START_INDEX);
 *
 * @namespace CLIConstants
 * @module constants/cli
 */

/**
 * CLI argument parsing constants
 * Defines indices and positions for command-line argument parsing
 * @type {object}
 * @readonly
 * @property {number} ARGS_START_INDEX - Starting index for user arguments in process.argv (skips node and script path)
 */
export const CLI = {
    /** Starting index for user arguments in process.argv (skips 'node' and 'script.js') */
    ARGS_START_INDEX: 2,
} as const;