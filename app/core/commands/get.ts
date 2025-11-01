//app/core/commands/get.ts

import {CommandDefinition} from "@/app/core/models";
import {CommandObject, CommandVerb} from "@/app/core/models";
import {CommandHandler} from "@/app/core";
import {HandlerFactory} from "@/app/core/factories/handler-factory";

/**
 * Get config command handler - gets configuration values for specified keys
 */
const getConfigHandler: CommandHandler = async (context) => {
    const handler = HandlerFactory.createHandler(CommandVerb.GET, CommandObject.CONFIG, context);
    await handler.execute();
};

/**
 * Export get command definitions
 */
export const GET_COMMANDS: CommandDefinition[] = [
    {
        verb: CommandVerb.GET,
        object: CommandObject.CONFIG,
        description: 'Get configuration value for specified key',
        parameters: [
            {
                name: 'global',
                type: 'boolean',
                required: false,
                defaultValue: false,
                description: 'Get from global profile only (ignore project config and environment variables)',
                aliases: ['g'],
            },
        ],
        examples: [
            'get config OPENAI_API_KEY',
            'get config OPENAI_MODEL',
            'get config QUARTZ_LANG --global',
            'get config GITHUB_TOKEN -g',
        ],
        category: 'configuration',
        handler: getConfigHandler
    },
];