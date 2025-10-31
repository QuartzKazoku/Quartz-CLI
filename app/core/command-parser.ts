//app/core/command-parser.ts

import { VerbDispatcher } from './verb-dispatcher';
import { ObjectRouter } from './object-router';
import { ParameterParser } from './parameter-parser';
import { commandRegistry } from './registry';
import {ICommandParser, ParsedCommand, ValidationResult} from "@/app/core/interfaces";
import {CommandObject, CommandVerb} from "@/app/core/enums";

/**
 * Main Command Parser Implementation
 * Integrates verb dispatcher, object router, and parameter parser
 */
export class CommandParser implements ICommandParser {
  private readonly verbDispatcher = new VerbDispatcher();
  private readonly objectRouter = new ObjectRouter();
  private readonly parameterParser = new ParameterParser();

  /**
   * Parse command arguments into a structured command
   */
  parse(args: string[]): ParsedCommand {
    if (args.length === 0) {
      throw new Error('No command provided');
    }

    // Parse verb
    const verbResult = this.verbDispatcher.parseVerb(args);
    if (verbResult.error) {
      throw new Error(verbResult.error);
    }

    if (!verbResult.verb) {
      throw new Error('Failed to parse verb');
    }

    // Special handling for help and version commands
    if (verbResult.verb === CommandVerb.HELP || verbResult.verb === CommandVerb.VERSION) {
      // These commands don't require objects
      const defaultObject = verbResult.verb === CommandVerb.HELP ? CommandObject.HELP : CommandObject.VERSION;
      const command = commandRegistry.get(verbResult.verb, defaultObject);
      if (!command) {
        throw new Error(`Command not found: ${verbResult.verb}`);
      }

      // Parse parameters (if any)
      const parameterResult = this.parameterParser.parseParameters(
        verbResult.remainingArgs,
        command.parameters
      );

      if (!parameterResult.validation.valid) {
        const errorMessage = parameterResult.validation.errors.join('; ');
        throw new Error(`Parameter validation failed: ${errorMessage}`);
      }

      return {
        raw: args,
        verb: verbResult.verb,
        object: defaultObject,
        parameters: parameterResult.parameters,
        args: parameterResult.remainingArgs,
      };
    }

    // Parse object for regular commands
    const objectResult = this.objectRouter.parseObject(verbResult.remainingArgs);
    if (objectResult.error) {
      throw new Error(objectResult.error);
    }

    if (!objectResult.object) {
      throw new Error('No object provided');
    }

    // Get command definition
    const command = this.objectRouter.route(verbResult.verb, objectResult.object);
    if (!command) {
      throw new Error(`Command not found: ${verbResult.verb} ${objectResult.object}`);
    }

    // Parse parameters
    const parameterResult = this.parameterParser.parseParameters(
      objectResult.remainingArgs,
      command.parameters
    );

    if (!parameterResult.validation.valid) {
      const errorMessage = parameterResult.validation.errors.join('; ');
      throw new Error(`Parameter validation failed: ${errorMessage}`);
    }

    return {
      raw: args,
      verb: verbResult.verb,
      object: objectResult.object,
      parameters: parameterResult.parameters,
      args: parameterResult.remainingArgs,
    };
  }

  /**
   * Validate a parsed command
   */
  validate(command: ParsedCommand): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate verb
    const verbValidation = this.verbDispatcher.validateVerb(command.verb);
    if (!verbValidation.valid) {
      errors.push(...verbValidation.errors);
    }
    warnings.push(...verbValidation.warnings);

    // Validate object
    const objectValidation = this.objectRouter.validateObject(command.object);
    if (!objectValidation.valid) {
      errors.push(...objectValidation.errors);
    }
    warnings.push(...objectValidation.warnings);

    // Validate verb-object combination
    const combinationValidation = this.verbDispatcher.validateVerbObjectCombination(
      command.verb, 
      command.object
    );
    if (!combinationValidation.valid) {
      errors.push(...combinationValidation.errors);
    }
    warnings.push(...combinationValidation.warnings);

    // Get command definition for parameter validation
    const commandDef = commandRegistry.get(command.verb, command.object);
    if (commandDef) {
      // Validate parameters
      const parameterValidation = this.parameterParser.validateParameters(
        command.parameters, 
        commandDef.parameters
      );
      if (!parameterValidation.valid) {
        errors.push(...parameterValidation.errors);
      }
      warnings.push(...parameterValidation.warnings);

      // Check for deprecated command
      if (commandDef.deprecated) {
        warnings.push(`Command "${command.verb} ${command.object}" is deprecated`);
        if (commandDef.deprecationMessage) {
          warnings.push(commandDef.deprecationMessage);
        }
      }
    } else {
      errors.push(`Command definition not found for: ${command.verb} ${command.object}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Generate help for a specific command
   */
  generateHelp(verb?: CommandVerb, object?: CommandObject): string {
    if (verb && object) {
      // Help for specific command
      const command = commandRegistry.get(verb, object);
      if (!command) {
        return `Command not found: ${verb} ${object}`;
      }

      let help = `\n📖 Command Help: ${verb} ${object}\n`;
      help += '='.repeat(60) + '\n\n';
      
      help += `📝 Description: ${command.description}\n\n`;

      if (command.deprecated) {
        help += `⚠️  DEPRECATED: ${command.deprecationMessage || 'This command is deprecated'}\n\n`;
      }

      if (command.parameters.length > 0) {
        help += this.parameterParser.generateParameterHelp(command.parameters);
      }

      if (command.examples.length > 0) {
        help += '\n💡 Examples:\n';
        help += '-'.repeat(20) + '\n';
        for (const example of command.examples) {
          help += `  quartz ${example}\n`;
        }
          help += '\n';
      }

      return help;
    } else if (verb) {
      // Help for verb
      return this.verbDispatcher.getVerbHelp(verb);
    } else if (object) {
      // Help for object
      return this.objectRouter.getObjectHelp(object);
    } else {
      // General help
      return this.generateGeneralHelp();
    }
  }

  /**
   * Generate general help showing all available commands
   */
  private generateGeneralHelp(): string {
    const commands = commandRegistry.list();
    const stats = commandRegistry.getStats();

    let help = '\n🚀 Quartz CLI - Natural Language Command System\n';
    help += '='.repeat(60) + '\n\n';
    
    help += '📖 Usage: quartz <verb> <object> [parameters]\n\n';

    help += `📊 Statistics: ${stats.totalCommands} commands, ${stats.verbsCount} verbs, ${stats.objectsCount} objects\n\n`;

    // Group commands by category
    const groupedCommands = commands.reduce((groups, cmd) => {
      const category = cmd.category || 'general';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(cmd);
      return groups;
    }, {} as Record<string, typeof commands>);

    // Display commands by category
    for (const [category, categoryCommands] of Object.entries(groupedCommands)) {
      help += `\n📂 ${category.toUpperCase()}\n`;
      help += '-'.repeat(40) + '\n';

      // Group by verb for better readability
      const byVerb = categoryCommands.reduce((verbGroups, cmd) => {
        if (!verbGroups[cmd.verb]) {
          verbGroups[cmd.verb] = [];
        }
        verbGroups[cmd.verb].push(cmd);
        return verbGroups;
      }, {} as Record<string, typeof categoryCommands>);

      for (const [verb, verbCommands] of Object.entries(byVerb)) {
        const objects = verbCommands.map(cmd => {
          const deprecatedFlag = cmd.deprecated ? ' ⚠️' : '';
          return `${cmd.object}${deprecatedFlag}`;
        }).join(', ');

        help += `  ${verb} {${objects}}\n`;

        // Show description for first command of this verb
        if (verbCommands.length > 0) {
          help += `    ${verbCommands[0].description}\n`;
        }
      }

        help += '\n';
    }

      help += '\n🔍 Tips:\n';
    help += '-'.repeat(20) + '\n';
    help += '  • Use "quartz help <verb>" for verb-specific help\n';
    help += '  • Use "quartz help <verb> <object>" for command-specific help\n';
    help += '  • Commands marked with ⚠️ are deprecated\n';
    help += '  • Use tab completion for command suggestions\n\n';

    help += '📚 Examples:\n';
    help += '-'.repeat(20) + '\n';
    help += '  quartz init project\n';
    help += '  quartz create branch --name feature/new-feature\n';
    help += '  quartz generate commit --edit\n';
    help += '  quartz list config\n';
    help += '  quartz set config --key openai.apiKey --value sk-xxx\n\n';

    return help;
  }

  /**
   * Get command suggestions for autocomplete
   */
  getSuggestions(partialArgs: string[]): string[] {
    const suggestions: string[] = [];

    if (partialArgs.length === 0) {
      // Suggest verbs
      const verbs = this.verbDispatcher.findMatchingVerbs('');
      return verbs.map(verb => `${verb} `);
    }

    if (partialArgs.length === 1) {
      // Suggest verb completions
      const partialVerb = partialArgs[0];
      const verbSuggestions = this.verbDispatcher.findMatchingVerbs(partialVerb);
      return verbSuggestions.map(verb => `${verb} `);
    }

    if (partialArgs.length >= 2) {
      // Try to parse verb and suggest objects
      try {
        const verbResult = this.verbDispatcher.parseVerb(partialArgs);
        if (verbResult.verb && !verbResult.error) {
          const partialObject = partialArgs[1] || '';
          const possibleObjects = this.verbDispatcher.getPossibleObjects(verbResult.verb);
          
          return possibleObjects
            .filter(obj => obj.toLowerCase().startsWith(partialObject.toLowerCase()))
            .map(obj => `${verbResult.verb} ${obj} `);
        }
      } catch {
        // Ignore parsing errors for suggestions
      }
    }

    return suggestions;
  }

  /**
   * Parse and validate in one step
   */
  parseAndValidate(args: string[]): { command?: ParsedCommand; validation: ValidationResult } {
    try {
      const command = this.parse(args);
      const validation = this.validate(command);
      
      return { command, validation };
    } catch (error) {
      return {
        validation: {
          valid: false,
          errors: [error instanceof Error ? error.message : String(error)],
          warnings: [],
        },
      };
    }
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
    return commandRegistry.getStats();
  }
}

/**
 * Global command parser instance
 */
export const commandParser = new CommandParser();