//app/core/models.ts
/**
 * @fileoverview Core type definitions and models
 * @description Consolidated type definitions for the command system
 */

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
    VERSION = 'version'
}

/**
 * Command handler function type
 */
export type CommandHandler = (context: ExecutionContext) => Promise<void> | void;

/**
 * Command middleware function type
 */
export type CommandMiddleware = (context: ExecutionContext, next: () => Promise<void>) => Promise<void>;

/**
 * Parameter definition interface
 * Defines a single parameter in a command
 */
export interface ParameterDefinition {
    /** Parameter name */
    name: string;
    /** Parameter type for validation */
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    /** Whether the parameter is required */
    required: boolean;
    /** Default value if not provided */
    defaultValue?: any;
    /** Parameter description for help */
    description: string;
    /** Parameter aliases (short forms) */
    aliases?: string[];
    /** Validation function */
    validator?: (value: any) => boolean | string;
}

/**
 * Command definition interface
 * Defines a complete command with verb, object, and parameters
 */
export interface CommandDefinition {
    /** Command verb */
    verb: CommandVerb;
    /** Command object */
    object: CommandObject;
    /** Command description */
    description: string;
    /** Parameter definitions */
    parameters: ParameterDefinition[];
    /** Command examples */
    examples: string[];
    /** Command handler function */
    handler: CommandHandler;
    /** Command category for grouping */
    category?: string;
    /** Whether the command is deprecated */
    deprecated?: boolean;
    /** Deprecation message */
    deprecationMessage?: string;
}

/**
 * Parsed command interface
 * Represents a command after parsing
 */
export interface ParsedCommand {
    /** Original raw command */
    raw: string[];
    /** Parsed verb */
    verb: CommandVerb;
    /** Parsed object */
    object: CommandObject;
    /** Parsed parameters */
    parameters: Record<string, any>;
    /** Original arguments */
    args: string[];
}

/**
 * Command execution context
 * Provides context for command execution
 */
export interface ExecutionContext {
    /** Parsed command */
    command: ParsedCommand;
    /** Global configuration */
    config: any;
    /** Logger instance */
    logger: any;
    /** I18n translator */
    t: any;
    /** Working directory */
    cwd: string;
    /** Environment variables */
    env: Record<string, string>;
}

/**
 * Command validation result
 */
export interface ValidationResult {
    /** Whether validation passed */
    valid: boolean;
    /** Error messages if validation failed */
    errors: string[];
    /** Warnings if any */
    warnings: string[];
}

/**
 * Command registry interface
 * Manages command registration and lookup
 */
export interface ICommandRegistry {
    /** Register a new command */
    register(command: CommandDefinition): void;

    /** Unregister a command */
    unregister(verb: CommandVerb, object: CommandObject): void;

    /** Get a command definition */
    get(verb: CommandVerb, object: CommandObject): CommandDefinition | undefined;

    /** List all commands */
    list(): CommandDefinition[];

    /** Find commands by verb */
    findByVerb(verb: CommandVerb): CommandDefinition[];

    /** Find commands by object */
    findByObject(object: CommandObject): CommandDefinition[];

    /** Find commands by category */
    findByCategory(category: string): CommandDefinition[];
}

/**
 * Command parser interface
 */
export interface ICommandParser {
    /** Parse command arguments */
    parse(args: string[]): ParsedCommand;

    /** Validate parsed command */
    validate(command: ParsedCommand): ValidationResult;

    /** Generate help for command */
    generateHelp(verb?: CommandVerb, object?: CommandObject): string;
}

/**
 * Command dispatcher interface
 */
export interface ICommandDispatcher {
    /** Dispatch a command for execution */
    dispatch(command: ParsedCommand, context: ExecutionContext): Promise<void>;

    /** Add middleware */
    use(middleware: CommandMiddleware): void;
}

/**
 * Command execution result
 */
export interface ExecutionResult {
    /** Whether execution was successful */
    success: boolean;
    /** Result data */
    data?: any;
    /** Error message if failed */
    error?: string;
    /** Execution time in milliseconds */
    executionTime: number;
}