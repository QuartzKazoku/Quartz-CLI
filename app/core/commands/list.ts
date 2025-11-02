//app/core/commands/list.ts
import {CommandObject, CommandVerb, ParameterType} from "@/types";
import type {CommandDefinition} from "@/types";
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
 * List branch command handler - displays all available branches
 */
const listBranchHandler: CommandHandler = async (context) => {
    const handler = HandlerFactory.createHandler(CommandVerb.LIST, CommandObject.BRANCH, context);
    await handler.execute();
};

/**
 * List PR command handler - displays current Pull Requests
 */
const listPrHandler: CommandHandler = async (context) => {
    const handler = HandlerFactory.createHandler(CommandVerb.LIST, CommandObject.PR, context);
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
                type: ParameterType.BOOLEAN,
                required: false,
                defaultValue: false,
                description: 'List global profiles instead of project profiles',
                aliases: ['g'],
            },
            {
                name: 'remote',
                type: ParameterType.BOOLEAN,
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
    {
        verb: CommandVerb.LIST,
        object: CommandObject.BRANCH,
        description: 'List all available branches',
        parameters: [
            {
                name: 'remote',
                type: ParameterType.BOOLEAN,
                required: false,
                defaultValue: false,
                description: 'List remote branches instead of local branches',
            },
        ],
        examples: [
            'list branch',
            'list branch --remote',
        ],
        category: 'git-workflow',
        handler: listBranchHandler
    },
    {
        verb: CommandVerb.LIST,
        object: CommandObject.PR,
        description: 'List current Pull Requests',
        parameters: [
            {
                name: 'state',
                type: ParameterType.STRING,
                required: false,
                defaultValue: 'open',
                description: 'PR state filter (open, closed, all)',
                aliases: ['s'],
            },
            {
                name: 'assignee',
                type: ParameterType.STRING,
                required: false,
                defaultValue: '',
                description: 'Filter by assignee username',
                aliases: ['a'],
            },
            {
                name: 'author',
                type: ParameterType.STRING,
                required: false,
                defaultValue: '',
                description: 'Filter by author username',
                aliases: ['u'],
            },
        ],
        examples: [
            'list pr',
            'list pr --state open',
            'list pr -s open',
            'list pr --state closed',
            'list pr --assignee username',
            'list pr -a username',
        ],
        category: 'git-workflow',
        handler: listPrHandler
    },
];