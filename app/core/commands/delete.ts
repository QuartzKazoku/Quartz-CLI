//app/core/commands/delete.ts
import {CommandDefinition} from "@/app/core/interfaces";
import {CommandObject, CommandVerb} from "@/app/core/enums";
import {CommandHandler} from "@/app/core";
import {HandlerFactory} from "@/app/core/factories/handler-factory";

/**
 * Delete profile command handler - removes a configuration profile
 */
const deleteProfileHandler: CommandHandler = async (context) => {
    const handler = HandlerFactory.createHandler(CommandVerb.DELETE, CommandObject.PROFILE, context);
    await handler.execute();
};

/**
 * Delete branch command handler - removes a branch
 */
const deleteBranchHandler: CommandHandler = async (context) => {
    const handler = HandlerFactory.createHandler(CommandVerb.DELETE, CommandObject.BRANCH, context);
    await handler.execute();
};

/**
 * Export delete command definitions
 */
export const DELETE_COMMANDS: CommandDefinition[] = [
    {
        verb: CommandVerb.DELETE,
        object: CommandObject.PROFILE,
        description: 'Delete a configuration profile',
        parameters: [
            {
                name: 'global',
                type: 'boolean',
                required: false,
                defaultValue: false,
                description: 'Delete from global profiles instead of project profiles',
                aliases: ['g'],
            },
            {
                name: 'remote',
                type: 'boolean',
                required: false,
                defaultValue: false,
                description: 'Delete from remote profiles instead of local profiles',
                aliases: ['r'],
            },
        ],
        examples: [
            'delete profile my-profile',
            'delete profile my-profile --global',
            'delete profile my-profile -g',
            'delete profile my-profile --remote',
            'delete profile my-profile -r',
        ],
        category: 'configuration',
        handler: deleteProfileHandler
    },
    {
        verb: CommandVerb.DELETE,
        object: CommandObject.BRANCH,
        description: 'Delete a branch',
        parameters: [
            {
                name: 'remote',
                type: 'boolean',
                required: false,
                defaultValue: false,
                description: 'Delete remote branch instead of local branch',
            },
        ],
        examples: [
            'delete branch feature/new-feature',
            'delete branch feature/new-feature --remote',
        ],
        category: 'git-workflow',
        handler: deleteBranchHandler
    },
];