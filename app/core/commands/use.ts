//app/core/commands/use.ts
import {CommandDefinition} from "@/app/core/interfaces";
import {CommandObject, CommandVerb} from "@/app/core/enums";
import {CommandHandler} from "@/app/core";
import {HandlerFactory} from "@/app/core/factories/handler-factory";

/**
 * Use profile command handler - switches to a different configuration profile
 */
const useProfileHandler: CommandHandler = async (context) => {
    const handler = HandlerFactory.createHandler(CommandVerb.USE, CommandObject.PROFILE, context);
    await handler.execute();
};

/**
 * Export use command definitions
 */
export const USE_COMMANDS: CommandDefinition[] = [
    {
        verb: CommandVerb.USE,
        object: CommandObject.PROFILE,
        description: 'Switch to a different configuration profile',
        parameters: [
            {
                name: 'global',
                type: 'boolean',
                required: false,
                defaultValue: false,
                description: 'Use global profile instead of project profile',
                aliases: ['g'],
            },
            {
                name: 'remote',
                type: 'boolean',
                required: false,
                defaultValue: false,
                description: 'Use remote profile instead of local profile',
                aliases: ['r'],
            },
        ],
        examples: [
            'use profile my-profile',
            'use profile my-profile --global',
            'use profile my-profile -g',
            'use profile my-profile --remote',
            'use profile my-profile -r',
        ],
        category: 'configuration',
        handler: useProfileHandler
    },
];