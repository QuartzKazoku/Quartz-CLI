//app/core/commands/set.ts
import {CommandObject, CommandVerb} from "@/app/core/enums";
import {CommandDefinition} from "@/app/core/interfaces";
import {CommandHandler} from "@/app/core";


const setHandler: CommandHandler = async (context) => {
    const {command} = context;
    const isGlobal = command.parameters.global || false;

};


/**
 * Export show command definitions
 */
export const SET_COMMANDS: CommandDefinition[] = [
    {
        verb: CommandVerb.SET,
        object: CommandObject.CONFIG,
        description: '',
        parameters: [
            {
                name: 'global',
                type: 'boolean',
                required: false,
                defaultValue: false,
                description: 'Set global configuration instead of project configuration',
                aliases: ['g'],
            },
        ],
        examples: [
            'set config <key> <value>',
            'set config <key> <value> --global',
            'set config <key> <value> -g',
        ],
        category: 'set',
        handler: setHandler
    }
];