//app/core/commands/set.ts

import {CommandDefinition} from "@/app/core/interfaces";
import {CommandObject, CommandVerb} from "@/app/core/enums";
import {CommandHandler} from "@/app/core";
import {HandlerFactory} from "@/app/core/factories/handler-factory";

/**
 * Set config command handler - sets configuration values for specified keys
 */
const setConfigHandler: CommandHandler = async (context) => {
    const handler = HandlerFactory.createHandler(CommandVerb.SET, CommandObject.CONFIG, context);
    await handler.execute();
};

/**
 * Export set command definitions
 */
export const SET_COMMANDS: CommandDefinition[] = [
    {
        verb: CommandVerb.SET,
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
            'set config OPENAI_API_KEY sk-your-key',
            'set config OPENAI_MODEL gpt-4',
            'set config QUARTZ_LANG zh-CN --global',
            'set config GITHUB_TOKEN ghp_your-token -g',
        ],
        category: 'configuration',
        handler: setConfigHandler
    },
];