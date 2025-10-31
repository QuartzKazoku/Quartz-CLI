//app/core/commands/init.ts
import { CommandDefinition } from '../interfaces';
import { CommandVerb, CommandObject } from '../enums';
import { CommandHandler } from '../types';

/**
 * Interactive init command handler (equivalent to old config command)
 */
const interactiveInitHandler: CommandHandler = async (context) => {
  const { logger, t } = context;
  
  logger.info(t('init.starting'));
  logger.info(t('init.interactiveMode'));
  logger.info('Would start interactive configuration wizard...');
};

/**
 * Non-interactive init command handler (equivalent to old init command)
 */
const nonInteractiveInitHandler: CommandHandler = async (context) => {
  const { logger, t } = context;
  
  logger.info(t('init.starting'));
  logger.info(t('init.nonInteractiveMode'));
  logger.info('Would initialize project with default settings...');
};

/**
 * Export init command definitions
 */
export const INIT_COMMANDS: CommandDefinition[] = [
  // quartz init (interactive mode - equivalent to old config command)
  {
    verb: CommandVerb.INIT,
    object: CommandObject.PROJECT,
    description: 'Interactive project initialization',
    parameters: [
      {
        name: 'skip',
        type: 'boolean',
        required: false,
        defaultValue: false,
        description: 'Skip interactive setup and use defaults',
        aliases: ['s'],
      },
      {
        name: 'global',
        type: 'boolean',
        required: false,
        defaultValue: false,
        description: 'Initialize global configuration',
        aliases: ['g'],
      },
    ],
    examples: [
      'init',
      'init --skip',
      'init -s',
      'init --global',
      'init -g',
    ],
    category: 'initialization',
    handler: interactiveInitHandler,
  },
  
  // quartz init config (non-interactive mode - equivalent to old init command)
  {
    verb: CommandVerb.INIT,
    object: CommandObject.CONFIG,
    description: 'Non-interactive project initialization',
    parameters: [
      {
        name: 'skip',
        type: 'boolean',
        required: false,
        defaultValue: false,
        description: 'Skip interactive setup and use defaults',
        aliases: ['s'],
      },
      {
        name: 'global',
        type: 'boolean',
        required: false,
        defaultValue: false,
        description: 'Initialize global configuration',
        aliases: ['g'],
      },
    ],
    examples: [
      'init config',
      'init config --skip',
      'init config -s',
      'init config --global',
      'init config -g',
    ],
    category: 'initialization',
    handler: nonInteractiveInitHandler,
  },
];