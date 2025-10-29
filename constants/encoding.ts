/**
 * @fileoverview Encoding and formatting constants for Quartz CLI
 * @description Defines encoding types and JSON formatting options
 * @author Quartz CLI Team
 * @version 1.0.0
 * @since 2025-10-29
 * @license MIT
 * @copyright (c) 2025 Quartz
 *
 * @example
 *   import { ENCODING, JSON_FORMAT } from '@/constants/encoding';
 *   fs.readFileSync(path, ENCODING.UTF8);
 *   JSON.stringify(data, null, JSON_FORMAT.INDENT);
 *
 * @namespace EncodingConstants
 * @module constants/encoding
 */

/**
 * File encoding constants
 * Defines standard encoding types for file operations
 * @type {object}
 * @readonly
 * @property {string} UTF8 - UTF-8 encoding identifier
 */
export const ENCODING = {
    /** UTF-8 encoding identifier for file operations */
    UTF8: 'utf-8',
} as const;

/**
 * JSON formatting constants
 * Defines formatting options for JSON.stringify operations
 * @type {object}
 * @readonly
 * @property {number} INDENT - Number of spaces for JSON indentation
 */
export const JSON_FORMAT = {
    /** Number of spaces for JSON indentation (2 spaces) */
    INDENT: 2,
} as const;