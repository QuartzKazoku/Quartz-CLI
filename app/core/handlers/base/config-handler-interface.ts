//app/core/handlers/base/config-handler-interface.ts

import {ICommandHandler} from "./base-handler";

/**
 * Configuration handler interface
 * Extends base handler with config-specific methods
 */
export interface IConfigHandler extends ICommandHandler {
    /**
     * Get configuration value for specified key
     */
    getConfigValue(key: string, isGlobal?: boolean): void;

    /**
     * Set configuration value for specified key
     */
    setConfigValue(key: string, value: string, isGlobal?: boolean): void;

    /**
     * Show all configuration values
     */
    showAllConfig(isGlobal?: boolean): void;

    /**
     * Show current profile configuration
     */
    showProfileConfig(isGlobal?: boolean): void;
}