//app/core/models.ts
/**
 * @fileoverview Core models compatibility layer
 * @description Re-exports types from the centralized types module for backward compatibility
 * @author Quartz CLI Team
 * @version 2.0.0
 * @since 2025-11-02
 * @license MIT
 * 
 * @deprecated This file serves as a compatibility layer. New code should import from '@/types' directly.
 * 
 * @example
 *   // Old import (still works)
 *   import {CommandVerb} from "@/types";
import type {CommandDefinition} from "@/types";;
 *   
 *   // New recommended import
 *   import { CommandVerb, CommandDefinition } from '@/types';
 */

// Re-export all enumerations
export {
    CommandVerb,
    CommandObject,
    PlatformType,
    ParameterType,
} from '@/types/enums';

// Re-export all command-related types
export type {
    CommandHandler,
    CommandMiddleware,
    ParameterDefinition,
    CommandDefinition,
    ParsedCommand,
    ExecutionContext,
    ValidationResult,
    ICommandRegistry,
    ICommandParser,
    ICommandDispatcher,
    ExecutionResult,
} from '@/types/commands';