//app/core/commands/create.ts
import {CommandDefinition} from "@/app/core/interfaces";
import {CommandObject, CommandVerb} from "@/app/core/enums";
import {CommandHandler} from "@/app/core";
import {HandlerFactory} from "@/app/core/factories/handler-factory";

/**
 * Create profile command handler - creates a new configuration profile
 */
const createProfileHandler: CommandHandler = async (context) => {
    const handler = HandlerFactory.createHandler(CommandVerb.CREATE, CommandObject.PROFILE, context);
    await handler.execute();
};

/**
 * Export create command definitions
 */
export const CREATE_COMMANDS: CommandDefinition[] = [
    {
        verb: CommandVerb.CREATE,
        object: CommandObject.PROFILE,
        description: 'Create a new configuration profile',
        parameters: [
            {
                name: 'global',
                type: 'boolean',
                required: false,
                defaultValue: false,
                description: 'Create in global profiles instead of project profiles',
                aliases: ['g'],
            },
            {
                name: 'remote',
                type: 'boolean',
                required: false,
                defaultValue: false,
                description: 'Create in remote profiles instead of local profiles',
                aliases: ['r'],
            },
        ],
        examples: [
            'create profile my-profile',
            'create profile my-profile --global',
            'create profile my-profile -g',
            'create profile my-profile --remote',
            'create profile my-profile -r',
        ],
        category: 'configuration',
        handler: createProfileHandler
    },
];