// cli/index.ts
import { reviewCode } from './commands/review';
import { generateCommit } from './commands/commit';
import { generatePR } from './commands/pr';
import { configCommand } from './commands/config';
import { i18n } from './i18n';

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
  console.log('\x1b[36m%s\x1b[0m', logo); // Cyan color
}

// Get usage text from translations
function getUsageText(): string {
  const t = i18n.t;

  console.log('');
  printLogo();
  console.log('');
  console.log('\x1b[1m%s\x1b[0m', '  🚀 ' + t('cli.subtitle'));
  console.log('');
  console.log('\x1b[2m%s\x1b[0m', '━'.repeat(70));
  console.log('');

  // Usage section
  console.log('\x1b[1m%s\x1b[0m', '📖 ' + t('cli.usage'));
  console.log('  \x1b[36mquartz\x1b[0m \x1b[33m<command>\x1b[0m \x1b[2m[options]\x1b[0m');
  console.log('');

  // Commands section
  console.log('\x1b[1m%s\x1b[0m', '⚡ ' + t('cli.commands'));
  console.log('');
  console.log('  \x1b[36mconfig\x1b[0m');
  console.log('  \x1b[2m' + t('cli.configDesc') + '\x1b[0m');
  console.log('');
  console.log('  \x1b[36mreview\x1b[0m');
  console.log('  \x1b[2m' + t('review.starting').replace('🚀 ', '').replace('...', '').trim() + '\x1b[0m');
  console.log('');
  console.log('  \x1b[36mcommit\x1b[0m');
  console.log('  \x1b[2m' + t('commit.starting').replace('🚀 ', '').replace('...', '').trim() + '\x1b[0m');
  console.log('');
  console.log('  \x1b[36mpr\x1b[0m');
  console.log('  \x1b[2m' + t('pr.starting').replace('🚀 ', '').replace('...', '').trim() + '\x1b[0m');
  console.log('');

  // Options section
  console.log('\x1b[1m%s\x1b[0m', '🎛️  ' + t('cli.options'));
  console.log('');
  console.log('  \x1b[33m-h, --help\x1b[0m');
  console.log('  \x1b[2m' + t('cli.help') + '\x1b[0m');
  console.log('');
  console.log('  \x1b[33m-v, --version\x1b[0m');
  console.log('  \x1b[2m' + t('cli.version') + '\x1b[0m');
  console.log('');

  // Examples section
  console.log('\x1b[1m%s\x1b[0m', '💡 ' + t('cli.examples'));
  console.log('');
  console.log('  \x1b[2m# ' + t('cli.initConfig') + '\x1b[0m');
  console.log('  \x1b[32m$\x1b[0m quartz config init');
  console.log('');
  console.log('  \x1b[2m# ' + t('review.starting').replace('🚀 ', '').replace('...', '').trim() + '\x1b[0m');
  console.log('  \x1b[32m$\x1b[0m quartz review');
  console.log('');
  console.log('  \x1b[2m# ' + t('commit.starting').replace('🚀 ', '').replace('...', '').trim() + '\x1b[0m');
  console.log('  \x1b[32m$\x1b[0m quartz commit');
  console.log('  \x1b[32m$\x1b[0m quartz commit --edit');
  console.log('');
  console.log('  \x1b[2m# ' + t('pr.starting').replace('🚀 ', '').replace('...', '').trim() + '\x1b[0m');
  console.log('  \x1b[32m$\x1b[0m quartz pr --auto --base main');
  console.log('');
  console.log('\x1b[2m%s\x1b[0m', '━'.repeat(70));
  console.log('');
  console.log('\x1b[2m%s\x1b[0m', '📚 ' + t('cli.moreInfo') + ': \x1b[36mhttps://github.com/creedchung/quartz\x1b[0m');
  console.log('');

  return '';
}

// 初始化语言
i18n.init();
const t = i18n.t;

// 获取命令行参数
const args = process.argv.slice(2);

// 处理帮助标志
if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
  getUsageText();
  process.exit(0);
}

// 处理版本标志
if (args.includes('-v') || args.includes('--version')) {
  const pkg = await import('../package.json');
  console.log(`${pkg.version}`);
  process.exit(0);
}

// 获取命令
const command = args[0];

// 执行命令
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
      console.error(`\n\x1b[31m${t('common.error')}\x1b[0m Unknown command: \x1b[33m${command}\x1b[0m\n`);
      getUsageText();
      process.exit(1);
  }
} catch (error) {
  console.error(`${t('common.error')} Execution failed:`, error);
  process.exit(1);
}
