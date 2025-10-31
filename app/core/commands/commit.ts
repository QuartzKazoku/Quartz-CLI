//app/core/commands/commit.ts
/**
 * @fileoverview Commit command definitions
 * @description Commands for Git commit management
 * @author Quartz CLI Team
 * @version 2.0.0
 */



import {CommandDefinition} from "@/app/core/interfaces";
import {CommandObject, CommandVerb} from "@/app/core/enums";

/**
 * Generate commit command definition
 */
export const GENERATE_COMMIT: CommandDefinition = {
  verb: CommandVerb.GENERATE,
  object: CommandObject.COMMIT,
  description: 'Generate AI-powered commit message',
  parameters: [
    {
      name: 'edit',
      type: 'boolean',
      required: false,
      defaultValue: false,
      description: 'Edit the generated commit message before committing',
      aliases: ['e'],
    },
    {
      name: 'stage',
      type: 'boolean',
      required: false,
      defaultValue: true,
      description: 'Stage all changes before generating commit',
      aliases: ['s'],
    },
    {
      name: 'count',
      type: 'number',
      required: false,
      defaultValue: 3,
      description: 'Number of commit message options to generate',
    },
    {
      name: 'model',
      type: 'string',
      required: false,
      description: 'OpenAI model to use for generation',
    },
  ],
  examples: [
    'generate commit',
    'generate commit --edit',
    'generate commit --stage false',
    'generate commit --count 5 --model gpt-4',
  ],
  category: 'ai-features',
  handler: async (context) => {
    const { logger, t } = context;
    logger.info('Generating commit message...');
    logger.info('Would generate commit with options:', context.command.parameters);
  },
};

/**
 * All commit command definitions
 */
export const COMMANDS: CommandDefinition[] = [
  GENERATE_COMMIT,
];