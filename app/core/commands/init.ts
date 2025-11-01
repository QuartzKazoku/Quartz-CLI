//app/core/commands/init.ts
import {CommandDefinition} from '../interfaces';
import {CommandObject, CommandVerb} from '../enums';
import {CommandHandler} from '../types';
import {HandlerFactory} from '@/app/core/factories';

/**
 * Interactive init command handler
 */
const initConfigHandler: CommandHandler = async (context) => {
    const handler = HandlerFactory.createHandler(CommandVerb.INIT, CommandObject.CONFIG, context);
    await handler.execute();
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
            'init --global --skip',
            'init -g -s',
        ],
        category: 'initialization',
        handler: initConfigHandler,
    },
];
