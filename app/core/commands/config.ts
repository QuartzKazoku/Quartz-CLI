//app/core/commands/config.ts
/**
 * @fileoverview Config command definitions
 * @description Commands for configuration management
 * @author Quartz CLI Team
 * @version 2.0.0
 */


import {CommandDefinition} from "@/app/core/interfaces";
import {CommandObject, CommandVerb} from "@/app/core/enums";

/**
 * List config command definition
 */
export const LIST_CONFIG: CommandDefinition = {
  verb: CommandVerb.LIST,
  object: CommandObject.CONFIG,
  description: 'Display current configuration settings',
  parameters: [
    {
      name: 'global',
      type: 'boolean',
      required: false,
      defaultValue: false,
      description: 'Show global configuration instead of project',
      aliases: ['g'],
    },
    {
      name: 'profile',
      type: 'string',
      required: false,
      description: 'Show configuration for a specific profile',
      aliases: ['p'],
    },
  ],
  examples: [
    'list config',
    'list config --global',
    'list config --profile work',
  ],
  category: 'configuration',
  handler: async (context) => {
    const { logger, t } = context;
    logger.info('Listing configuration...');
    logger.info('Would show config with options:', context.command.parameters);
  },
};

/**
 * Set config command definition
 */
export const SET_CONFIG: CommandDefinition = {
  verb: CommandVerb.SET,
  object: CommandObject.CONFIG,
  description: 'Set a configuration value',
  parameters: [
    {
      name: 'key',
      type: 'string',
      required: true,
      description: 'Configuration key to set',
    },
    {
      name: 'value',
      type: 'string',
      required: true,
      description: 'Value to set for the key',
    },
    {
      name: 'global',
      type: 'boolean',
      required: false,
      defaultValue: false,
      description: 'Set in global configuration instead of project',
      aliases: ['g'],
    },
    {
      name: 'profile',
      type: 'string',
      required: false,
      description: 'Set in a specific configuration profile',
      aliases: ['p'],
    },
  ],
  examples: [
    'set config --key openai.apiKey --value sk-xxx',
    'set config --key openai.model --value gpt-4 --global',
    'set config --key language.ui --value zh-CN --profile work',
  ],
  category: 'configuration',
  handler: async (context) => {
    const { logger, t } = context;
    logger.info('Setting configuration...');
    logger.info('Would set config with options:', context.command.parameters);
  },
};

/**
 * Get config command definition
 */
export const GET_CONFIG: CommandDefinition = {
  verb: CommandVerb.GET,
  object: CommandObject.CONFIG,
  description: 'Get a specific configuration value',
  parameters: [
    {
      name: 'key',
      type: 'string',
      required: true,
      description: 'Configuration key to retrieve',
    },
    {
      name: 'global',
      type: 'boolean',
      required: false,
      defaultValue: false,
      description: 'Get from global configuration instead of project',
      aliases: ['g'],
    },
    {
      name: 'profile',
      type: 'string',
      required: false,
      description: 'Get from a specific configuration profile',
      aliases: ['p'],
    },
  ],
  examples: [
    'get config --key openai.apiKey',
    'get config --key openai.model --global',
    'get config --key language.ui --profile work',
  ],
  category: 'configuration',
  handler: async (context) => {
    const { logger, t } = context;
    logger.info('Getting configuration...');
    logger.info('Would get config with options:', context.command.parameters);
  },
};

/**
 * All config command definitions
 */
export const COMMANDS: CommandDefinition[] = [
  LIST_CONFIG,
  SET_CONFIG,
  GET_CONFIG,
];