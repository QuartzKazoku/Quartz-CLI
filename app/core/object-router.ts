//app/core/object-router.ts

import { commandRegistry } from './registry';
import {CommandDefinition, ValidationResult} from "@/app/core/interfaces";
import {CommandObject, CommandVerb} from "@/app/core/enums";

/**
 * Object Router Implementation
 * Handles object-level command routing and validation
 */
export class ObjectRouter {
  private readonly registry = commandRegistry;

  /**
   * Validate object
   */
  validateObject(object: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if object is empty
    if (!object || object.trim() === '') {
      errors.push('Object cannot be empty');
      return { valid: false, errors, warnings };
    }

    // Check if object is valid enum value
    if (!Object.values(CommandObject).includes(object as CommandObject)) {
      const availableObjects = this.registry.getAvailableObjects();
      errors.push(`Invalid object: "${object}". Available objects: ${availableObjects.join(', ')}`);
      return { valid: false, errors, warnings };
    }

    const validObject = object as CommandObject;

    // Check if object has any registered commands
    const commands = this.registry.findByObject(validObject);
    if (commands.length === 0) {
      warnings.push(`Object "${object}" is valid but has no registered commands`);
    }

    // Check for deprecated commands
    const deprecatedCommands = commands.filter(cmd => cmd.deprecated);
    if (deprecatedCommands.length > 0 && deprecatedCommands.length === commands.length) {
      warnings.push(`All commands for object "${object}" are deprecated`);
    }

    return { valid: true, errors, warnings };
  }

  /**
   * Get possible verbs for an object
   */
  getPossibleVerbs(object: CommandObject): CommandVerb[] {
    const commands = this.registry.findByObject(object);
    return commands.map(cmd => cmd.verb);
  }

  /**
   * Get command definitions for an object
   */
  getCommandsForObject(object: CommandObject): CommandDefinition[] {
    return this.registry.findByObject(object);
  }

  /**
   * Find best matching command for object and partial verb
   */
  findBestMatch(object: CommandObject, partialVerb?: string): CommandDefinition | null {
    const commands = this.registry.findByObject(object);
    
    if (commands.length === 0) {
      return null;
    }

    // If no partial verb, return the first command
    if (!partialVerb) {
      return commands[0];
    }

    // Try exact match first
    const exactMatch = commands.find(cmd => cmd.verb === partialVerb);
    if (exactMatch) {
      return exactMatch;
    }

    // Try partial match
    const lowerPartial = partialVerb.toLowerCase();
    const partialMatch = commands.find(cmd => 
      cmd.verb.toLowerCase().startsWith(lowerPartial)
    );
    
    return partialMatch || commands[0];
  }

  /**
   * Generate suggestions for invalid object
   */
  generateObjectSuggestions(invalidObject: string): string[] {
    const availableObjects = this.registry.getAvailableObjects();
    const lowerInvalid = invalidObject.toLowerCase();
    
    // Find objects with similar spelling
    return availableObjects.filter(object => {
      const lowerObject = object.toLowerCase();
      if (lowerObject.includes(lowerInvalid) || lowerInvalid.includes(lowerObject)) {
        return true;
      }
      
      // Simple character similarity check
      let similarity = 0;
      const maxLength = Math.max(lowerObject.length, lowerInvalid.length);
      for (let i = 0; i < maxLength; i++) {
        if (lowerObject[i] === lowerInvalid[i]) {
          similarity++;
        }
      }
      
      return similarity / maxLength > 0.5; // 50% similarity threshold
    }).slice(0, 3); // Limit to 3 suggestions
  }

  /**
   * Parse object from command arguments
   */
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

  /**
   * Get help for a specific object
   */
  getObjectHelp(object: CommandObject): string {
    const commands = this.registry.findByObject(object);
    
    if (commands.length === 0) {
      return `No commands found for object: ${object}`;
    }

    let help = `\n📖 Help for object: ${object}\n`;
    help += '='.repeat(50) + '\n\n';

    // Group commands by category
    const groupedCommands = commands.reduce((groups, cmd) => {
      const category = cmd.category || 'general';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(cmd);
      return groups;
    }, {} as Record<string, CommandDefinition[]>);

    // Display commands by category
    for (const [category, categoryCommands] of Object.entries(groupedCommands)) {
      help += `\n📂 ${category.toUpperCase()}\n`;
      help += '-'.repeat(30) + '\n';

      for (const cmd of categoryCommands) {
        const deprecatedFlag = cmd.deprecated ? ' ⚠️ [DEPRECATED]' : '';
        help += `  ${cmd.verb} ${cmd.object}${deprecatedFlag}\n`;
        help += `    ${cmd.description}\n`;

        if (cmd.parameters.length > 0) {
          help += `    Parameters:\n`;
          for (const param of cmd.parameters) {
            const required = param.required ? 'required' : 'optional';
            const defaultValue = param.defaultValue !== undefined ? ` (default: ${param.defaultValue})` : '';
            help += `      --${param.name} (${param.type}, ${required})${defaultValue}\n`;
            help += `        ${param.description}\n`;
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

  /**
   * Get all available objects with descriptions
   */
  getAllObjectsHelp(): string {
    const availableObjects = this.registry.getAvailableObjects();
    
    let help = '\n🎯 Available Objects\n';
    help += '='.repeat(50) + '\n\n';

    for (const object of availableObjects) {
      const commands = this.registry.findByObject(object);
      const verbs = commands.map(cmd => cmd.verb).join(', ');
      const deprecatedCount = commands.filter(cmd => cmd.deprecated).length;

      const deprecatedFlag = deprecatedCount === commands.length ? ' ⚠️' : '';
      help += `  ${object}${deprecatedFlag}\n`;
      help += `    Verbs: ${verbs}\n`;

      if (deprecatedCount > 0) {
        help += `    ⚠️  ${deprecatedCount}/${commands.length} commands deprecated\n`;
      }

      help += '\n';
    }

      return help;
  }

  /**
   * Route to specific command based on verb and object
   */
  route(verb: CommandVerb, object: CommandObject): CommandDefinition | null {
    return this.registry.get(verb, object) || null;
  }

  /**
   * Get command statistics for an object
   */
  getObjectStats(object: CommandObject): {
    totalCommands: number;
    verbsCount: number;
    categoriesCount: number;
    deprecatedCount: number;
  } {
    const commands = this.registry.findByObject(object);
    const verbs = new Set(commands.map(cmd => cmd.verb));
    const categories = new Set(commands.map(cmd => cmd.category || 'general'));
    const deprecated = commands.filter(cmd => cmd.deprecated);

    return {
      totalCommands: commands.length,
      verbsCount: verbs.size,
      categoriesCount: categories.size,
      deprecatedCount: deprecated.length,
    };
  }

  /**
   * Find related objects (objects that share similar verbs)
   */
  findRelatedObjects(object: CommandObject): CommandObject[] {
    const objectVerbs = this.getPossibleVerbs(object);
    const allObjects = this.registry.getAvailableObjects();
    
    // Find objects that share at least one verb
    return allObjects.filter(obj => {
      if (obj === object) return false;
      const objVerbs = this.getPossibleVerbs(obj);
      return objVerbs.some(verb => objectVerbs.includes(verb));
    });
  }

  /**
   * Validate object context (e.g., check if we're in a git repo for git-related objects)
   */
  validateObjectContext(object: CommandObject): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Context validation would go here
    // For example, checking if we're in a git repository for git objects
    switch (object) {
      case CommandObject.BRANCH:
      case CommandObject.COMMIT:
      case CommandObject.PR:
        // Could check if we're in a git repository
        // This would require importing git utilities
        break;
      case CommandObject.PROJECT:
        // Could check if we're in a valid project directory
        break;
    }

    return { valid: errors.length === 0, errors, warnings };
  }
}