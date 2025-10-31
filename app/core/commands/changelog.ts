//app/core/commands/changelog.ts
/**
 * @fileoverview Changelog command definitions
 * @description Commands for changelog management
 * @author Quartz CLI Team
 * @version 2.0.0
 */


import {CommandDefinition} from "@/app/core/interfaces";
import {CommandObject, CommandVerb} from "@/app/core/enums";

/**
 * Generate changelog command definition
 */
export const GENERATE_CHANGELOG: CommandDefinition = {
  verb: CommandVerb.GENERATE,
  object: CommandObject.CHANGELOG,
  description: 'Generate AI-powered changelog',
  parameters: [
    {
      name: 'from',
      type: 'string',
      required: false,
      description: 'Starting tag or commit for changelog',
    },
    {
      name: 'to',
      type: 'string',
      required: false,
      defaultValue: 'HEAD',
      description: 'Ending tag or commit for changelog',
    },
    {
      name: 'output',
      type: 'string',
      required: false,
      description: 'Save changelog to file',
      aliases: ['o'],
    },
    {
      name: 'format',
      type: 'string',
      required: false,
      defaultValue: 'markdown',
      description: 'Output format (markdown, json, html)',
    },
    {
      name: 'template',
      type: 'string',
      required: false,
      description: 'Use a specific changelog template',
    },
    {
      name: 'model',
      type: 'string',
      required: false,
      description: 'OpenAI model to use for generation',
    },
  ],
  examples: [
    'generate changelog',
    'generate changelog --from v1.0.0 --to v2.0.0',
    'generate changelog --output CHANGELOG.md',
    'generate changelog --format json --from v1.5.0',
    'generate changelog --template conventional --model gpt-4',
  ],
  category: 'ai-features',
  handler: async (context) => {
    const { logger, t } = context;
    logger.info('Generating changelog...');
    logger.info('Would generate changelog with options:', context.command.parameters);
  },
};

/**
 * All changelog command definitions
 */
export const COMMANDS: CommandDefinition[] = [
  GENERATE_CHANGELOG,
];