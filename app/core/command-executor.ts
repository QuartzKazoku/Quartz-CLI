//app/core/command-executor.ts

import {CommandMiddleware} from "@/app/core/types";
import {CommandDefinition, ExecutionContext, ExecutionResult, ParsedCommand} from "@/app/core/interfaces";

/**
 * Command Executor Implementation
 * Handles command execution with middleware support
 */
export class CommandExecutor {
  private middlewares: CommandMiddleware[] = [];

  /**
   * Add middleware to the execution chain
   */
  use(middleware: CommandMiddleware): void {
    this.middlewares.push(middleware);
  }

  /**
   * Execute a command with context
   */
  async execute(
    command: CommandDefinition, 
    parsedCommand: ParsedCommand, 
    context: ExecutionContext
  ): Promise<ExecutionResult> {
    const startTime = Date.now();

    try {
      // Create execution context with command info
      const executionContext: ExecutionContext = {
        ...context,
        command: parsedCommand,
      };

      // Execute middleware chain
      await this.executeMiddlewareChain(executionContext, () => 
        this.executeCommand(command, executionContext)
      );

      const executionTime = Date.now() - startTime;
      
      return {
        success: true,
        executionTime,
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        executionTime,
      };
    }
  }

  /**
   * Execute middleware chain
   */
  private async executeMiddlewareChain(
    context: ExecutionContext, 
    finalHandler: () => Promise<void>
  ): Promise<void> {
    let index = 0;

    const next = async (): Promise<void> => {
      if (index >= this.middlewares.length) {
        await finalHandler();
        return;
      }

      const middleware = this.middlewares[index++];
      await middleware(context, next);
    };

    await next();
  }

  /**
   * Execute the actual command handler
   */
  private async executeCommand(
    command: CommandDefinition, 
    context: ExecutionContext
  ): Promise<void> {
    // Check if command is deprecated
    if (command.deprecated) {
      const warning = command.deprecationMessage || 
        `Command "${command.verb} ${command.object}" is deprecated`;
      context.logger.warn(warning);
    }

    // Execute the command handler
    await command.handler(context);
  }

  /**
   * Remove all middleware (for testing)
   */
  clearMiddleware(): void {
    this.middlewares = [];
  }

  /**
   * Get middleware count
   */
  getMiddlewareCount(): number {
    return this.middlewares.length;
  }
}

/**
 * Built-in middleware implementations
 */
export class BuiltinMiddleware {
  /**
   * Logging middleware - logs command execution
   */
  static logging(): CommandMiddleware {
    return async (context: ExecutionContext, next: () => Promise<void>) => {
      const { verb, object, parameters } = context.command;
      context.logger.info(`Executing: ${verb} ${object}`, parameters);
      
      const startTime = Date.now();
      try {
        await next();
        const duration = Date.now() - startTime;
        context.logger.success(`Command completed in ${duration}ms`);
      } catch (error) {
        const duration = Date.now() - startTime;
        context.logger.error(`Command failed after ${duration}ms:`, error);
        throw error;
      }
    };
  }

  /**
   * Validation middleware - validates execution context
   */
  static validation(): CommandMiddleware {
    return async (context: ExecutionContext, next: () => Promise<void>) => {
      // Validate context
      if (!context.command) {
        throw new Error('No command provided in execution context');
      }

      if (!context.config) {
        throw new Error('No configuration provided in execution context');
      }

      if (!context.logger) {
        throw new Error('No logger provided in execution context');
      }

      if (!context.t) {
        throw new Error('No translator provided in execution context');
      }

      await next();
    };
  }

  /**
   * Error handling middleware - provides consistent error handling
   */
  static errorHandling(): CommandMiddleware {
    return async (context: ExecutionContext, next: () => Promise<void>) => {
      try {
        await next();
      } catch (error) {
        // Log the error
        context.logger.error('Command execution failed:', error);

        // Provide user-friendly error message
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        // Check for common error patterns and provide helpful suggestions
        if (errorMessage.includes('ENOENT')) {
          context.logger.error('File or directory not found. Please check your paths.');
        } else if (errorMessage.includes('EACCES')) {
          context.logger.error('Permission denied. Please check file permissions.');
        } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
          context.logger.error('Network error. Please check your internet connection.');
        } else if (errorMessage.includes('API') || errorMessage.includes('token')) {
          context.logger.error('API error. Please check your configuration and tokens.');
        }

        // Re-throw the error for higher-level handling
        throw error;
      }
    };
  }

  /**
   * Performance monitoring middleware - tracks execution time
   */
  static performanceMonitoring(): CommandMiddleware {
    return async (context: ExecutionContext, next: () => Promise<void>) => {
      const startTime = process.hrtime.bigint();
      
      try {
        await next();
      } finally {
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
        
        if (duration > 5000) { // 5 seconds
          context.logger.warn(`Slow command detected: ${duration.toFixed(2)}ms`);
        }
        
        // Could send metrics to monitoring service here
        context.logger.debug(`Command execution time: ${duration.toFixed(2)}ms`);
      }
    };
  }

  /**
   * Configuration validation middleware - validates config before execution
   */
  static configValidation(): CommandMiddleware {
    return async (context: ExecutionContext, next: () => Promise<void>) => {
      const { verb, object } = context.command;
      
      // Check for required configuration based on command type
      switch (object) {
        case 'commit':
        case 'review':
          if (!context.config.openai?.apiKey) {
            throw new Error('OpenAI API key is required for this command. Run "quartz set openai.apiKey <key>" to configure.');
          }
          if (!context.config.openai?.model) {
            throw new Error('OpenAI model is required for this command. Run "quartz set openai.model <model>" to configure.');
          }
          break;

        case 'pr':
          if (!context.config.openai?.apiKey) {
            throw new Error('OpenAI API key is required for this command. Run "quartz set openai.apiKey <key>" to configure.');
          }
          if (!context.config.openai?.model) {
            throw new Error('OpenAI model is required for this command. Run "quartz set openai.model <model>" to configure.');
          }
          if (!context.config.platforms || context.config.platforms.length === 0) {
            throw new Error('Platform configuration is required for this command. Run "quartz set platform <type>" to configure.');
          }
          break;

        case 'branch':
          if (!context.config.platforms || context.config.platforms.length === 0) {
            throw new Error('Platform configuration is required for this command. Run "quartz set platform <type>" to configure.');
          }
          break;
      }

      await next();
    };
  }

  /**
   * Git repository validation middleware - ensures we're in a git repo when needed
   */
  static gitValidation(): CommandMiddleware {
    return async (context: ExecutionContext, next: () => Promise<void>) => {
      const { object } = context.command;
      
      const gitRequiredObjects = ['branch', 'commit', 'pr', 'review'];
      
      if (gitRequiredObjects.includes(object)) {
        try {
          // Import GitExecutor dynamically to avoid circular dependencies
          const { GitExecutor } = await import('@/utils/git');
          
          // Try to get git repository info to check if we're in a git repo
          const repoInfo = await GitExecutor.getRepoInfo();
          
          if (!repoInfo) {
            throw new Error('This command must be run in a Git repository.');
          }
        } catch (error) {
          if (error instanceof Error) {
            throw error;
          }
          throw new Error('Failed to validate Git repository status.');
        }
      }

      await next();
    };
  }

  /**
   * Dry run middleware - simulates execution without making changes
   */
  static dryRun(): CommandMiddleware {
    return async (context: ExecutionContext, next: () => Promise<void>) => {
      const { parameters } = context.command;
      
      if (parameters.dryRun || parameters['dry-run']) {
        context.logger.info('🔍 DRY RUN MODE - No changes will be made');
        context.logger.info(`Would execute: ${context.command.verb} ${context.command.object}`);
        context.logger.info('Parameters:', parameters);
        
        // Don't execute the actual command
        return;
      }

      await next();
    };
  }

  /**
   * Confirmation middleware - asks for user confirmation for destructive operations
   */
  static confirmation(): CommandMiddleware {
    return async (context: ExecutionContext, next: () => Promise<void>) => {
      const { verb, object, parameters } = context.command;
      
      const destructiveVerbs = ['delete', 'remove', 'reset'];
      const isDestructive = destructiveVerbs.includes(verb);
      
      if (isDestructive && !parameters.force && !parameters.f) {
        const { confirm } = await import('@/utils/enquirer');
        
        const confirmed = await confirm(
          `Are you sure you want to ${verb} ${object}? This action cannot be undone.`,
          false
        );
        
        if (!confirmed) {
          context.logger.info('Operation cancelled by user.');
          return;
        }
      }

      await next();
    };
  }
}

/**
 * Global command executor instance
 */
export const commandExecutor = new CommandExecutor();