//app/core/commands/help.ts
/**
 * @fileoverview Help command definitions
 * @description Implements hierarchical help system for commands
 * @author Quartz CLI Team
 * @version 2.0.0
 */

import {CommandObject, CommandVerb} from "@/app/core/enums";
import {CommandDefinition, ExecutionContext} from "@/app/core/interfaces";
import {CommandHandler} from "@/app/core";
import {HandlerFactory} from "@/app/core/factories/handler-factory";

/**
 * Help command handler - shows all available verbs
 */
const helpVerbHandler: CommandHandler = async (context: ExecutionContext) => {
  const handler = HandlerFactory.createHandler(CommandVerb.HELP, CommandObject.HELP, context);
  await handler.execute();
};

/**
 * Help with verb command handler - shows objects for a specific verb
 */
const helpWithVerbHandler: CommandHandler = async (context: ExecutionContext) => {
  const handler = HandlerFactory.createHandler(CommandVerb.HELP, CommandObject.PROJECT, context);
  await handler.execute();
};

/**
 * Help with verb and object command handler - shows detailed command help
 */
const helpWithVerbAndObjectHandler: CommandHandler = async (context: ExecutionContext) => {
  const handler = HandlerFactory.createHandler(CommandVerb.HELP, CommandObject.CONFIG, context);
  await handler.execute();
};

/**
 * Version command handler
 */
const versionHandler: CommandHandler = async (context: ExecutionContext) => {
  const handler = HandlerFactory.createHandler(CommandVerb.VERSION, CommandObject.VERSION, context);
  await handler.execute();
};

/**
 * Export help command definitions
 */
export const HELPCommands: CommandDefinition[] = [
  // quartz help
  {
    verb: CommandVerb.HELP,
    object: CommandObject.HELP,
    description: 'Show help information',
    parameters: [
      {
        name: 'verb',
        type: 'string',
        required: false,
        description: 'Command verb to get help for',
        aliases: ['v']
      },
      {
        name: 'object',
        type: 'string',
        required: false,
        description: 'Command object to get help for',
        aliases: ['o']
      },
      {
        name: 'verbose',
        type: 'boolean',
        required: false,
        description: 'Show verbose help information',
        aliases: ['V']
      }
    ],
    examples: [
      'quartz help',
      'quartz help init',
      'quartz help init project',
      'quartz help --verbose'
    ],
    handler: helpVerbHandler,
    category: 'help'
  },
  
  // quartz help <verb>
  {
    verb: CommandVerb.HELP,
    object: CommandObject.PROJECT, // This will be overridden in routing
    description: 'Show help for a specific verb',
    parameters: [
      {
        name: 'verb',
        type: 'string',
        required: true,
        description: 'Command verb to get help for'
      }
    ],
    examples: [
      'quartz help init',
      'quartz help config',
      'quartz help branch'
    ],
    handler: helpWithVerbHandler,
    category: 'help'
  },
  
  // quartz help <verb> <object>
  {
    verb: CommandVerb.HELP,
    object: CommandObject.CONFIG, // This will be overridden in routing
    description: 'Show detailed help for a specific command',
    parameters: [
      {
        name: 'verb',
        type: 'string',
        required: true,
        description: 'Command verb'
      },
      {
        name: 'object',
        type: 'string',
        required: true,
        description: 'Command object'
      }
    ],
    examples: [
      'quartz help init project',
      'quartz help config list',
      'quartz help branch create'
    ],
    handler: helpWithVerbAndObjectHandler,
    category: 'help'
  },
  
  // quartz version
  {
    verb: CommandVerb.VERSION,
    object: CommandObject.VERSION,
    description: 'Show version information',
    parameters: [],
    examples: [
      'quartz version',
      'quartz version --verbose'
    ],
    handler: versionHandler,
    category: 'system'
  }
];