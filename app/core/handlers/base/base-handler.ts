//app/core/handlers/base/base-handler.ts

import {ExecutionContext} from "@/app/core/interfaces";

/**
 * Base command handler interface
 * All command handlers must implement this interface
 */
export interface ICommandHandler {
    /**
     * Execute the command with given context
     */
    execute(context: ExecutionContext): Promise<void> | void;
}

/**
 * Abstract base handler class
 * Provides common functionality for all handlers
 */
export abstract class BaseHandler implements ICommandHandler {
    protected readonly context: ExecutionContext;

    constructor(context: ExecutionContext) {
        this.context = context;
    }

    /**
     * Execute the command - must be implemented by subclasses
     */
    abstract execute(): Promise<void> | void;

    /**
     * Get logger from context
     */
    protected get logger() {
        return this.context.logger;
    }

    /**
     * Get translator from context
     */
    protected get t() {
        return this.context.t;
    }

    /**
     * Get config from context
     */
    protected get config() {
        return this.context.config;
    }

    /**
     * Get command from context
     */
    protected get command() {
        return this.context.command;
    }

    /**
     * Get working directory from context
     */
    protected get cwd() {
        return this.context.cwd;
    }

    /**
     * Get environment variables from context
     */
    protected get env() {
        return this.context.env;
    }

    /**
     * Validate required arguments
     */
    protected validateRequiredArgs(minArgs: number, errorMessage?: string): void {
        const args = this.command.args || [];
        if (args.length < minArgs) {
            const message = errorMessage || `At least ${minArgs} argument(s) required`;
            this.logger.error(message);
            throw new Error(message);
        }
    }

    /**
     * Get parameter value with default
     */
    protected getParameter<T = string>(name: string, defaultValue: T): T {
        return (this.command.parameters[name] as T) ?? defaultValue;
    }

    /**
     * Check if parameter exists
     */
    protected hasParameter(name: string): boolean {
        return name in this.command.parameters;
    }

    /**
     * Get argument by index
     */
    protected getArg(index: number): string | undefined {
        const args = this.command.args || [];
        return args[index];
    }

    /**
     * Get all arguments
     */
    protected getArgs(): string[] {
        return this.command.args || [];
    }
}