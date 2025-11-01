//app/core/commands/get.ts


import {CommandDefinition} from "@/app/core/interfaces";
import {CommandObject, CommandVerb} from "@/app/core/enums";
import {CommandHandler} from "@/app/core";


/**
 * Set config command handler - sets configuration values for specified keys
 */
const getConfigHandler: CommandHandler = async (context) => {
    const {command} = context;
    const isGlobal = command.parameters.global || false;
};

/**
 * Export get command definitions
 */
export const GET_COMMANDS: CommandDefinition[] = [
    {
        verb: CommandVerb.GET,
        object: CommandObject.CONFIG,
        description: 'Set configuration value for specified key',
        parameters: [
            {
                name: 'global',
                type: 'boolean',
                required: false,
                defaultValue: false,
                description: 'Set in global profile instead of current project profile',
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