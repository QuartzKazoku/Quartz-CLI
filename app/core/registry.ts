//app/core/registry.ts


import {CommandDefinition, ICommandRegistry} from "@/app/core/interfaces";
import {CommandObject, CommandVerb} from "@/app/core/enums";

/**
 * Command Registry Implementation
 * Manages registration and lookup of command definitions
 */
export class CommandRegistry implements ICommandRegistry {
  private readonly commands = new Map<string, CommandDefinition>();
  private readonly verbIndex = new Map<CommandVerb, CommandDefinition[]>();
  private readonly objectIndex = new Map<CommandObject, CommandDefinition[]>();
  private readonly categoryIndex = new Map<string, CommandDefinition[]>();

  /**
   * Generate a unique key for verb-object combination
   */
  private getKey(verb: CommandVerb, object: CommandObject): string {
    return `${verb}:${object}`;
  }

  /**
   * Register a new command definition
   */
  register(command: CommandDefinition): void {
    const key = this.getKey(command.verb, command.object);
    
    // Check for existing command
    if (this.commands.has(key)) {
      throw new Error(`Command already registered: ${command.verb} ${command.object}`);
    }

    // Store command
    this.commands.set(key, command);

    // Update indexes
    this.updateVerbIndex(command);
    this.updateObjectIndex(command);
    this.updateCategoryIndex(command);
  }

  /**
   * Unregister a command
   */
  unregister(verb: CommandVerb, object: CommandObject): void {
    const key = this.getKey(verb, object);
    const command = this.commands.get(key);
    
    if (!command) {
      return;
    }

    // Remove from main storage
    this.commands.delete(key);

    // Update indexes
    this.removeFromVerbIndex(command);
    this.removeFromObjectIndex(command);
    this.removeFromCategoryIndex(command);
  }

  /**
   * Get a command definition by verb and object
   */
  get(verb: CommandVerb, object: CommandObject): CommandDefinition | undefined {
    const key = this.getKey(verb, object);
    return this.commands.get(key);
  }

  /**
   * List all registered commands
   */
  list(): CommandDefinition[] {
    return Array.from(this.commands.values());
  }

  /**
   * Find commands by verb
   */
  findByVerb(verb: CommandVerb): CommandDefinition[] {
    return this.verbIndex.get(verb) || [];
  }

  /**
   * Find commands by object
   */
  findByObject(object: CommandObject): CommandDefinition[] {
    return this.objectIndex.get(object) || [];
  }

  /**
   * Find commands by category
   */
  findByCategory(category: string): CommandDefinition[] {
    return this.categoryIndex.get(category) || [];
  }

  /**
   * Get all available verbs
   */
  getAvailableVerbs(): CommandVerb[] {
    return Array.from(this.verbIndex.keys());
  }

  /**
   * Get all available objects
   */
  getAvailableObjects(): CommandObject[] {
    return Array.from(this.objectIndex.keys());
  }

  /**
   * Get all available categories
   */
  getAvailableCategories(): string[] {
    return Array.from(this.categoryIndex.keys());
  }

  /**
   * Check if a command exists
   */
  has(verb: CommandVerb, object: CommandObject): boolean {
    const key = this.getKey(verb, object);
    return this.commands.has(key);
  }

  /**
   * Get commands that match a partial verb (for autocomplete)
   */
  findMatchingVerbs(partial: string): CommandVerb[] {
    const lowerPartial = partial.toLowerCase();
    return this.getAvailableVerbs().filter(verb => 
      verb.toLowerCase().startsWith(lowerPartial)
    );
  }

  /**
   * Get commands that match a partial object (for autocomplete)
   */
  findMatchingObjects(partial: string): CommandObject[] {
    const lowerPartial = partial.toLowerCase();
    return this.getAvailableObjects().filter(object => 
      object.toLowerCase().startsWith(lowerPartial)
    );
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
    return {
      totalCommands: this.commands.size,
      verbsCount: this.verbIndex.size,
      objectsCount: this.objectIndex.size,
      categoriesCount: this.categoryIndex.size,
    };
  }

  /**
   * Clear all registered commands (for testing)
   */
  clear(): void {
    this.commands.clear();
    this.verbIndex.clear();
    this.objectIndex.clear();
    this.categoryIndex.clear();
  }

  /**
   * Update verb index
   */
  private updateVerbIndex(command: CommandDefinition): void {
    if (!this.verbIndex.has(command.verb)) {
      this.verbIndex.set(command.verb, []);
    }
    this.verbIndex.get(command.verb)!.push(command);
  }

  /**
   * Update object index
   */
  private updateObjectIndex(command: CommandDefinition): void {
    if (!this.objectIndex.has(command.object)) {
      this.objectIndex.set(command.object, []);
    }
    this.objectIndex.get(command.object)!.push(command);
  }

  /**
   * Update category index
   */
  private updateCategoryIndex(command: CommandDefinition): void {
    const category = command.category || 'general';
    if (!this.categoryIndex.has(category)) {
      this.categoryIndex.set(category, []);
    }
    this.categoryIndex.get(category)!.push(command);
  }

  /**
   * Remove from verb index
   */
  private removeFromVerbIndex(command: CommandDefinition): void {
    const commands = this.verbIndex.get(command.verb);
    if (commands) {
      const index = commands.findIndex(c => c.verb === command.verb && c.object === command.object);
      if (index !== -1) {
        commands.splice(index, 1);
      }
      if (commands.length === 0) {
        this.verbIndex.delete(command.verb);
      }
    }
  }

  /**
   * Remove from object index
   */
  private removeFromObjectIndex(command: CommandDefinition): void {
    const commands = this.objectIndex.get(command.object);
    if (commands) {
      const index = commands.findIndex(c => c.verb === command.verb && c.object === command.object);
      if (index !== -1) {
        commands.splice(index, 1);
      }
      if (commands.length === 0) {
        this.objectIndex.delete(command.object);
      }
    }
  }

  /**
   * Remove from category index
   */
  private removeFromCategoryIndex(command: CommandDefinition): void {
    const category = command.category || 'general';
    const commands = this.categoryIndex.get(category);
    if (commands) {
      const index = commands.findIndex(c => c.verb === command.verb && c.object === command.object);
      if (index !== -1) {
        commands.splice(index, 1);
      }
      if (commands.length === 0) {
        this.categoryIndex.delete(category);
      }
    }
  }
}

/**
 * Global command registry instance
 */
export const commandRegistry = new CommandRegistry();