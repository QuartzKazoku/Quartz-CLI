//app/core/index.ts
/**
 * @fileoverview Core command system module entry point
 * @description Exports all core components for the new command architecture
 * @author Quartz CLI Team
 * @version 2.0.0
 */

// Type definitions and enums
export * from './models';

// Core components
export { CommandRegistry, commandRegistry } from './registry';
export { CommandExecutor, BuiltinMiddleware, commandExecutor } from './executor';
export { CommandParser, commandParser } from './parser';
export { CommandDispatcher, commandDispatcher } from './dispatcher';

// Command definitions
export { ALL_COMMANDS } from './commands';

// Re-export commonly used types for convenience


/**
 * Initialize the command system by registering all commands
 */
export async function initializeCommandSystem(): Promise<void> {
  const { commandRegistry } = await import('./registry');
  const { ALL_COMMANDS } = await import('./commands');
  
  // Clear any existing commands
  commandRegistry.clear();
  
  // Register all commands
  for (const command of ALL_COMMANDS) {
    commandRegistry.register(command);
  }
}

/**
 * Auto-initialize the command system when this module is imported
 */
// Note: We don't auto-initialize here to avoid module format issues
// The initialization will be called from the main entry point