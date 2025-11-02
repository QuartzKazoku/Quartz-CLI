//app/core/dispatcher.ts
import { 
  CommandMiddleware,
} from './models';
import { commandExecutor, BuiltinMiddleware } from './executor';
import { commandParser } from './parser';
import { commandRegistry } from './registry';
import type {CommandDefinition, ExecutionContext, ICommandDispatcher, ParsedCommand} from "@/types";

/**
 * Main Command Dispatcher Implementation
 * Integrates parsing, validation, and execution
 */
export class CommandDispatcher implements ICommandDispatcher {
  private readonly executor = commandExecutor;
  private readonly parser = commandParser;
  private readonly registry = commandRegistry;

  /**
   * Dispatch a command for execution
   */
  async dispatch(command: ParsedCommand, context: ExecutionContext): Promise<void> {
    // Get command definition
    const commandDef = this.registry.get(command.verb, command.object);
    if (!commandDef) {
      throw new Error(`Command not found: ${command.verb} ${command.object}`);
    }

    // Execute the command
    const result = await this.executor.execute(commandDef, command, context);
    
    if (!result.success) {
      throw new Error(result.error || 'Command execution failed');
    }
  }

  /**
   * Add middleware to the execution chain
   */
  use(middleware: CommandMiddleware): void {
    this.executor.use(middleware);
  }

  /**
   * Parse and dispatch a command from raw arguments
   */
  async parseAndDispatch(
    args: string[], 
    context: ExecutionContext
  ): Promise<void> {
    // Parse command
    const parseResult = this.parser.parseAndValidate(args);
    
    if (!parseResult.validation.valid) {
      const errorMessage = parseResult.validation.errors.join('; ');
      throw new Error(`Command parsing failed: ${errorMessage}`);
    }

    if (!parseResult.command) {
      throw new Error('Failed to parse command');
    }

    // Show warnings if any
    if (parseResult.validation.warnings.length > 0) {
      for (const warning of parseResult.validation.warnings) {
        context.logger.warn(warning);
      }
    }

    // Dispatch the command
    await this.dispatch(parseResult.command, context);
  }

  /**
   * Generate help for commands
   */
  generateHelp(verb?: string, object?: string): string {
    if (verb && object) {
      return this.parser.generateHelp(verb as any, object as any);
    } else if (verb) {
      return this.parser.generateHelp(verb as any);
    } else {
      return this.parser.generateHelp();
    }
  }

  /**
   * Get command suggestions for autocomplete
   */
  getSuggestions(partialArgs: string[]): string[] {
    return this.parser.getSuggestions(partialArgs);
  }

  /**
   * Setup default middleware
   */
  setupDefaultMiddleware(): void {
    // Add built-in middleware in order
    this.executor.use(BuiltinMiddleware.validation());
    this.executor.use(BuiltinMiddleware.configValidation());
    this.executor.use(BuiltinMiddleware.gitValidation());
    this.executor.use(BuiltinMiddleware.confirmation());
    this.executor.use(BuiltinMiddleware.dryRun());
    this.executor.use(BuiltinMiddleware.errorHandling());
    this.executor.use(BuiltinMiddleware.logging());
    this.executor.use(BuiltinMiddleware.performanceMonitoring());
  }

  /**
   * Get command statistics
   */
  getStats(): {
    totalCommands: number;
    verbsCount: number;
    objectsCount: number;
    categoriesCount: number;
  } {
    return this.registry.getStats();
  }

  /**
   * List all available commands
   */
  listCommands(): string[] {
    const commands = this.registry.list();
    return commands.map(cmd => `${cmd.verb} ${cmd.object}`);
  }

  /**
   * Check if a command exists
   */
  hasCommand(verb: string, object: string): boolean {
    return this.registry.has(verb as any, object as any);
  }

  /**
   * Get command definition
   */
  getCommand(verb: string, object: string): CommandDefinition | undefined {
    return this.registry.get(verb as any, object as any);
  }

  /**
   * Validate command without executing
   */
  validateCommand(args: string[]): { valid: boolean; errors: string[]; warnings: string[] } {
    const result = this.parser.parseAndValidate(args);
    return result.validation;
  }

  /**
   * Get available verbs
   */
  getAvailableVerbs(): string[] {
    return this.registry.getAvailableVerbs();
  }

  /**
   * Get available objects
   */
  getAvailableObjects(): string[] {
    return this.registry.getAvailableObjects();
  }

  /**
   * Get available categories
   */
  getAvailableCategories(): string[] {
    return this.registry.getAvailableCategories();
  }

  /**
   * Find commands by category
   */
  getCommandsByCategory(category: string): CommandDefinition[] {
    return this.registry.findByCategory(category);
  }

  /**
   * Find commands by verb
   */
  getCommandsByVerb(verb: string): CommandDefinition[] {
    return this.registry.findByVerb(verb as any);
  }

  /**
   * Find commands by object
   */
  getCommandsByObject(object: string): CommandDefinition[] {
    return this.registry.findByObject(object as any);
  }
}

/**
 * Global command dispatcher instance
 */
export const commandDispatcher = new CommandDispatcher();

// Setup default middleware
commandDispatcher.setupDefaultMiddleware();