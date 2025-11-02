//types/changelog.ts
/**
 * @fileoverview Changelog type definitions
 * @description Defines types for changelog generation and management
 * @author Quartz CLI Team
 * @version 1.0.0
 * @since 2025-11-02
 * @license MIT
 */

/**
 * Parsed command-line arguments for changelog operations
 */
export interface ParsedArgs {
    /** Target version for changelog */
    version?: string;
    /** Start commit/tag for changelog range */
    from?: string;
    /** End commit/tag for changelog range */
    to?: string;
    /** Output file path for changelog */
    output?: string;
    /** Preview mode without writing to file */
    preview?: boolean;
}

/**
 * Changelog entry type
 */
export interface ChangelogEntry {
    /** Commit hash */
    hash: string;
    /** Commit type (feat, fix, etc.) */
    type: string;
    /** Commit scope */
    scope?: string;
    /** Commit subject/title */
    subject: string;
    /** Commit body */
    body?: string;
    /** Breaking change flag */
    breaking?: boolean;
    /** Commit author */
    author?: string;
    /** Commit date */
    date?: string;
}

/**
 * Changelog section grouped by type
 */
export interface ChangelogSection {
    /** Section title */
    title: string;
    /** Entries in this section */
    entries: ChangelogEntry[];
}

/**
 * Complete changelog structure
 */
export interface Changelog {
    /** Version number */
    version: string;
    /** Release date */
    date: string;
    /** Grouped sections */
    sections: ChangelogSection[];
    /** Breaking changes summary */
    breaking?: ChangelogEntry[];
}