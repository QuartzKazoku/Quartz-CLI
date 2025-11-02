//app/core/commands/set.ts

import type {CommandDefinition} from "@/types";;
import {CommandObject, CommandVerb} from "@/types";;
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
 * Set profile command handler - renames a configuration profile
 */
const setProfileHandler: CommandHandler = async (context) => {
    const handler = HandlerFactory.createHandler(CommandVerb.SET, CommandObject.PROFILE, context);
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
                type: ParameterType.BOOLEAN,
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
    {
        verb: CommandVerb.SET,
        object: CommandObject.PROFILE,
        description: 'Rename a configuration profile',
        parameters: [
            {
                name: 'global',
                type: ParameterType.BOOLEAN,
                required: false,
                defaultValue: false,
                description: 'Rename in global profiles instead of project profiles',
                aliases: ['g'],
            },
            {
                name: 'remote',
                type: ParameterType.BOOLEAN,
                required: false,
                defaultValue: false,
                description: 'Rename in remote profiles instead of local profiles',
                aliases: ['r'],
            },
        ],
        examples: [
            'set profile old-name new-name',
            'set profile old-name new-name --global',
            'set profile old-name new-name -g',
            'set profile old-name new-name --remote',
            'set profile old-name new-name -r',
        ],
        category: 'configuration',
        handler: setProfileHandler
    },
];