//app/core/factories/handler-factory.ts

import {ExecutionContext} from "@/app/core/interfaces";
import {CommandObject, CommandVerb} from "@/app/core/enums";
import {
    GetConfigHandler,
    SetConfigHandler,
    ShowConfigHandler,
    HelpHandler,
    InitHandler,
    BaseHandler
} from "@/app/core/handlers";

/**
 * Handler factory class
 * Creates appropriate handler instances based on verb and object
 */
export class HandlerFactory {
    /**
     * Create handler for get config command
     */
    static createGetConfigHandler(context: ExecutionContext): GetConfigHandler {
        return new GetConfigHandler(context);
    }

    /**
     * Create handler for set config command
     */
    static createSetConfigHandler(context: ExecutionContext): SetConfigHandler {
        return new SetConfigHandler(context);
    }

    /**
     * Create handler for show config command
     */
    static createShowConfigHandler(context: ExecutionContext): ShowConfigHandler {
        return new ShowConfigHandler(context);
    }

    /**
     * Create handler for show profile command
     */
    static createShowProfileHandler(context: ExecutionContext): ShowConfigHandler {
        return new ShowConfigHandler(context);
    }

    /**
     * Create handler for help command
     */
    static createHelpHandler(context: ExecutionContext): HelpHandler {
        return new HelpHandler(context);
    }

    /**
     * Create handler for init command
     */
    static createInitHandler(context: ExecutionContext): InitHandler {
        return new InitHandler(context);
    }

    /**
     * Create handler based on verb and object
     */
    static createHandler(verb: CommandVerb, object: CommandObject, context: ExecutionContext): BaseHandler {
        switch (verb) {
            case CommandVerb.GET:
                if (object === CommandObject.CONFIG) {
                    return this.createGetConfigHandler(context);
                }
                break;
            
            case CommandVerb.SET:
                if (object === CommandObject.CONFIG) {
                    return this.createSetConfigHandler(context);
                }
                break;
            
            case CommandVerb.SHOW:
                if (object === CommandObject.CONFIG) {
                    return this.createShowConfigHandler(context);
                } else if (object === CommandObject.PROFILE) {
                    return this.createShowProfileHandler(context);
                }
                break;
            
            case CommandVerb.HELP:
                return this.createHelpHandler(context);
            
            case CommandVerb.INIT:
                if (object === CommandObject.CONFIG) {
                    return this.createInitHandler(context);
                }
                break;
        }

        throw new Error(`No handler found for command: ${verb} ${object}`);
    }

    /**
     * Get all available handler types
     */
    static getAvailableHandlers(): string[] {
        return [
            'GetConfigHandler',
            'SetConfigHandler', 
            'ShowConfigHandler',
            'HelpHandler',
            'InitHandler'
        ];
    }

    /**
     * Check if handler exists
     */
    static handlerExists(handlerName: string): boolean {
        return this.getAvailableHandlers().includes(handlerName);
    }
}