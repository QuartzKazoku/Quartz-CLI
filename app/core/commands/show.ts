//app/core/commands/show.ts

import type {CommandDefinition} from "@/types";;
import {CommandObject, CommandVerb} from "@/types";;
import {CommandHandler} from "@/app/core";
import {HandlerFactory} from "@/app/core/factories/handler-factory";

/**
 * Show config command handler - displays all current configurations
 */
const showConfigHandler: CommandHandler = async (context) => {
    const handler = HandlerFactory.createHandler(CommandVerb.SHOW, CommandObject.CONFIG, context);
    await handler.execute();
};

/**
 * Show profile command handler - displays current profile configuration
 */
const showProfileHandler: CommandHandler = async (context) => {
    const handler = HandlerFactory.createHandler(CommandVerb.SHOW, CommandObject.PROFILE, context);
    await handler.execute();
};

/**
 * Export show command definitions
 */
export const SHOW_COMMANDS: CommandDefinition[] = [
    {
        verb: CommandVerb.SHOW,
        object: CommandObject.CONFIG,
        description: 'Display all current configurations with priority information',
        parameters: [
            {
                name: 'global',
                type: ParameterType.BOOLEAN,
                required: false,
                defaultValue: false,
                description: 'Show global configuration instead of project configuration',
                aliases: ['g'],
            },
        ],
        examples: [
            'show config',
            'show config --global',
            'show config -g',
        ],
        category: 'show',
        handler: showConfigHandler
    }, {
        verb: CommandVerb.SHOW,
        object: CommandObject.PROFILE,
        description: 'Display current active profile configuration',
        parameters: [
            {
                name: 'global',
                type: ParameterType.BOOLEAN,
                required: false,
                defaultValue: false,
                description: 'Show global profile instead of project profile',
                aliases: ['g'],
            }
        ],
        examples: [
            'show profile',
            'show profile --global',
            'show profile -g',
        ],
        category: 'show',
        handler: showProfileHandler
    },
];