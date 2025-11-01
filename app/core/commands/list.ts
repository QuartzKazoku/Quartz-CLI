//app/core/commands/list.ts
import {CommandDefinition} from "@/app/core/interfaces";
import {CommandObject, CommandVerb} from "@/app/core/enums";
import {CommandHandler} from "@/app/core";
import {HandlerFactory} from "@/app/core/factories/handler-factory";

/**
 * List profile command handler - displays all available configuration profiles
 */
const listProfileHandler: CommandHandler = async (context) => {
    const handler = HandlerFactory.createHandler(CommandVerb.LIST, CommandObject.PROFILE, context);
    await handler.execute();
};

/**
 * Export list command definitions
 */
export const LIST_COMMANDS: CommandDefinition[] = [
    {
        verb: CommandVerb.LIST,
        object: CommandObject.PROFILE,
        description: 'List all available configuration profiles',
        parameters: [
            {
                name: 'global',
                type: 'boolean',
                required: false,
                defaultValue: false,
                description: 'List global profiles instead of project profiles',
                aliases: ['g'],
            },
            {
                name: 'remote',
                type: 'boolean',
                required: false,
                defaultValue: false,
                description: 'List remote profiles instead of local profiles',
                aliases: ['r'],
            },
        ],
        examples: [
            'list profile',
            'list profile --global',
            'list profile -g',
            'list profile --remote',
            'list profile -r',
        ],
        category: 'configuration',
        handler: listProfileHandler
    },
];