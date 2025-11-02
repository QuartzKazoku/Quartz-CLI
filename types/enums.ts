//types/enums.ts
/**
 * @fileoverview Core enumeration definitions
 * @description Centralizes all enumerations used across the system for better type safety
 * @author Quartz CLI Team
 * @version 1.0.0
 * @since 2025-11-02
 * @license MIT
 */

/**
 * Command verb enumeration
 * Defines all possible action verbs in the command system
 * @enum {string}
 */
export enum CommandVerb {
    INIT = 'init',
    CREATE = 'create',
    DELETE = 'delete',
    LIST = 'list',
    SHOW = 'show',
    SET = 'set',
    GET = 'get',
    GENERATE = 'generate',
    REVIEW = 'review',
    COMMIT = 'commit',
    USE = 'use',
    SAVE = 'save',
    LOAD = 'load',
    MANAGE = 'manage',
    HELP = 'help',
    VERSION = 'version',
}

/**
 * Command object enumeration
 * Defines all possible target objects in the command system
 * @enum {string}
 */
export enum CommandObject {
    PROJECT = 'project',
    CONFIG = 'config',
    PROFILE = 'profile',
    BRANCH = 'branch',
    COMMIT = 'commit',
    PR = 'pr',
    REVIEW = 'review',
    CHANGELOG = 'changelog',
    TOKEN = 'token',
    LANGUAGE = 'language',
    PLATFORM = 'platform',
    HELP = 'help',
    VERSION = 'version'
}

/**
 * Platform type enumeration
 * Defines supported Git platforms
 * @enum {string}
 */
export enum PlatformType {
    GITHUB = 'github',
    GITLAB = 'gitlab',
}

/**
 * Parameter type enumeration
 * Defines valid parameter types for command validation
 * @enum {string}
 */
export enum ParameterType {
    STRING = 'string',
    NUMBER = 'number',
    BOOLEAN = 'boolean',
    ARRAY = 'array',
    OBJECT = 'object',
}