//app/core/commands/review.ts
/**
 * @fileoverview Review command definitions
 * @description Commands for code review management
 * @author Quartz CLI Team
 * @version 2.0.0
 */


import {CommandDefinition} from "@/app/core/interfaces";
import {CommandObject, CommandVerb} from "@/app/core/enums";

/**
 * Generate review command definition
 */
export const GENERATE_REVIEW: CommandDefinition = {
  verb: CommandVerb.GENERATE,
  object: CommandObject.REVIEW,
  description: 'Generate AI-powered code review',
  parameters: [
    {
      name: 'files',
      type: 'array',
      required: false,
      description: 'Specific files to review (default: all changed files)',
      aliases: ['f'],
    },
    {
      name: 'output',
      type: 'string',
      required: false,
      description: 'Save review results to file',
      aliases: ['o'],
    },
    {
      name: 'severity',
      type: 'string',
      required: false,
      defaultValue: 'all',
      description: 'Minimum severity level (error, warning, info, all)',
    },
    {
      name: 'model',
      type: 'string',
      required: false,
      description: 'OpenAI model to use for review',
    },
    {
      name: 'staged',
      type: 'boolean',
      required: false,
      defaultValue: true,
      description: 'Review only staged changes',
    },
  ],
  examples: [
    'generate review',
    'generate review --files src/app.ts src/utils.ts',
    'generate review --output review.json',
    'generate review --severity error --staged false',
    'generate review --model gpt-4',
  ],
  category: 'ai-features',
  handler: async (context) => {
    const { logger, t } = context;
    logger.info('Generating code review...');
    logger.info('Would generate review with options:', context.command.parameters);
  },
};

/**
 * All review command definitions
 */
export const COMMANDS: CommandDefinition[] = [
  GENERATE_REVIEW,
];