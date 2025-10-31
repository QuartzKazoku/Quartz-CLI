//app/core/commands/index.ts
/**
 * @fileoverview Command definitions for the new command system
 * @description Defines all available commands following the verb-object-parameter pattern
 * @author Quartz CLI Team
 * @version 2.0.0
 */


// Import all command definitions
import { INIT_COMMANDS } from './init';
import { COMMANDS as BRANCH_COMMANDS } from './branch';
import { COMMANDS as COMMIT_COMMANDS } from './commit';
import { COMMANDS as PR_COMMANDS } from './pr';
import { COMMANDS as REVIEW_COMMANDS } from './review';
import { COMMANDS as CHANGELOG_COMMANDS } from './changelog';
import { helpCommands as HELP_COMMANDS } from './help';
import {CommandDefinition} from "@/app/core/interfaces";
import {CommandObject, CommandVerb} from "@/app/core/enums";

// Re-export all command definitions
export * from './init';


/**
 * All command definitions registry
 * This array contains all available commands in the system
 */
export const ALL_COMMANDS: CommandDefinition[] = [
  ...INIT_COMMANDS,
  ...BRANCH_COMMANDS,
  ...COMMIT_COMMANDS,
  ...PR_COMMANDS,
  ...REVIEW_COMMANDS,
  ...CHANGELOG_COMMANDS,
  ...HELP_COMMANDS,
];

/**
 * Command categories for organization
 */
export const COMMAND_CATEGORIES = {
  INITIALIZATION: 'initialization',
  CONFIGURATION: 'configuration',
  GIT_WORKFLOW: 'git-workflow',
  AI_FEATURES: 'ai-features',
  PROJECT_MANAGEMENT: 'project-management',
  HELP: 'help',
  SYSTEM: 'system',
} as const;

/**
 * Get commands by category
 */
export function getCommandsByCategory(category: string): CommandDefinition[] {
  return ALL_COMMANDS.filter(cmd => cmd.category === category);
}

/**
 * Get commands by verb
 */
export function getCommandsByVerb(verb: CommandVerb): CommandDefinition[] {
  return ALL_COMMANDS.filter(cmd => cmd.verb === verb);
}

/**
 * Get commands by object
 */
export function getCommandsByObject(object: CommandObject): CommandDefinition[] {
  return ALL_COMMANDS.filter(cmd => cmd.object === object);
}

/**
 * Get deprecated commands
 */
export function getDeprecatedCommands(): CommandDefinition[] {
  return ALL_COMMANDS.filter(cmd => cmd.deprecated);
}

/**
 * Get active (non-deprecated) commands
 */
export function getActiveCommands(): CommandDefinition[] {
  return ALL_COMMANDS.filter(cmd => !cmd.deprecated);
}