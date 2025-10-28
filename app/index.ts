// cli/index.ts
import { reviewCode, generateCommit, generatePR, configCommand }
  from '@/app/commands';
import { i18n } from '../i18n';
import { logger } from '../utils/logger';

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
  logger.command('config', t('cli.configDesc'));
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
  logger.example(t('cli.initConfig'), 'quartz config init');
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

// Initialize language
i18n.init();
const t = i18n.t;

// Get command line arguments
const args = process.argv.slice(2);

// Handle help flag
if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
  getUsageText();
  process.exit(0);
}

// Handle version flag
if (args.includes('-v') || args.includes('--version')) {
  const pkg = await import('../package.json');
  logger.line();
  logger.box(
    `${logger.text.bold('Quartz CLI')}\n\n${logger.text.primary('Version:')} ${logger.text.success('v' + pkg.version)}\n\n${logger.text.dim('AI-Powered Git Workflow Assistant')}`,
    { title: '📦 Version Info', padding: 1 }
  );
  logger.line();
  process.exit(0);
}

// Get command
const command = args[0];

// Execute command
try {
  switch (command) {
    // Config management
    case 'config':
      await configCommand(args.slice(1));
      break;
    // Review code
    case 'review':
      await reviewCode(args.slice(1));
      break;
    // Generate commit message
    case 'commit':
      await generateCommit(args.slice(1));
      break;
    // Generate PR description
    case 'pr':
      await generatePR(args.slice(1));
      break;
    // Handle unknown command
    default:
      logger.line();
      logger.box(
        `${logger.text.error('Unknown command:')} ${logger.text.warning(command)}\n\n${logger.text.dim('Run')} ${logger.text.success('quartz --help')} ${logger.text.dim('to see available commands.')}`,
        { title: '⚠️  Error', padding: 1 }
      );
      logger.line();
      process.exit(1);
  }
} catch (error) {
  logger.line();
  logger.box(
    `${logger.text.error(t('common.error'))} ${logger.text.dim('Execution failed')}\n\n${error instanceof Error ? error.message : String(error)}`,
    { title: '❌ Error', padding: 1 }
  );
  logger.line();
  process.exit(1);
}
