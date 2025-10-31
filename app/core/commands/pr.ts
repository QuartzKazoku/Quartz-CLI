//app/core/commands/pr.ts
/**
 * @fileoverview Pull Request command definitions
 * @description Commands for Pull Request management
 * @author Quartz CLI Team
 * @version 2.0.0
 */


import {CommandDefinition} from "@/app/core/interfaces";
import {CommandObject, CommandVerb} from "@/app/core/enums";

/**
 * Generate PR command definition
 */
export const GENERATE_PR: CommandDefinition = {
  verb: CommandVerb.GENERATE,
  object: CommandObject.PR,
  description: 'Generate AI-powered Pull Request description',
  parameters: [
    {
      name: 'base',
      type: 'string',
      required: false,
      description: 'Base branch for the PR',
      aliases: ['b'],
    },
    {
      name: 'select',
      type: 'boolean',
      required: false,
      defaultValue: false,
      description: 'Interactively select base branch',
      aliases: ['s'],
    },
    {
      name: 'auto',
      type: 'boolean',
      required: false,
      defaultValue: false,
      description: 'Automatically create PR after generation',
      aliases: ['a'],
    },
    {
      name: 'draft',
      type: 'boolean',
      required: false,
      defaultValue: false,
      description: 'Create PR as draft',
    },
    {
      name: 'model',
      type: 'string',
      required: false,
      description: 'OpenAI model to use for generation',
    },
  ],
  examples: [
    'generate pr',
    'generate pr --base main',
    'generate pr --select --auto',
    'generate pr --base develop --draft',
    'generate pr --model gpt-4',
  ],
  category: 'ai-features',
  handler: async (context) => {
    const { logger, t } = context;
    logger.info('Generating PR description...');
    logger.info('Would generate PR with options:', context.command.parameters);
  },
};

/**
 * All PR command definitions
 */
export const COMMANDS: CommandDefinition[] = [
  GENERATE_PR,
];