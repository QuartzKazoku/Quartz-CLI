//app/core/verb-dispatcher.ts


import {commandRegistry} from "@/app/core/registry";
import {CommandDefinition, ValidationResult} from "@/app/core/interfaces";
import {CommandObject, CommandVerb} from "@/app/core/enums";

/**
 * Verb Dispatcher Implementation
 * Handles verb-level command routing and validation
 */
export class VerbDispatcher {
  private readonly registry = commandRegistry;

  /**
   * Validate verb
   */
  validateVerb(verb: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if verb is empty
    if (!verb || verb.trim() === '') {
      errors.push('Verb cannot be empty');
      return { valid: false, errors, warnings };
    }

    // Check if verb is valid enum value
    if (!Object.values(CommandVerb).includes(verb as CommandVerb)) {
      const availableVerbs = this.registry.getAvailableVerbs();
      errors.push(`Invalid verb: "${verb}". Available verbs: ${availableVerbs.join(', ')}`);
      return { valid: false, errors, warnings };
    }

    const validVerb = verb as CommandVerb;

    // Check if verb has any registered commands
    const commands = this.registry.findByVerb(validVerb);
    if (commands.length === 0) {
      warnings.push(`Verb "${verb}" is valid but has no registered commands`);
    }

    // Check for deprecated commands
    const deprecatedCommands = commands.filter(cmd => cmd.deprecated);
    if (deprecatedCommands.length > 0 && deprecatedCommands.length === commands.length) {
      warnings.push(`All commands for verb "${verb}" are deprecated`);
    }

    return { valid: true, errors, warnings };
  }

  /**
   * Get possible objects for a verb
   */
  getPossibleObjects(verb: CommandVerb): CommandObject[] {
    const commands = this.registry.findByVerb(verb);
    return commands.map(cmd => cmd.object);
  }

  /**
   * Get command definitions for a verb
   */
  getCommandsForVerb(verb: CommandVerb): CommandDefinition[] {
    return this.registry.findByVerb(verb);
  }

  /**
   * Find best matching command for verb and partial object
   */
  findBestMatch(verb: CommandVerb, partialObject?: string): CommandDefinition | null {
    const commands = this.registry.findByVerb(verb);
    
    if (commands.length === 0) {
      return null;
    }

    // If no partial object, return the first command
    if (!partialObject) {
      return commands[0];
    }

    // Try exact match first
    const exactMatch = commands.find(cmd => cmd.object === partialObject);
    if (exactMatch) {
      return exactMatch;
    }

    // Try partial match
    const lowerPartial = partialObject.toLowerCase();
    const partialMatch = commands.find(cmd => 
      cmd.object.toLowerCase().startsWith(lowerPartial)
    );
    
    return partialMatch || commands[0];
  }

  /**
   * Generate suggestions for invalid verb
   */
  generateVerbSuggestions(invalidVerb: string): string[] {
    const availableVerbs = this.registry.getAvailableVerbs();
    const lowerInvalid = invalidVerb.toLowerCase();
    
    // Find verbs with similar spelling (Levenshtein distance approximation)
    return availableVerbs.filter(verb => {
      const lowerVerb = verb.toLowerCase();
      if (lowerVerb.includes(lowerInvalid) || lowerInvalid.includes(lowerVerb)) {
        return true;
      }
      
      // Simple character similarity check
      let similarity = 0;
      const maxLength = Math.max(lowerVerb.length, lowerInvalid.length);
      for (let i = 0; i < maxLength; i++) {
        if (lowerVerb[i] === lowerInvalid[i]) {
          similarity++;
        }
      }
      
      return similarity / maxLength > 0.5; // 50% similarity threshold
    }).slice(0, 3); // Limit to 3 suggestions
  }

  /**
   * Parse verb from command arguments
   */
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

  /**
   * Get help for a specific verb
   */
  getVerbHelp(verb: CommandVerb): string {
    const commands = this.registry.findByVerb(verb);
    
    if (commands.length === 0) {
      return `No commands found for verb: ${verb}`;
    }

    let help = `\n📖 Help for verb: ${verb}\n`;
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
   * Get all available verbs with descriptions
   */
  getAllVerbsHelp(): string {
    const availableVerbs = this.registry.getAvailableVerbs();
    
    let help = '\n🚀 Available Verbs\n';
    help += '='.repeat(50) + '\n\n';

    for (const verb of availableVerbs) {
      const commands = this.registry.findByVerb(verb);
      const objects = commands.map(cmd => cmd.object).join(', ');
      const deprecatedCount = commands.filter(cmd => cmd.deprecated).length;

      const deprecatedFlag = deprecatedCount === commands.length ? ' ⚠️' : '';
      help += `  ${verb}${deprecatedFlag}\n`;
      help += `    Objects: ${objects}\n`;

      if (deprecatedCount > 0) {
        help += `    ⚠️  ${deprecatedCount}/${commands.length} commands deprecated\n`;
      }

      help += '\n';
    }

      return help;
  }

  /**
   * Validate verb and object combination
   */
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

  /**
   * Find matching verbs for autocomplete (with empty string fallback)
   */
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