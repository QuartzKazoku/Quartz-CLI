//app/core/commands/branch.ts
/**
 * @fileoverview Branch command definitions
 * @description Commands for Git branch management
 * @author Quartz CLI Team
 * @version 2.0.0
 */



import {CommandDefinition} from "@/app/core/interfaces";
import {CommandObject, CommandVerb} from "@/app/core/enums";

/**
 * Create branch command definition
 */
export const CREATE_BRANCH: CommandDefinition = {
  verb: CommandVerb.CREATE,
  object: CommandObject.BRANCH,
  description: 'Create a new Git branch',
  parameters: [
    {
      name: 'name',
      type: 'string',
      required: false,
      description: 'Name of the branch to create',
    },
    {
      name: 'from',
      type: 'string',
      required: false,
      description: 'Create branch from existing branch or commit',
    },
    {
      name: 'checkout',
      type: 'boolean',
      required: false,
      defaultValue: true,
      description: 'Checkout the branch after creation',
      aliases: ['c'],
    },
    {
      name: 'issue',
      type: 'number',
      required: false,
      description: 'Create branch from issue number',
    },
  ],
  examples: [
    'create branch --name feature/new-feature',
    'create branch --name hotfix/bug-123 --from main',
    'create branch --issue 456',
    'create branch --name feature/test --checkout false',
  ],
  category: 'git-workflow',
  handler: async (context) => {
    const { logger, t } = context;
    logger.info('Creating branch...');
    logger.info('Would create branch with options:', context.command.parameters);
  },
};

/**
 * Delete branch command definition
 */
export const DELETE_BRANCH: CommandDefinition = {
  verb: CommandVerb.DELETE,
  object: CommandObject.BRANCH,
  description: 'Delete a Git branch',
  parameters: [
    {
      name: 'name',
      type: 'string',
      required: true,
      description: 'Name of the branch to delete',
    },
    {
      name: 'force',
      type: 'boolean',
      required: false,
      defaultValue: false,
      description: 'Force delete branch even if not merged',
      aliases: ['f'],
    },
  ],
  examples: [
    'delete branch --name feature/old-feature',
    'delete branch --name feature/test --force',
  ],
  category: 'git-workflow',
  handler: async (context) => {
    const { logger, t } = context;
    logger.info('Deleting branch...');
    logger.info('Would delete branch with options:', context.command.parameters);
  },
};

/**
 * List branch command definition
 */
export const LIST_BRANCH: CommandDefinition = {
  verb: CommandVerb.LIST,
  object: CommandObject.BRANCH,
  description: 'List all Git branches',
  parameters: [
    {
      name: 'remote',
      type: 'boolean',
      required: false,
      defaultValue: false,
      description: 'Include remote branches in listing',
      aliases: ['r'],
    },
    {
      name: 'format',
      type: 'string',
      required: false,
      description: 'Output format (table, list, json)',
      defaultValue: 'table',
    },
  ],
  examples: [
    'list branch',
    'list branch --remote',
    'list branch --format json',
  ],
  category: 'git-workflow',
  handler: async (context) => {
    const { logger, t } = context;
    logger.info('Listing branches...');
    logger.info('Would list branches with options:', context.command.parameters);
  },
};

/**
 * Switch branch command definition
 */
export const SWITCH_BRANCH: CommandDefinition = {
  verb: CommandVerb.SWITCH,
  object: CommandObject.BRANCH,
  description: 'Switch to a different Git branch',
  parameters: [
    {
      name: 'name',
      type: 'string',
      required: true,
      description: 'Name of the branch to switch to',
    },
    {
      name: 'create',
      type: 'boolean',
      required: false,
      defaultValue: false,
      description: 'Create branch if it doesn\'t exist',
      aliases: ['c'],
    },
  ],
  examples: [
    'switch branch --name main',
    'switch branch --name feature/new --create',
  ],
  category: 'git-workflow',
  handler: async (context) => {
    const { logger, t } = context;
    logger.info('Switching branch...');
    logger.info('Would switch branch with options:', context.command.parameters);
  },
};

/**
 * All branch command definitions
 */
export const COMMANDS: CommandDefinition[] = [
  CREATE_BRANCH,
  DELETE_BRANCH,
  LIST_BRANCH,
  SWITCH_BRANCH,
];