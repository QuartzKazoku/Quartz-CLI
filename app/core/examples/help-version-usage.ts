//app/core/examples/help-version-usage.ts
/**
 * @fileoverview Help and Version command usage examples
 * @description Demonstrates the new hierarchical help system and version command
 * @author Quartz CLI Team
 * @version 2.0.0
 */

import { CommandDispatcher } from '../command-dispatcher';
import { CommandParser } from '../command-parser';
import { CommandRegistry } from '../registry';
import { ALL_COMMANDS } from '../commands';

// Initialize the command system
const registry = new CommandRegistry();
const parser = new CommandParser(registry);
const dispatcher = new CommandDispatcher(registry);

// Register all commands
ALL_COMMANDS.forEach(command => {
  registry.register(command);
});

/**
 * Example 1: Show all available verbs
 * Command: quartz help
 */
export async function showAllVerbs() {
  console.log('=== Example 1: Show all available verbs ===');
  
  const parsedCommand = parser.parse(['help']);
  const context = {
    command: parsedCommand,
    config: {},
    logger: console,
    t: (key: string, params?: any) => key, // Simplified translation
    cwd: process.cwd(),
    env: process.env
  };
  
  await dispatcher.dispatch(parsedCommand, context);
}

/**
 * Example 2: Show objects for a specific verb
 * Command: quartz help init
 */
export async function showVerbObjects() {
  console.log('\n=== Example 2: Show objects for "init" verb ===');
  
  const parsedCommand = parser.parse(['help', 'init']);
  const context = {
    command: parsedCommand,
    config: {},
    logger: console,
    t: (key: string, params?: any) => key, // Simplified translation
    cwd: process.cwd(),
    env: process.env as Record<string, string>
  };
  
  await dispatcher.dispatch(parsedCommand, context);
}

/**
 * Example 3: Show detailed help for a specific command
 * Command: quartz help init project
 */
export async function showCommandDetails() {
  console.log('\n=== Example 3: Show detailed help for "init project" ===');
  
  const parsedCommand = parser.parse(['help', 'init', 'project']);
  const context = {
    command: parsedCommand,
    config: {},
    logger: console,
    t: (key: string, params?: any) => key, // Simplified translation
    cwd: process.cwd(),
    env: process.env as Record<string, string>
  };
  
  await dispatcher.dispatch(parsedCommand, context);
}

/**
 * Example 4: Show version information
 * Command: quartz version
 */
export async function showVersion() {
  console.log('\n=== Example 4: Show version information ===');
  
  const parsedCommand = parser.parse(['version']);
  const context = {
    command: parsedCommand,
    config: {},
    logger: console,
    t: (key: string, params?: any) => key, // Simplified translation
    cwd: process.cwd(),
    env: process.env as Record<string, string>
  };
  
  await dispatcher.dispatch(parsedCommand, context);
}

/**
 * Example 5: Help with verbose output
 * Command: quartz help --verbose
 */
export async function showVerboseHelp() {
  console.log('\n=== Example 5: Help with verbose output ===');
  
  const parsedCommand = parser.parse(['help', '--verbose']);
  const context = {
    command: parsedCommand,
    config: {},
    logger: console,
    t: (key: string, params?: any) => key, // Simplified translation
    cwd: process.cwd(),
    env: process.env as Record<string, string>
  };
  
  await dispatcher.dispatch(parsedCommand, context);
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  await showAllVerbs();
  await showVerbObjects();
  await showCommandDetails();
  await showVersion();
  await showVerboseHelp();
}

/**
 * Demonstrate help system features
 */
export function demonstrateHelpSystem() {
  console.log(`
🎯 Quartz CLI Help System Features:

📋 Hierarchical Help Structure:
  • quartz help                    - Show all available verbs
  • quartz help <verb>             - Show objects for specific verb  
  • quartz help <verb> <object>    - Show detailed command help
  • quartz version                  - Show version information

🔍 Smart Help Features:
  • Auto-completion support
  • Context-aware suggestions
  • Parameter validation
  • Usage examples
  • Related commands suggestions

📚 Help Categories:
  • Initialization Commands (init)
  • Configuration Commands (config)
  • Git Workflow Commands (branch, commit, pr, review)
  • AI Features (review, changelog)
  • System Commands (help, version)

💡 Usage Tips:
  • Use tab completion for command names
  • Add --verbose for detailed information
  • Check examples for common usage patterns
  • Use --help on any command for quick help
`);
}

// Export for easy testing
if (require.main === module) {
  demonstrateHelpSystem();
  runAllExamples().catch(console.error);
}