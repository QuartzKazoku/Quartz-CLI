//app/core/commands/init.ts
import {CommandDefinition} from '../interfaces';
import {CommandVerb, CommandObject} from '../enums';
import {CommandHandler} from '../types';

/**
 * Handle local interactive initialization
 */
const handleLocalInteractive: CommandHandler = async (context) => {
    const {logger, t} = context;
    logger.info(t('init.starting'));
    logger.info(t('init.interactiveMode'));
    logger.info('Would start interactive configuration wizard for local config...');
};

/**
 * Handle local non-interactive initialization
 */
const handleLocalNonInteractive: CommandHandler = async (context) => {
    const {logger, t} = context;
    logger.info(t('init.starting'));
    logger.info(t('init.nonInteractiveMode'));
    logger.info('Would start non-interactive configuration for local config...');
};

/**
 * Handle global interactive initialization
 */
const handleGlobalInteractive: CommandHandler = async (context) => {
    const {logger, t} = context;
    logger.info(t('init.starting'));
    logger.info(t('init.interactiveMode'));
    logger.info('Would start interactive configuration wizard for global config...');
};

/**
 * Handle global non-interactive initialization
 */
const handleGlobalNonInteractive: CommandHandler = async (context) => {
    const {logger, t} = context;
    logger.info(t('init.starting'));
    logger.info(t('init.nonInteractiveMode'));
    logger.info('Would start non-interactive configuration for global config...');
};

/**
 * Interactive init command handler
 */
const interactiveInitHandler: CommandHandler = async (context) => {
    const {command} = context;
    const isGlobal = command.parameters.global || false;
    const skipInteractive = command.parameters.skip || false;
    if (isGlobal && skipInteractive) {
        await handleGlobalNonInteractive(context);
    } else if (isGlobal) {
        await handleGlobalInteractive(context);
    } else if (skipInteractive) {
        await handleLocalNonInteractive(context);
    } else {
        await handleLocalInteractive(context);
    }
};

/**
 * Export init command definitions
 */
export const INIT_COMMANDS: CommandDefinition[] = [
    {
        verb: CommandVerb.INIT,
        object: CommandObject.CONFIG,
        description: 'Interactive Config initialization',
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
];
