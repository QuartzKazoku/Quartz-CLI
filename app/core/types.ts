//app/core/types.ts

import {ExecutionContext} from "@/app/core/interfaces";

/**
 * Command handler function type
 */
export type CommandHandler = (context: ExecutionContext) => Promise<void> | void;

/**
 * Command middleware function type
 */
export type CommandMiddleware = (context: ExecutionContext, next: () => Promise<void>) => Promise<void>;


