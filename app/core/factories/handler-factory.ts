//app/core/factories/handler-factory.ts

import {CommandObject, CommandVerb, ExecutionContext} from "@/app/core/models";
import {
    BaseHandler,
    BranchHandler,
    ChangelogHandler,
    CommitHandler,
    GetConfigHandler,
    HelpHandler,
    InitHandler,
    PrHandler,
    ProfileHandler,
    ReviewHandler,
    SetConfigHandler,
    ShowConfigHandler
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
     * Create handler for create branch command
     */
    static createCreateBranchHandler(context: ExecutionContext): BranchHandler {
        return new BranchHandler(context);
    }

    /**
     * Create handler for use branch command
     */
    static createUseBranchHandler(context: ExecutionContext): BranchHandler {
        return new BranchHandler(context);
    }

    /**
     * Create handler for list branch command
     */
    static createListBranchHandler(context: ExecutionContext): BranchHandler {
        return new BranchHandler(context);
    }

    /**
     * Create handler for delete branch command
     */
    static createDeleteBranchHandler(context: ExecutionContext): BranchHandler {
        return new BranchHandler(context);
    }

    /**
     * Create handler for create changelog command
     */
    static createCreateChangelogHandler(context: ExecutionContext): ChangelogHandler {
        return new ChangelogHandler(context);
    }

    /**
     * Create handler for create review command
     */
    static createCreateReviewHandler(context: ExecutionContext): ReviewHandler {
        return new ReviewHandler(context);
    }

    /**
     * Create handler for create commit command
     */
    static createCreateCommitHandler(context: ExecutionContext): CommitHandler {
        return new CommitHandler(context);
    }

    /**
     * Create handler for create PR command
     */
    static createCreatePrHandler(context: ExecutionContext): PrHandler {
        return new PrHandler(context);
    }

    /**
     * Create handler for list PR command
     */
    static createListPrHandler(context: ExecutionContext): PrHandler {
        return new PrHandler(context);
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
     * Handle GET verb commands
     * @param object 
     * @param context 
     * @returns 
     */
    private static handleGetVerb(object: CommandObject, context: ExecutionContext): BaseHandler | null {
        switch (object) {
            case CommandObject.CONFIG:
                return this.createGetConfigHandler(context);
            default:
                return null;
        }
    }

    /**
     * Handle SET verb commands
     * @param object 
     * @param context 
     * @returns 
     */
    private static handleSetVerb(object: CommandObject, context: ExecutionContext): BaseHandler | null {
        switch (object) {
            case CommandObject.CONFIG:
                return this.createSetConfigHandler(context);
            case CommandObject.PROFILE:
                return this.createSetProfileHandler(context);
            default:
                return null;
        }
    }

    /**
     * Handle CREATE verb commands
     * @param object 
     * @param context 
     * @returns 
     */
    private static handleCreateVerb(object: CommandObject, context: ExecutionContext): BaseHandler | null {
        switch (object) {
            case CommandObject.PROFILE:
                return this.createCreateProfileHandler(context);
            case CommandObject.BRANCH:
                return this.createCreateBranchHandler(context);
            case CommandObject.CHANGELOG:
                return this.createCreateChangelogHandler(context);
            case CommandObject.REVIEW:
                return this.createCreateReviewHandler(context);
            case CommandObject.COMMIT:
                return this.createCreateCommitHandler(context);
            case CommandObject.PR:
                return this.createCreatePrHandler(context);
            default:
                return null;
        }
    }

    /**
     * Handle USE verb commands
     * @param object 
     * @param context 
     * @returns 
     */
    private static handleUseVerb(object: CommandObject, context: ExecutionContext): BaseHandler | null {
        switch (object) {
            case CommandObject.PROFILE:
                return this.createUseProfileHandler(context);
            case CommandObject.BRANCH:
                return this.createUseBranchHandler(context);
            default:
                return null;
        }
    }

    /**
     * Handle LIST verb commands
     * @param object 
     * @param context 
     * @returns 
     */
    private static handleListVerb(object: CommandObject, context: ExecutionContext): BaseHandler | null {
        switch (object) {
            case CommandObject.PROFILE:
                return this.createListProfileHandler(context);
            case CommandObject.BRANCH:
                return this.createListBranchHandler(context);
            case CommandObject.PR:
                return this.createListPrHandler(context);
            default:
                return null;
        }
    }

    /**
     * Handle DELETE verb commands
     * @param object 
     * @param context 
     * @returns 
     */
    private static handleDeleteVerb(object: CommandObject, context: ExecutionContext): BaseHandler | null {
        switch (object) {
            case CommandObject.PROFILE:
                return this.createDeleteProfileHandler(context);
            case CommandObject.BRANCH:
                return this.createDeleteBranchHandler(context);
            default:
                return null;
        }
    }

    /**
     * Handle SHOW verb commands
     * @param object 
     * @param context 
     * @returns 
     */
    private static handleShowVerb(object: CommandObject, context: ExecutionContext): BaseHandler | null {
        switch (object) {
            case CommandObject.CONFIG:
                return this.createShowConfigHandler(context);
            case CommandObject.PROFILE:
                return this.createShowProfileHandler(context);
            default:
                return null;
        }
    }

    /**
     * Handle HELP verb commands
     * @param _object
     * @param context 
     * @returns 
     */
    private static handleHelpVerb(_object: CommandObject, context: ExecutionContext): BaseHandler | null {
        // HELP verb doesn't use object parameter
        return this.createHelpHandler(context);
    }

    /**
     * Handle INIT verb commands
     * @param object 
     * @param context 
     * @returns 
     */
    private static handleInitVerb(object: CommandObject, context: ExecutionContext): BaseHandler | null {
        switch (object) {
            case CommandObject.CONFIG:
                return this.createInitHandler(context);
            default:
                return null;
        }
    }

    /**
     * Create handler based on verb and object
     */
    static createHandler(verb: CommandVerb, object: CommandObject, context: ExecutionContext): BaseHandler {
        let handler: BaseHandler | null = null;

        switch (verb) {
            case CommandVerb.GET:
                handler = this.handleGetVerb(object, context);
                break;
            case CommandVerb.SET:
                handler = this.handleSetVerb(object, context);
                break;
            case CommandVerb.CREATE:
                handler = this.handleCreateVerb(object, context);
                break;
            case CommandVerb.USE:
                handler = this.handleUseVerb(object, context);
                break;
            case CommandVerb.LIST:
                handler = this.handleListVerb(object, context);
                break;
            case CommandVerb.DELETE:
                handler = this.handleDeleteVerb(object, context);
                break;
            case CommandVerb.SHOW:
                handler = this.handleShowVerb(object, context);
                break;
            case CommandVerb.HELP:
                handler = this.handleHelpVerb(object, context);
                break;
            case CommandVerb.INIT:
                handler = this.handleInitVerb(object, context);
                break;
        }

        if (handler) {
            return handler;
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
            'SetProfileHandler',
            'CreateBranchHandler',
            'UseBranchHandler',
            'ListBranchHandler',
            'DeleteBranchHandler',
            'CreateChangelogHandler',
            'CreateReviewHandler',
            'CreateCommitHandler',
            'CreatePrHandler',
            'ListPrHandler'
        ];
    }

    /**
     * Check if handler exists
     */
    static handlerExists(handlerName: string): boolean {
        return this.getAvailableHandlers().includes(handlerName);
    }
}