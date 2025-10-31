//app/core/enums.ts

/**
 * Command verb enumeration
 * Defines all possible action verbs in the command system
 */
export enum CommandVerb {
    INIT = 'init',
    CREATE = 'create',
    DELETE = 'delete',
    LIST = 'list',
    SHOW = 'show',
    SET = 'set',
    GET = 'get',
    UPDATE = 'update',
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
    VERSION = 'version',
}