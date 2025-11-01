//app/core/parser.ts

//app/core/parser.ts

import { commandRegistry } from './registry';
import {
  CommandDefinition,
  ValidationResult,
  ICommandParser,
  ParsedCommand,
  ParameterDefinition,
} from './models';
import { CommandObject, CommandVerb } from './models';

/**
 * Verb Dispatcher
 * Handles verb-level command routing and validation
 */
class VerbDispatcher {
  private readonly registry = commandRegistry;

  validateVerb(verb: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!verb || verb.trim() === '') {
      errors.push('Verb cannot be empty');
      return { valid: false, errors, warnings };
    }

    if (!Object.values(CommandVerb).includes(verb as CommandVerb)) {
      const availableVerbs = this.registry.getAvailableVerbs();
      errors.push(`Invalid verb: "${verb}". Available verbs: ${availableVerbs.join(', ')}`);
      return { valid: false, errors, warnings };
    }

    const validVerb = verb as CommandVerb;
    const commands = this.registry.findByVerb(validVerb);
    if (commands.length === 0) {
      warnings.push(`Verb "${verb}" is valid but has no registered commands`);
    }

    const deprecatedCommands = commands.filter(cmd => cmd.deprecated);
    if (deprecatedCommands.length > 0 && deprecatedCommands.length === commands.length) {
      warnings.push(`All commands for verb "${verb}" are deprecated`);
    }

    return { valid: true, errors, warnings };
  }

  getPossibleObjects(verb: CommandVerb): CommandObject[] {
    const commands = this.registry.findByVerb(verb);
    return commands.map(cmd => cmd.object);
  }

  getCommandsForVerb(verb: CommandVerb): CommandDefinition[] {
    return this.registry.findByVerb(verb);
  }

  findBestMatch(verb: CommandVerb, partialObject?: string): CommandDefinition | null {
    const commands = this.registry.findByVerb(verb);
    if (commands.length === 0) return null;
    if (!partialObject) return commands[0];

    const exactMatch = commands.find(cmd => cmd.object === partialObject);
    if (exactMatch) return exactMatch;

    const lowerPartial = partialObject.toLowerCase();
    const partialMatch = commands.find(cmd => 
      cmd.object.toLowerCase().startsWith(lowerPartial)
    );
    
    return partialMatch || commands[0];
  }

  generateVerbSuggestions(invalidVerb: string): string[] {
    const availableVerbs = this.registry.getAvailableVerbs();
    const lowerInvalid = invalidVerb.toLowerCase();
    
    return availableVerbs.filter(verb => {
      const lowerVerb = verb.toLowerCase();
      if (lowerVerb.includes(lowerInvalid) || lowerInvalid.includes(lowerVerb)) {
        return true;
      }
      
      let similarity = 0;
      const maxLength = Math.max(lowerVerb.length, lowerInvalid.length);
      for (let i = 0; i < maxLength; i++) {
        if (lowerVerb[i] === lowerInvalid[i]) {
          similarity++;
        }
      }
      
      return similarity / maxLength > 0.5;
    }).slice(0, 3);
  }

  parseVerb(args: string[]): { verb?: CommandVerb; remainingArgs: string[]; error?: string } {
    if (args.length === 0) {
      return { remainingArgs: args, error: 'No verb provided' };
    }

    const verbCandidate = args[0];
    const validation = this.validateVerb(verbCandidate);

    if (!validation.valid) {
      const suggestions = this.generateVerbSuggestions(verbCandidate);
      const suggestionText = suggestions.length > 0 
        ? ` Did you mean: ${suggestions.join(', ')}?`
        : '';
      
      return { 
        remainingArgs: args, 
        error: `${validation.errors.join(', ')}${suggestionText}` 
      };
    }

    return {
      verb: verbCandidate as CommandVerb,
      remainingArgs: args.slice(1),
    };
  }

  getVerbHelp(verb: CommandVerb): string {
    const commands = this.registry.findByVerb(verb);
    if (commands.length === 0) {
      return `No commands found for verb: ${verb}`;
    }

    let help = `\n📖 Help for verb: ${verb}\n${'='.repeat(50)}\n\n`;

    const groupedCommands = commands.reduce((groups, cmd) => {
      const category = cmd.category || 'general';
      if (!groups[category]) groups[category] = [];
      groups[category].push(cmd);
      return groups;
    }, {} as Record<string, CommandDefinition[]>);

    for (const [category, categoryCommands] of Object.entries(groupedCommands)) {
      help += `\n📂 ${category.toUpperCase()}\n${'-'.repeat(30)}\n`;

      for (const cmd of categoryCommands) {
        const deprecatedFlag = cmd.deprecated ? ' ⚠️ [DEPRECATED]' : '';
        help += `  ${cmd.verb} ${cmd.object}${deprecatedFlag}\n    ${cmd.description}\n`;

        if (cmd.examples.length > 0) {
          help += `    Examples:\n`;
          for (const example of cmd.examples) {
            help += `      quartz ${example}\n`;
          }
        }

        if (cmd.deprecated && cmd.deprecationMessage) {
          help += `    ⚠️  ${cmd.deprecationMessage}\n`;
        }
        help += '\n';
      }
    }

    return help;
  }

  validateVerbObjectCombination(verb: CommandVerb, object: CommandObject): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const command = this.registry.get(verb, object);
    
    if (!command) {
      const possibleObjects = this.getPossibleObjects(verb);
      errors.push(
        `Command "${verb} ${object}" not found. Available objects for "${verb}": ${possibleObjects.join(', ')}`
      );
      return { valid: false, errors, warnings };
    }

    if (command.deprecated) {
      warnings.push(`Command "${verb} ${object}" is deprecated`);
      if (command.deprecationMessage) {
        warnings.push(command.deprecationMessage);
      }
    }

    return { valid: true, errors, warnings };
  }

  findMatchingVerbs(partial: string): CommandVerb[] {
    if (partial === '') {
      return this.registry.getAvailableVerbs();
    }
    
    const availableVerbs = this.registry.getAvailableVerbs();
    const lowerPartial = partial.toLowerCase();
    
    return availableVerbs.filter(verb =>
      verb.toLowerCase().startsWith(lowerPartial)
    );
  }
}

/**
 * Object Router
 * Handles object-level command routing and validation
 */
class ObjectRouter {
  private readonly registry = commandRegistry;

  validateObject(object: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!object || object.trim() === '') {
      errors.push('Object cannot be empty');
      return { valid: false, errors, warnings };
    }

    if (!Object.values(CommandObject).includes(object as CommandObject)) {
      const availableObjects = this.registry.getAvailableObjects();
      errors.push(`Invalid object: "${object}". Available objects: ${availableObjects.join(', ')}`);
      return { valid: false, errors, warnings };
    }

    const validObject = object as CommandObject;
    const commands = this.registry.findByObject(validObject);
    if (commands.length === 0) {
      warnings.push(`Object "${object}" is valid but has no registered commands`);
    }

    const deprecatedCommands = commands.filter(cmd => cmd.deprecated);
    if (deprecatedCommands.length > 0 && deprecatedCommands.length === commands.length) {
      warnings.push(`All commands for object "${object}" are deprecated`);
    }

    return { valid: true, errors, warnings };
  }

  parseObject(args: string[]): { object?: CommandObject; remainingArgs: string[]; error?: string } {
    if (args.length === 0) {
      return { remainingArgs: args, error: 'No object provided' };
    }

    const objectCandidate = args[0];
    const validation = this.validateObject(objectCandidate);

    if (!validation.valid) {
      const suggestions = this.generateObjectSuggestions(objectCandidate);
      const suggestionText = suggestions.length > 0 
        ? ` Did you mean: ${suggestions.join(', ')}?`
        : '';
      
      return { 
        remainingArgs: args, 
        error: `${validation.errors.join(', ')}${suggestionText}` 
      };
    }

    return {
      object: objectCandidate as CommandObject,
      remainingArgs: args.slice(1),
    };
  }

  generateObjectSuggestions(invalidObject: string): string[] {
    const availableObjects = this.registry.getAvailableObjects();
    const lowerInvalid = invalidObject.toLowerCase();
    
    return availableObjects.filter(object => {
      const lowerObject = object.toLowerCase();
      if (lowerObject.includes(lowerInvalid) || lowerInvalid.includes(lowerObject)) {
        return true;
      }
      
      let similarity = 0;
      const maxLength = Math.max(lowerObject.length, lowerInvalid.length);
      for (let i = 0; i < maxLength; i++) {
        if (lowerObject[i] === lowerInvalid[i]) {
          similarity++;
        }
      }
      
      return similarity / maxLength > 0.5;
    }).slice(0, 3);
  }

  route(verb: CommandVerb, object: CommandObject): CommandDefinition | null {
    return this.registry.get(verb, object) || null;
  }

  getObjectHelp(object: CommandObject): string {
    const commands = this.registry.findByObject(object);
    if (commands.length === 0) {
      return `No commands found for object: ${object}`;
    }

    let help = `\n📖 Help for object: ${object}\n${'='.repeat(50)}\n\n`;

    const groupedCommands = commands.reduce((groups, cmd) => {
      const category = cmd.category || 'general';
      if (!groups[category]) groups[category] = [];
      groups[category].push(cmd);
      return groups;
    }, {} as Record<string, CommandDefinition[]>);

    for (const [category, categoryCommands] of Object.entries(groupedCommands)) {
      help += `\n📂 ${category.toUpperCase()}\n${'-'.repeat(30)}\n`;

      for (const cmd of categoryCommands) {
        const deprecatedFlag = cmd.deprecated ? ' ⚠️ [DEPRECATED]' : '';
        help += `  ${cmd.verb} ${cmd.object}${deprecatedFlag}\n    ${cmd.description}\n`;

        if (cmd.parameters.length > 0) {
          help += `    Parameters:\n`;
          for (const param of cmd.parameters) {
            const required = param.required ? 'required' : 'optional';
            const defaultValue = param.defaultValue !== undefined ? ` (default: ${param.defaultValue})` : '';
            help += `      --${param.name} (${param.type}, ${required})${defaultValue}\n        ${param.description}\n`;
          }
        }

        if (cmd.examples.length > 0) {
          help += `    Examples:\n`;
          for (const example of cmd.examples) {
            help += `      quartz ${example}\n`;
          }
        }

        if (cmd.deprecated && cmd.deprecationMessage) {
          help += `    ⚠️  ${cmd.deprecationMessage}\n`;
        }
        help += '\n';
      }
    }

    return help;
  }
}

/**
 * Parameter Parser
 * Handles parsing and validation of command parameters
 */
class ParameterParser {
  parseParameters(
    args: string[], 
    parameterDefinitions: ParameterDefinition[]
  ): { validation: ValidationResult; parameters: Record<string, any>; remainingArgs: string[] } {
    const parameters: Record<string, any> = {};
    const remainingArgs: string[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    let i = 0;
    while (i < args.length) {
      const arg = args[i];
      
      if (arg.startsWith('--')) {
        const equalIndex = arg.indexOf('=');
        if (equalIndex !== -1) {
          const key = arg.substring(2, equalIndex);
          const value = arg.substring(equalIndex + 1);
          const validation = this.validateParameter(key, value, parameterDefinitions);
          
          if (validation.valid) {
            parameters[key] = value;
          } else {
            errors.push(...validation.errors);
            warnings.push(...validation.warnings);
          }
        } else {
          const key = arg.substring(2);
          const paramDef = parameterDefinitions.find(p => p.name === key);
          
          if (paramDef && paramDef.type === 'boolean') {
            parameters[key] = true;
          } else {
            remainingArgs.push(arg);
          }
        }
      } else if (arg.startsWith('-') && !arg.startsWith('--')) {
        const key = arg.substring(1);
        const paramDef = parameterDefinitions.find(p => p.aliases?.includes(key));
        
        if (paramDef) {
          if (paramDef.type === 'boolean') {
            parameters[paramDef.name] = true;
          } else if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
            const value = args[i + 1];
            const validation = this.validateParameter(paramDef.name, value, parameterDefinitions);
            
            if (validation.valid) {
              parameters[paramDef.name] = value;
              i++;
            } else {
              errors.push(...validation.errors);
              warnings.push(...validation.warnings);
            }
          } else {
            errors.push(`Parameter "-${key}" requires a value`);
          }
        } else {
          remainingArgs.push(arg);
        }
      } else {
        remainingArgs.push(arg);
      }
      
      i++;
    }

    for (const paramDef of parameterDefinitions) {
      if (paramDef.required && !(paramDef.name in parameters)) {
        errors.push(`Required parameter "${paramDef.name}" is missing`);
      }
    }

    return {
      validation: { valid: errors.length === 0, errors, warnings },
      parameters,
      remainingArgs,
    };
  }

  private validateParameter(
    key: string, 
    value: any, 
    parameterDefinitions: ParameterDefinition[]
  ): ValidationResult {
    const paramDef = parameterDefinitions.find(p => p.name === key || p.aliases?.includes(key));
    
    if (!paramDef) {
      return {
        valid: false,
        errors: [`Unknown parameter: ${key}`],
        warnings: [],
      };
    }

    if (paramDef.type === 'number' && typeof value !== 'number') {
      const num = Number(value);
      if (isNaN(num)) {
        return {
          valid: false,
          errors: [`Parameter "${key}" must be a number`],
          warnings: [],
        };
      }
    }

    if (paramDef.validator) {
      const result = paramDef.validator(value);
      if (result !== true) {
        return {
          valid: false,
          errors: [`Parameter "${key}" validation failed: ${result}`],
          warnings: [],
        };
      }
    }

    return { valid: true, errors: [], warnings: [] };
  }

  validateParameters(
    parameters: Record<string, any>, 
    parameterDefinitions: ParameterDefinition[]
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const paramDef of parameterDefinitions) {
      const value = parameters[paramDef.name];
      
      if (value === undefined || value === null) {
        if (paramDef.required) {
          errors.push(`Required parameter "${paramDef.name}" is missing`);
        }
      } else {
        const validation = this.validateParameter(paramDef.name, value, parameterDefinitions);
        if (!validation.valid) {
          errors.push(...validation.errors);
          warnings.push(...validation.warnings);
        }
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  generateParameterHelp(parameterDefinitions: ParameterDefinition[]): string {
    if (parameterDefinitions.length === 0) {
      return '  No parameters\n';
    }

    let help = `\n📋 Parameters:\n${'─'.repeat(40)}\n`;
    
    for (const param of parameterDefinitions) {
      const aliases = param.aliases ? ` (-${param.aliases.join(', -')})` : '';
      const required = param.required ? 'required' : 'optional';
      const defaultValue = param.defaultValue !== undefined ? ` [default: ${param.defaultValue}]` : '';
      
      help += `  --${param.name}${aliases}\n    ${param.description}\n    Type: ${param.type}, ${required}${defaultValue}\n\n`;
    }

    return help;
  }
}

/**
 * Main Command Parser
 * Integrates verb dispatcher, object router, and parameter parser
 */
export class CommandParser implements ICommandParser {
  private readonly verbDispatcher = new VerbDispatcher();
  private readonly objectRouter = new ObjectRouter();
  private readonly parameterParser = new ParameterParser();

  parse(args: string[]): ParsedCommand {
    if (args.length === 0) {
      throw new Error('No command provided');
    }

    const verbResult = this.verbDispatcher.parseVerb(args);
    if (verbResult.error) {
      throw new Error(verbResult.error);
    }

    if (!verbResult.verb) {
      throw new Error('Failed to parse verb');
    }

    if (verbResult.verb === CommandVerb.HELP || verbResult.verb === CommandVerb.VERSION) {
      const defaultObject = verbResult.verb === CommandVerb.HELP ? CommandObject.HELP : CommandObject.VERSION;
      const command = commandRegistry.get(verbResult.verb, defaultObject);
      if (!command) {
        throw new Error(`Command not found: ${verbResult.verb}`);
      }

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

    const objectResult = this.objectRouter.parseObject(verbResult.remainingArgs);
    if (objectResult.error) {
      throw new Error(objectResult.error);
    }

    if (!objectResult.object) {
      throw new Error('No object provided');
    }

    const command = this.objectRouter.route(verbResult.verb, objectResult.object);
    if (!command) {
      throw new Error(`Command not found: ${verbResult.verb} ${objectResult.object}`);
    }

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

  validate(command: ParsedCommand): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const verbValidation = this.verbDispatcher.validateVerb(command.verb);
    if (!verbValidation.valid) {
      errors.push(...verbValidation.errors);
    }
    warnings.push(...verbValidation.warnings);

    const objectValidation = this.objectRouter.validateObject(command.object);
    if (!objectValidation.valid) {
      errors.push(...objectValidation.errors);
    }
    warnings.push(...objectValidation.warnings);

    const combinationValidation = this.verbDispatcher.validateVerbObjectCombination(
      command.verb, 
      command.object
    );
    if (!combinationValidation.valid) {
      errors.push(...combinationValidation.errors);
    }
    warnings.push(...combinationValidation.warnings);

    const commandDef = commandRegistry.get(command.verb, command.object);
    if (commandDef) {
      const parameterValidation = this.parameterParser.validateParameters(
        command.parameters, 
        commandDef.parameters
      );
      if (!parameterValidation.valid) {
        errors.push(...parameterValidation.errors);
      }
      warnings.push(...parameterValidation.warnings);

      if (commandDef.deprecated) {
        warnings.push(`Command "${command.verb} ${command.object}" is deprecated`);
        if (commandDef.deprecationMessage) {
          warnings.push(commandDef.deprecationMessage);
        }
      }
    } else {
      errors.push(`Command definition not found for: ${command.verb} ${command.object}`);
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  generateHelp(verb?: CommandVerb, object?: CommandObject): string {
    if (verb && object) {
      const command = commandRegistry.get(verb, object);
      if (!command) {
        return `Command not found: ${verb} ${object}`;
      }

      let help = `\n📖 Command Help: ${verb} ${object}\n${'='.repeat(60)}\n\n`;
      help += `📝 Description: ${command.description}\n\n`;

      if (command.deprecated) {
        help += `⚠️  DEPRECATED: ${command.deprecationMessage || 'This command is deprecated'}\n\n`;
      }

      if (command.parameters.length > 0) {
        help += this.parameterParser.generateParameterHelp(command.parameters);
      }

      if (command.examples.length > 0) {
        help += `\n💡 Examples:\n${'-'.repeat(20)}\n`;
        for (const example of command.examples) {
          help += `  quartz ${example}\n`;
        }
        help += '\n';
      }

      return help;
    } else if (verb) {
      return this.verbDispatcher.getVerbHelp(verb);
    } else if (object) {
      return this.objectRouter.getObjectHelp(object);
    } else {
      return this.generateGeneralHelp();
    }
  }

  private generateGeneralHelp(): string {
    const commands = commandRegistry.list();
    const stats = commandRegistry.getStats();

    let help = '\n🚀 Quartz CLI - Natural Language Command System\n';
    help += '='.repeat(60) + '\n\n';
    help += '📖 Usage: quartz <verb> <object> [parameters]\n\n';
    help += `📊 Statistics: ${stats.totalCommands} commands, ${stats.verbsCount} verbs, ${stats.objectsCount} objects\n\n`;

    const groupedCommands = commands.reduce((groups, cmd) => {
      const category = cmd.category || 'general';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(cmd);
      return groups;
    }, {} as Record<string, typeof commands>);

    for (const [category, categoryCommands] of Object.entries(groupedCommands)) {
      help += `\n📂 ${category.toUpperCase()}\n${'-'.repeat(40)}\n`;

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
        if (verbCommands.length > 0) {
          help += `    ${verbCommands[0].description}\n`;
        }
      }
      help += '\n';
    }

    help += '\n🔍 Tips:\n' + '-'.repeat(20) + '\n';
    help += '  • Use "quartz help <verb>" for verb-specific help\n';
    help += '  • Use "quartz help <verb> <object>" for command-specific help\n';
    help += '  • Commands marked with ⚠️ are deprecated\n';
    help += '  • Use tab completion for command suggestions\n\n';

    help += '📚 Examples:\n' + '-'.repeat(20) + '\n';
    help += '  quartz init project\n';
    help += '  quartz create branch --name feature/new-feature\n';
    help += '  quartz generate commit --edit\n';
    help += '  quartz list config\n';
    help += '  quartz set config --key openai.apiKey --value sk-xxx\n\n';

    return help;
  }

  getSuggestions(partialArgs: string[]): string[] {
    const suggestions: string[] = [];

    if (partialArgs.length === 0) {
      const verbs = this.verbDispatcher.findMatchingVerbs('');
      return verbs.map(verb => `${verb} `);
    }

    if (partialArgs.length === 1) {
      const partialVerb = partialArgs[0];
      const verbSuggestions = this.verbDispatcher.findMatchingVerbs(partialVerb);
      return verbSuggestions.map(verb => `${verb} `);
    }

    if (partialArgs.length >= 2) {
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
    