//app/core/factories/handler-factory.ts

import {ExecutionContext} from "@/app/core/interfaces";
import {CommandObject, CommandVerb} from "@/app/core/enums";
import {
    GetConfigHandler,
    SetConfigHandler,
    ShowConfigHandler,
    HelpHandler,
    InitHandler,
    ProfileHandler,
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
     * Create handler for create profile command
     */
    static createCreateProfileHandler(context: ExecutionContext): ProfileHandler {
        return new ProfileHandler(context);
    }

    /**
     * Create handler for use profile command
     */
    static createUseProfileHandler(context: ExecutionContext): ProfileHandler {
        return new ProfileHandler(context);
    }

    /**
     * Create handler for list profile command
     */
    static createListProfileHandler(context: ExecutionContext): ProfileHandler {
        return new ProfileHandler(context);
    }

    /**
     * Create handler for delete profile command
     */
    static createDeleteProfileHandler(context: ExecutionContext): ProfileHandler {
        return new ProfileHandler(context);
    }

    /**
     * Create handler for set profile command (rename profile)
     */
    static createSetProfileHandler(context: ExecutionContext): ProfileHandler {
        return new ProfileHandler(context);
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
                } else if (object === CommandObject.PROFILE) {
                    return this.createSetProfileHandler(context);
                }
                break;
            
            case CommandVerb.CREATE:
                if (object === CommandObject.PROFILE) {
                    return this.createCreateProfileHandler(context);
                }
                break;
            
            case CommandVerb.USE:
                if (object === CommandObject.PROFILE) {
                    return this.createUseProfileHandler(context);
                }
                break;
            
            case CommandVerb.LIST:
                if (object === CommandObject.PROFILE) {
                    return this.createListProfileHandler(context);
                }
                break;
            
            case CommandVerb.DELETE:
                if (object === CommandObject.PROFILE) {
                    return this.createDeleteProfileHandler(context);
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
            'InitHandler',
            'CreateProfileHandler',
            'UseProfileHandler',
            'ListProfileHandler',
            'DeleteProfileHandler',
            'SetProfileHandler'
        ];
    }

    /**
     * Check if handler exists
     */
    static handlerExists(handlerName: string): boolean {
        return this.getAvailableHandlers().includes(handlerName);
    }
}