//app/core/commands/show.ts

import {CommandDefinition} from "@/app/core/interfaces";
import {CommandObject, CommandVerb} from "@/app/core/enums";
import {CommandHandler} from "@/app/core";


/**
 * Interactive init command handler
 */
const showConfigHandler: CommandHandler = async (context) => {
    const {command} = context;
    const isGlobal = command.parameters.global || false;

};
/**
 * Interactive init command handler
 */
const showProfileHandler: CommandHandler = async (context) => {
    const {command} = context;
    const isGlobal = command.parameters.global || false;

};

/**
 * Export init command definitions
 */
export const SHOW_COMMANDS: CommandDefinition[] = [
    {
        verb: CommandVerb.SHOW,
        object: CommandObject.CONFIG,
        description: 'show config',
        parameters: [
            {
                name: 'global',
                type: 'boolean',
                required: false,
                defaultValue: false,
                description: 'Initialize global configuration',
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
        description: 'show ',
        parameters: [
            {
                name: 'global',
                type: 'boolean',
                required: false,
                defaultValue: false,
                description: 'Initialize global configuration',
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