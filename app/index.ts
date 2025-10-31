//app/index.ts
import { CommandDispatcher, CommandParser, CommandRegistry, initializeCommandSystem } from '@/app/core';
import { ALL_COMMANDS } from '@/app/core/commands';
import {i18n} from '@/i18n';
import {logger} from '@/utils/logger';
import {checkAndMigrate, shouldSkipMigration} from '@/utils/hooks';
import {CLI} from '@/constants';
import {configManager} from '@/manager/config';

/**
 * Print ASCII art logo
 */
function printLogo() {
  const logo = `
   ██████╗ ██╗   ██╗ █████╗ ██████╗ ████████╗███████╗
  ██╔═══██╗██║   ██║██╔══██╗██╔══██╗╚══██╔══╝╚══███╔╝
  ██║   ██║██║   ██║███████║██████╔╝   ██║     ███╔╝
  ██║▄▄ ██║██║   ██║██╔══██║██╔══██╗   ██║    ███╔╝
  ╚██████╔╝╚██████╔╝██║  ██║██║  ██║   ██║   ███████╗
   ╚══▀▀═╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   ╚══════╝
  `;
  logger.gradient(logo);
}

// Get usage text from translations
function getUsageText(): string {
  const t = i18n.t;

  logger.line();
  printLogo();
  logger.line();
  logger.box(
    logger.text.bold('🚀 ' + t('cli.subtitle')),
    { title: '✨ Welcome', padding: 1 }
  );
  logger.line();

  // Usage section
  logger.section(t('cli.usage'));
  console.log(`  ${logger.text.primary('quartz')} ${logger.text.warning('<command>')} ${logger.text.dim('[options]')}`);
  logger.line();

  // Commands section
  logger.section(t('cli.commands'));
  logger.command('init', t('cli.initDesc'));
  logger.command('config', t('cli.configDesc'));
  logger.command('branch', '分支管理 (创建、删除、列出)');
  logger.command('review', t('review.starting').replace('🚀 ', '').replace('...', '').trim());
  logger.command('commit', t('commit.starting').replace('🚀 ', '').replace('...', '').trim());
  logger.command('pr', t('pr.starting').replace('🚀 ', '').replace('...', '').trim());

  // Options section
  logger.section(t('cli.options'));
  logger.listItem(`${logger.text.warning('-h, --help')} - ${logger.text.dim(t('cli.help'))}`);
  logger.listItem(`${logger.text.warning('-v, --version')} - ${logger.text.dim(t('cli.version'))}`);
  logger.line();

  // Examples section
  logger.section(t('cli.examples'));
  logger.example(t('cli.initProject'), 'quartz init');
  logger.example(t('cli.initConfig'), 'quartz config init');
  logger.example('交互式分支管理', 'quartz branch');
  logger.example('从 Issue 创建分支', 'quartz branch create');
  logger.example(t('review.starting').replace('🚀 ', '').replace('...', '').trim(), 'quartz review');
  logger.example(t('commit.starting').replace('🚀 ', '').replace('...', '').trim(), 'quartz commit');
  logger.example(t('commit.starting').replace('🚀 ', '').replace('...', '').trim(), 'quartz commit --edit');
  logger.example(t('pr.starting').replace('🚀 ', '').replace('...', '').trim(), 'quartz pr --auto --base main');
  logger.line();
  logger.box(
    `📚 ${t('cli.moreInfo')}\n\n${logger.text.primary('https://github.com/QuartzKazoku/Quartz-CLI.git')}`,
    { title: '🔗 Resources', padding: 1 }
  );

  return '';
}

// Main execution function
async function main() {
  // Initialize language from config
  try {
    if (configManager.configExists()) {
      const config = configManager.readConfig();
      i18n.set(config.language.ui as any);
    } else {
      i18n.init();
    }
  } catch {
    i18n.init();
  }
  const t = i18n.t;

  // Initialize new command system
  await initializeCommandSystem();

  const registry = new CommandRegistry();
  const parser = new CommandParser();
  const dispatcher = new CommandDispatcher();

  // Get command line arguments
  const args = process.argv.slice(CLI.ARGS_START_INDEX);

  // Handle help flag using new system
  if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
    const parsedCommand = parser.parse(['help']);
    const context = {
      command: parsedCommand,
      config: {},
      logger: logger,
      t: i18n.t,
      cwd: process.cwd(),
      env: process.env as Record<string, string>
    };
    
    await dispatcher.dispatch(parsedCommand, context);
    process.exit(0);
  }

  // Handle version flag using new system
  if (args.includes('-v') || args.includes('--version')) {
    const parsedCommand = parser.parse(['version']);
    const context = {
      command: parsedCommand,
      config: {},
      logger: logger,
      t: i18n.t,
      cwd: process.cwd(),
      env: process.env as Record<string, string>
    };
    
    await dispatcher.dispatch(parsedCommand, context);
    process.exit(0);
  }

  // Parse command using new system
  const parsedCommand = parser.parse(args);
  const context = {
    command: parsedCommand,
    config: {},
    logger: logger,
    t: i18n.t,
    cwd: process.cwd(),
    env: process.env as Record<string, string>
  };

  // Check and run migrations if needed (skip for certain commands)
  if (!shouldSkipMigration(parsedCommand.verb)) {
    try {
      await checkAndMigrate();
    } catch (error) {
      logger.line();
      logger.box(
        `${logger.text.error(t('migration.failed'))}\n\n${error instanceof Error ? error.message : String(error)}`,
        { title: '❌ Migration Error', padding: 1 }
      );
      logger.line();
      process.exit(1);
    }
  }

  // Execute command using new system
  try {
    await dispatcher.dispatch(parsedCommand, context);
  } catch (error) {
    logger.line();
    logger.box(
      `${logger.text.error(t('common.error'))} ${logger.text.dim('Execution failed')}\n\n${error instanceof Error ? error.message : String(error)}`,
      { title: '❌ Error', padding: 1 }
    );
    logger.line();
    process.exit(1);
  }
}

// Run main function
main().catch(error => {
  logger.line();
  logger.box(
    `${logger.text.error('Fatal error')}\n\n${error instanceof Error ? error.message : String(error)}`,
    { title: '💀 Fatal Error', padding: 1 }
  );
  logger.line();
  process.exit(1);
});
