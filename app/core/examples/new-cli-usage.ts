//app/core/examples/new-cli-usage.ts
/**
 * @fileoverview Complete implementation example for new command system
 * @description Shows how to use the new verb-object-parameter command architecture
 * @author Quartz CLI Team
 * @version 2.0.0
 */

import { 
  commandDispatcher, 
  commandRegistry, 
  CommandVerb, 
  CommandObject,
  ExecutionContext 
} from '../index';

/**
 * Example: Register all commands
 */
function registerAllCommands() {
  // Import and register all command definitions
  const { ALL_COMMANDS } = require('../commands');
  
  ALL_COMMANDS.forEach(command => {
    commandRegistry.register(command);
  });

  console.log(`✅ Registered ${ALL_COMMANDS.length} commands`);
  
  // Show statistics
  const stats = commandRegistry.getStats();
  console.log(`📊 ${stats.verbsCount} verbs, ${stats.objectsCount} objects, ${stats.categoriesCount} categories`);
}

/**
 * Example: Create execution context
 */
function createExecutionContext(): ExecutionContext {
  return {
    command: {} as any, // Will be populated by dispatcher
    config: {
      openai: {
        apiKey: 'sk-test-key',
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-4',
      },
      platforms: [
        { type: 'github', token: 'ghp-test-token' },
        { type: 'gitlab', token: 'glpat-test-token', url: 'https://gitlab.com' },
      ],
      language: {
        ui: 'zh-CN',
        prompt: 'zh-CN',
      },
    },
    logger: {
      info: (msg: string) => console.log(`ℹ️  ${msg}`),
      success: (msg: string) => console.log(`✅ ${msg}`),
      warn: (msg: string) => console.log(`⚠️  ${msg}`),
      error: (msg: string) => console.log(`❌ ${msg}`),
      debug: (msg: string) => console.log(`🐛 ${msg}`),
    },
    t: (key: string, params?: any) => {
      // Simple translation mock
      const translations: Record<string, string> = {
        'command.executed': 'Command executed successfully',
        'command.failed': 'Command execution failed',
        'help.title': 'Command Help',
      };
      return translations[key] || key;
    },
    cwd: process.cwd(),
    env: process.env as Record<string, string>,
  };
}

/**
 * Example: Basic command execution
 */
async function exampleBasicExecution() {
  console.log('\n🚀 Example 1: Basic Command Execution');
  console.log('=' .repeat(50));
  
  const context = createExecutionContext();
  
  try {
    // Execute a simple command
    await commandDispatcher.parseAndDispatch(
      ['list', 'config'],
      context
    );
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

/**
 * Example: Command with parameters
 */
async function exampleWithParameters() {
  console.log('\n⚙️  Example 2: Command with Parameters');
  console.log('=' .repeat(50));
  
  const context = createExecutionContext();
  
  try {
    // Execute command with parameters
    await commandDispatcher.parseAndDispatch(
      ['create', 'branch', '--name', 'feature/new-feature', '--from', 'main'],
      context
    );
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

/**
 * Example: Help generation
 */
async function exampleHelpGeneration() {
  console.log('\n📖 Example 3: Help Generation');
  console.log('=' .repeat(50));
  
  try {
    // Generate general help
    console.log(commandDispatcher.generateHelp());
    
    // Generate specific command help
    console.log(commandDispatcher.generateHelp('init', 'project'));
    
    // Generate verb help
    console.log(commandDispatcher.generateHelp('create'));
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

/**
 * Example: Command validation
 */
async function exampleValidation() {
  console.log('\n✅ Example 4: Command Validation');
  console.log('=' .repeat(50));
  
  const testCommands = [
    ['init', 'project'],
    ['create', 'branch', '--name', 'test'],
    ['invalid', 'command'],
    ['list', 'config', '--invalid-flag'],
  ];
  
  testCommands.forEach(async (cmdArgs) => {
    const validation = commandDispatcher.validateCommand(cmdArgs);
    
    console.log(`\n🔍 Testing: ${cmdArgs.join(' ')}`);
    if (validation.valid) {
      console.log('✅ Valid command');
      if (validation.warnings.length > 0) {
        console.log('⚠️  Warnings:', validation.warnings);
      }
    } else {
      console.log('❌ Invalid command');
      console.log('Errors:', validation.errors);
    }
  });
}

/**
 * Example: Autocomplete suggestions
 */
async function exampleAutocomplete() {
  console.log('\n🔍 Example 5: Autocomplete Suggestions');
  console.log('=' .repeat(50));
  
  const partialInputs = [
    [''],
    ['cr'],
    ['create'],
    ['create', 'br'],
    ['list', 'c'],
  ];
  
  partialInputs.forEach(partial => {
    const suggestions = commandDispatcher.getSuggestions(partial);
    console.log(`\n🔍 Input: [${partial.join(' ')}]`);
    console.log('💡 Suggestions:', suggestions);
  });
}

/**
 * Example: Command statistics and discovery
 */
async function exampleCommandDiscovery() {
  console.log('\n📊 Example 6: Command Discovery');
  console.log('=' .repeat(50));
  
  // Get all available verbs
  const verbs = commandDispatcher.getAvailableVerbs();
  console.log('\n🎯 Available Verbs:', verbs);
  
  // Get all available objects
  const objects = commandDispatcher.getAvailableObjects();
  console.log('\n🎯 Available Objects:', objects);
  
  // Get all categories
  const categories = commandDispatcher.getAvailableCategories();
  console.log('\n📂 Available Categories:', categories);
  
  // Get commands by category
  categories.forEach(category => {
    const commands = commandDispatcher.getCommandsByCategory(category);
    console.log(`\n📂 ${category.toUpperCase()}:`);
    commands.forEach(cmd => {
      const deprecated = cmd.deprecated ? ' ⚠️' : '';
      console.log(`  ${cmd.verb} ${cmd.object}${deprecated}`);
    });
  });
}

/**
 * Example: Custom middleware
 */
async function exampleCustomMiddleware() {
  console.log('\n🔧 Example 7: Custom Middleware');
  console.log('=' .repeat(50));
  
  // Add custom middleware
  commandDispatcher.use(async (context, next) => {
    console.log('🔧 Custom middleware: Before execution');
    console.log(`📝 Command: ${context.command.verb} ${context.command.object}`);
    
    const startTime = Date.now();
    await next();
    const duration = Date.now() - startTime;
    
    console.log(`🔧 Custom middleware: After execution (${duration}ms)`);
  });
  
  // Execute with custom middleware
  const context = createExecutionContext();
  try {
    await commandDispatcher.parseAndDispatch(['list', 'config'], context);
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

/**
 * Main example runner
 */
async function runAllExamples() {
  console.log('🚀 Quartz CLI - New Command System Examples');
  console.log('=' .repeat(60));
  
  // Register all commands first
  registerAllCommands();
  
  // Run all examples
  await exampleBasicExecution();
  await exampleWithParameters();
  await exampleHelpGeneration();
  await exampleValidation();
  await exampleAutocomplete();
  await exampleCommandDiscovery();
  await exampleCustomMiddleware();
  
  console.log('\n✅ All examples completed!');
}

/**
 * Export examples for individual testing
 */
export {
  registerAllCommands,
  createExecutionContext,
  exampleBasicExecution,
  exampleWithParameters,
  exampleHelpGeneration,
  exampleValidation,
  exampleAutocomplete,
  exampleCommandDiscovery,
  exampleCustomMiddleware,
  runAllExamples,
};

// Run examples if this file is executed directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}