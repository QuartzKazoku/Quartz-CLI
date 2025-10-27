import fs from 'node:fs';
import path from 'node:path';
import { t, setLanguage } from '../i18n';

/**
 * Configuration keys
 */
const CONFIG_KEYS = {
  OPENAI_API_KEY: 'OPENAI_API_KEY',
  OPENAI_BASE_URL: 'OPENAI_BASE_URL',
  OPENAI_MODEL: 'OPENAI_MODEL',
  GIT_PLATFORM: 'GIT_PLATFORM',
  GITHUB_TOKEN: 'GITHUB_TOKEN',
  GITLAB_TOKEN: 'GITLAB_TOKEN',
  GITLAB_URL: 'GITLAB_URL',
  QUARTZ_LANG: 'QUARTZ_LANG',
  PROMPT_LANG: 'PROMPT_LANG',
} as const;

type ConfigKey = keyof typeof CONFIG_KEYS;

/**
 * Configuration profile structure
 */
interface ConfigProfile {
  name: string;
  configs: Map<string, string>;
}

/**
 * Get .env file path
 */
function getEnvPath(): string {
  return path.join(process.cwd(), '.env');
}

/**
 * Get config profiles file path
 */
function getProfilesPath(): string {
  return path.join(process.cwd(), 'quartz.json');
}

/**
 * Read existing .env file
 */
function readEnvFile(): Map<string, string> {
  const envPath = getEnvPath();
  const config = new Map<string, string>();

  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const regex = /^([^=]+)=(.*)$/;
        const match = regex.exec(trimmedLine);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim();
          config.set(key, value);
        }
      }
    }
  }

  return config;
}

/**
 * Write config to .env file
 */
function writeEnvFile(config: Map<string, string>) {
  const envPath = getEnvPath();
  const lines: string[] = ['# Quartz Configuration - OpenAI API'];

  // OpenAI configs
  if (config.has('OPENAI_API_KEY')) {
    lines.push(`OPENAI_API_KEY=${config.get('OPENAI_API_KEY')}`);
  }
  if (config.has('OPENAI_BASE_URL')) {
    lines.push(`OPENAI_BASE_URL=${config.get('OPENAI_BASE_URL')}`);
  }
  if (config.has('OPENAI_MODEL')) {
    lines.push(`OPENAI_MODEL=${config.get('OPENAI_MODEL')}`);
  }

  lines.push('', '# Git Platform Configuration');

  // Git platform configs
  if (config.has('GIT_PLATFORM')) {
    lines.push(`GIT_PLATFORM=${config.get('GIT_PLATFORM')}`);
  }
  if (config.has('GITHUB_TOKEN')) {
    lines.push(`GITHUB_TOKEN=${config.get('GITHUB_TOKEN')}`);
  }
  if (config.has('GITLAB_TOKEN')) {
    lines.push(`GITLAB_TOKEN=${config.get('GITLAB_TOKEN')}`);
  }
  if (config.has('GITLAB_URL')) {
    lines.push(`GITLAB_URL=${config.get('GITLAB_URL')}`);
  }

  lines.push('', '# Quartz UI Configuration');

  // Quartz configs
  if (config.has('QUARTZ_LANG')) {
    lines.push(`QUARTZ_LANG=${config.get('QUARTZ_LANG')}`);
  }
  if (config.has('PROMPT_LANG')) {
    lines.push(`PROMPT_LANG=${config.get('PROMPT_LANG')}`);
  }

  fs.writeFileSync(envPath, lines.join('\n') + '\n', 'utf-8');
}

/**
 * Set a configuration value
 */
function setConfig(key: string, value: string) {
  const config = readEnvFile();
  config.set(key, value);
  writeEnvFile(config);
  console.log(t('config.set', { key, value: key.includes('KEY') || key.includes('TOKEN') ? '***' : value }));
}

/**
 * Get a configuration value
 */
function getConfig(key: string) {
  const config = readEnvFile();
  const value = config.get(key);
  
  if (value) {
    const displayValue = key.includes('KEY') || key.includes('TOKEN') 
      ? value.substring(0, 8) + '***' 
      : value;
    console.log(`${key}=${displayValue}`);
  } else {
    console.log(t('config.notSet', { key }));
  }
}

/**
 * Get icon for config key
 */
function getConfigIcon(key: string): string {
  const icons: Record<string, string> = {
    'OPENAI_API_KEY': '🔑',
    'OPENAI_BASE_URL': '🌐',
    'OPENAI_MODEL': '🤖',
    'GIT_PLATFORM': '🔧',
    'GITHUB_TOKEN': '🔐',
    'GITLAB_TOKEN': '🔐',
    'GITLAB_URL': '🌐',
    'QUARTZ_LANG': '🌍',
    'PROMPT_LANG': '🗣️',
  };
  return icons[key] || '⚙️';
}

/**
 * List all configurations
 */
function listConfig() {
  const config = readEnvFile();
  
  console.log('');
  printLogo();
  console.log('');
  console.log('\x1b[1m%s\x1b[0m', t('config.current')); // Bold title
  console.log('\x1b[2m%s\x1b[0m', '━'.repeat(70)); // Dim separator
  console.log('');
  
  // Configuration items with icons and colors
  const configItems = [
    { key: 'OPENAI_API_KEY', label: t('config.keys.apiKey') },
    { key: 'OPENAI_BASE_URL', label: t('config.keys.baseUrl') },
    { key: 'OPENAI_MODEL', label: t('config.keys.model') },
    { key: 'GIT_PLATFORM', label: t('config.keys.gitPlatform') },
    { key: 'GITHUB_TOKEN', label: t('config.keys.githubToken') },
    { key: 'GITLAB_TOKEN', label: t('config.keys.gitlabToken') },
    { key: 'GITLAB_URL', label: t('config.keys.gitlabUrl') },
    { key: 'QUARTZ_LANG', label: t('config.keys.language') },
    { key: 'PROMPT_LANG', label: t('config.keys.promptLanguage') },
  ];

  for (const item of configItems) {
    const value = config.get(item.key);
    const icon = getConfigIcon(item.key);
    
    if (value) {
      const displayValue = item.key.includes('KEY') || item.key.includes('TOKEN')
        ? value.substring(0, 8) + '***'
        : value;
      
      // Icon + Label (bold) + Value (cyan)
      console.log(`  ${icon}  \x1b[1m${item.label}\x1b[0m`);
      console.log(`     \x1b[36m${displayValue}\x1b[0m`);
    } else {
      // Icon + Label (bold) + Not configured (dim red)
      console.log(`  ${icon}  \x1b[1m${item.label}\x1b[0m`);
      console.log(`     \x1b[2m\x1b[31m${t('config.notConfigured')}\x1b[0m`);
    }
    console.log(''); // Empty line between items
  }
  
  console.log('\x1b[2m%s\x1b[0m', '━'.repeat(70)); // Dim separator
  console.log('\x1b[2m%s\x1b[0m', `💾 ${getEnvPath()}`); // Show .env file path
  console.log('');
}

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

/**
 * Ask a question with improved formatting
 */
async function askQuestion(
  readline: any,
  label: string,
  description?: string,
  defaultValue?: string
): Promise<string> {
  return new Promise(resolve => {
    console.log(''); // Empty line before question
    console.log('\x1b[1m%s\x1b[0m', label); // Bold label
    if (description) {
      console.log('\x1b[2m%s\x1b[0m', description); // Dim description
    }
    
    const prompt = `\x1b[32m❯\x1b[0m `; // Green arrow
    
    readline.question(prompt, (answer: string) => {
      resolve(answer);
    });
  });
}

/**
 * Interactive platform selector with arrow keys
 */
async function selectPlatform(currentPlatform?: string): Promise<string> {
  const platforms = [
    { value: 'github', label: 'GitHub' },
    { value: 'gitlab', label: 'GitLab' },
  ];

  let selectedIndex = platforms.findIndex(p => p.value === currentPlatform);
  if (selectedIndex === -1) selectedIndex = 0;

  return new Promise((resolve) => {
    const stdin = process.stdin;
    const stdout = process.stdout;

    // Enable raw mode to capture key presses
    if (stdin.isTTY) {
      stdin.setRawMode(true);
    }
    stdin.resume();
    stdin.setEncoding('utf8');

    const render = () => {
      // Clear previous output
      stdout.write('\x1B[2J\x1B[0f'); // Clear screen and move cursor to top
      
      console.log(''); // Empty line
      console.log('\x1b[1m%s\x1b[0m', '🔧 ' + t('config.keys.gitPlatform')); // Bold label
      console.log('\x1b[2m%s\x1b[0m', t('config.wizard.gitPlatform', { default: currentPlatform || 'github' })); // Description
      console.log('');

      // Render options
      for (let index = 0; index < platforms.length; index++) {
        const platform = platforms[index];
        if (index === selectedIndex) {
          // Highlighted option
          stdout.write(`  \x1b[32m❯ ${platform.label}\x1b[0m\n`);
        } else {
          // Normal option
          stdout.write(`    ${platform.label}\n`);
        }
      }

      console.log('');
      console.log('\x1b[2m%s\x1b[0m', '↑↓: Navigate  Enter: Select  Esc: Skip');
    };

    const onData = (key: string) => {
      // Handle key presses
      if (key === '\u001B[A') { // Up arrow
        selectedIndex = (selectedIndex - 1 + platforms.length) % platforms.length;
        render();
      } else if (key === '\u001B[B') { // Down arrow
        selectedIndex = (selectedIndex + 1) % platforms.length;
        render();
      } else if (key === '\r' || key === '\n') { // Enter
        cleanup();
        resolve(platforms[selectedIndex].value);
      } else if (key === '\u001B' || key === '\u0003') { // Esc or Ctrl+C
        cleanup();
        resolve(currentPlatform || 'github'); // Return current/default platform
      }
    };

    const cleanup = () => {
      stdin.removeListener('data', onData);
      if (stdin.isTTY) {
        stdin.setRawMode(false);
      }
      stdin.pause();
    };

    stdin.on('data', onData);
    render();
  });
}

/**
 * Interactive language selector with arrow keys
 */
async function selectLanguage(currentLang?: string, title?: string): Promise<string> {
  const languages = [
    { value: 'zh-CN', label: '简体中文 (Simplified Chinese)' },
    { value: 'zh-TW', label: '繁體中文 (Traditional Chinese)' },
    { value: 'ja', label: '日本語 (Japanese)' },
    { value: 'ko', label: '한국어 (Korean)' },
    { value: 'en', label: 'English' },
  ];

  let selectedIndex = languages.findIndex(l => l.value === currentLang);
  if (selectedIndex === -1) selectedIndex = languages.findIndex(l => l.value === 'en');

  return new Promise((resolve) => {
    const stdin = process.stdin;
    const stdout = process.stdout;

    // Enable raw mode to capture key presses
    if (stdin.isTTY) {
      stdin.setRawMode(true);
    }
    stdin.resume();
    stdin.setEncoding('utf8');

    const render = () => {
      // Clear previous output
      stdout.write('\x1B[2J\x1B[0f'); // Clear screen and move cursor to top
      
      console.log(''); // Empty line
      console.log('\x1b[1m%s\x1b[0m', '🌍 ' + (title || t('config.keys.language'))); // Bold label
      console.log('\x1b[2m%s\x1b[0m', t('config.wizard.language', { default: currentLang || 'en' })); // Description
      console.log('');

      // Render options
      for (let index = 0; index < languages.length; index++) {
        const lang = languages[index];
        if (index === selectedIndex) {
          // Highlighted option
          stdout.write(`  \x1b[32m❯ ${lang.label}\x1b[0m\n`);
        } else {
          // Normal option
          stdout.write(`    ${lang.label}\n`);
        }
      }

      console.log('');
      console.log('\x1b[2m%s\x1b[0m', '↑↓: Navigate  Enter: Select  Esc: Skip');
    };

    const onData = (key: string) => {
      // Handle key presses
      if (key === '\u001B[A') { // Up arrow
        selectedIndex = (selectedIndex - 1 + languages.length) % languages.length;
        render();
      } else if (key === '\u001B[B') { // Down arrow
        selectedIndex = (selectedIndex + 1) % languages.length;
        render();
      } else if (key === '\r' || key === '\n') { // Enter
        cleanup();
        resolve(languages[selectedIndex].value);
      } else if (key === '\u001B' || key === '\u0003') { // Esc or Ctrl+C
        cleanup();
        resolve(currentLang || 'en'); // Return current/default language
      }
    };

    const cleanup = () => {
      stdin.removeListener('data', onData);
      if (stdin.isTTY) {
        stdin.setRawMode(false);
      }
      stdin.pause();
    };

    stdin.on('data', onData);
    render();
  });
}

/**
 * Interactive setup wizard
 */
async function setupWizard() {
  // Clear console and print logo
  console.clear();
  printLogo();
  console.log('');
  console.log(t('config.wizard.welcome'));
  console.log('');
  console.log('\x1b[2m%s\x1b[0m', '━'.repeat(70)); // Dim separator
  
  const config = readEnvFile();
  const readline = require('node:readline').createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    // UI Language - Set first so subsequent prompts can use correct language
    readline.close(); // Close readline before entering raw mode
    const currentLang = config.get('QUARTZ_LANG');
    const lang = await selectLanguage(currentLang, t('config.keys.language'));
    config.set('QUARTZ_LANG', lang);
    
    // Update environment variable and i18n system immediately
    process.env.QUARTZ_LANG = lang;
    setLanguage(lang as any);

    // Prompt Language - Use interactive selector
    const currentPromptLang = config.get('PROMPT_LANG') || lang;
    const promptLang = await selectLanguage(currentPromptLang, t('config.keys.promptLanguage'));
    config.set('PROMPT_LANG', promptLang);

    // Git Platform - Use interactive selector
    const currentPlatform = config.get('GIT_PLATFORM') || 'github';
    const platform = await selectPlatform(currentPlatform);
    config.set('GIT_PLATFORM', platform);

    // Reopen readline for text input questions
    const readline2 = require('node:readline').createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    // OpenAI API Key
    const currentApiKey = config.get('OPENAI_API_KEY');
    const apiKeyLabel = '🔑 ' + t('config.keys.apiKey');
    const apiKeyDesc = currentApiKey
      ? t('config.wizard.apiKeyWithCurrent', { current: currentApiKey.substring(0, 8) + '***' })
      : t('config.wizard.apiKey');
    
    const apiKey = await askQuestion(readline2, apiKeyLabel, apiKeyDesc, currentApiKey);
    if (apiKey.trim()) {
      config.set('OPENAI_API_KEY', apiKey.trim());
    }

    // OpenAI Base URL
    const currentBaseUrl = config.get('OPENAI_BASE_URL');
    const defaultBaseUrl = currentBaseUrl || 'https://api.openai.com/v1';
    const baseUrlLabel = '🌐 ' + t('config.keys.baseUrl');
    const baseUrlDesc = t('config.wizard.baseUrl', { default: defaultBaseUrl });
    
    const baseUrl = await askQuestion(readline2, baseUrlLabel, baseUrlDesc, defaultBaseUrl);
    if (baseUrl.trim()) {
      config.set('OPENAI_BASE_URL', baseUrl.trim());
    } else if (!currentBaseUrl) {
      config.set('OPENAI_BASE_URL', defaultBaseUrl);
    }

    // OpenAI Model
    const currentModel = config.get('OPENAI_MODEL');
    const defaultModel = currentModel || 'gpt-4-turbo-preview';
    const modelLabel = '🤖 ' + t('config.keys.model');
    const modelDesc = t('config.wizard.model', { default: defaultModel });
    
    const model = await askQuestion(readline2, modelLabel, modelDesc, defaultModel);
    if (model.trim()) {
      config.set('OPENAI_MODEL', model.trim());
    } else if (!currentModel) {
      config.set('OPENAI_MODEL', defaultModel);
    }

    // Git Token (based on selected platform)
    if (platform === 'github') {
      const currentGithubToken = config.get('GITHUB_TOKEN');
      const githubTokenLabel = '🔐 ' + t('config.keys.githubToken');
      const githubTokenDesc = currentGithubToken
        ? t('config.wizard.githubTokenWithCurrent', { current: currentGithubToken.substring(0, 8) + '***' })
        : t('config.wizard.githubToken');
      
      const githubToken = await askQuestion(readline2, githubTokenLabel, githubTokenDesc);
      if (githubToken.trim()) {
        config.set('GITHUB_TOKEN', githubToken.trim());
      }
    } else if (platform === 'gitlab') {
      const currentGitlabToken = config.get('GITLAB_TOKEN');
      const gitlabTokenLabel = '🔐 ' + t('config.keys.gitlabToken');
      const gitlabTokenDesc = currentGitlabToken
        ? t('config.wizard.gitlabTokenWithCurrent', { current: currentGitlabToken.substring(0, 8) + '***' })
        : t('config.wizard.gitlabToken');
      
      const gitlabToken = await askQuestion(readline2, gitlabTokenLabel, gitlabTokenDesc);
      if (gitlabToken.trim()) {
        config.set('GITLAB_TOKEN', gitlabToken.trim());
      }

      // GitLab URL
      const currentGitlabUrl = config.get('GITLAB_URL');
      const defaultGitlabUrl = currentGitlabUrl || 'https://gitlab.com';
      const gitlabUrlLabel = '🌐 ' + t('config.keys.gitlabUrl');
      const gitlabUrlDesc = t('config.wizard.gitlabUrl', { default: defaultGitlabUrl });
      
      const gitlabUrl = await askQuestion(readline2, gitlabUrlLabel, gitlabUrlDesc, defaultGitlabUrl);
      if (gitlabUrl.trim()) {
        config.set('GITLAB_URL', gitlabUrl.trim());
      } else if (!currentGitlabUrl) {
        config.set('GITLAB_URL', defaultGitlabUrl);
      }
    }

    readline2.close();

    // Save configuration
    writeEnvFile(config);
    console.log('');
    console.log('\x1b[2m%s\x1b[0m', '━'.repeat(70)); // Dim separator
    console.log('');
    console.log('\x1b[32m%s\x1b[0m', '✅ ' + t('config.wizard.success')); // Green success message
    console.log('\x1b[2m%s\x1b[0m', '💾 ' + t('config.wizard.saved', { path: getEnvPath() })); // Dim path
    console.log('');

  } catch (error) {
    console.error('Setup wizard error:', error);
    throw error;
  }
}

/**
 * Show usage help
 */
function showHelp() {
  console.log('');
  printLogo();
  console.log('');
  
  // Usage section
  console.log('\x1b[1m%s\x1b[0m', '📖 ' + t('config.usage'));
  console.log('\x1b[2m%s\x1b[0m', '━'.repeat(70));
  console.log('');
  
  // Commands section
  console.log('\x1b[1m%s\x1b[0m', '⚡ ' + t('config.commands'));
  console.log('');
  console.log('  \x1b[36mquartz config list\x1b[0m');
  console.log('  \x1b[2m' + t('config.listDesc') + '\x1b[0m');
  console.log('');
  console.log('  \x1b[36mquartz config set\x1b[0m \x1b[33m<key>\x1b[0m \x1b[33m<value>\x1b[0m');
  console.log('  \x1b[2m' + t('config.setDesc') + '\x1b[0m');
  console.log('');
  console.log('  \x1b[36mquartz config get\x1b[0m \x1b[33m<key>\x1b[0m');
  console.log('  \x1b[2m' + t('config.getDesc') + '\x1b[0m');
  console.log('');
  console.log('  \x1b[36mquartz config init\x1b[0m');
  console.log('  \x1b[2m' + t('config.initDesc') + '\x1b[0m');
  console.log('');
  
  // Available keys section
  console.log('\x1b[1m%s\x1b[0m', '🔑 ' + t('config.availableKeys'));
  console.log('');
  console.log('  ' + getConfigIcon('OPENAI_API_KEY') + '  \x1b[33mOPENAI_API_KEY\x1b[0m');
  console.log('     \x1b[2m' + t('config.keys.apiKey') + '\x1b[0m');
  console.log('');
  console.log('  ' + getConfigIcon('OPENAI_BASE_URL') + '  \x1b[33mOPENAI_BASE_URL\x1b[0m');
  console.log('     \x1b[2m' + t('config.keys.baseUrl') + '\x1b[0m');
  console.log('');
  console.log('  ' + getConfigIcon('OPENAI_MODEL') + '  \x1b[33mOPENAI_MODEL\x1b[0m');
  console.log('     \x1b[2m' + t('config.keys.model') + '\x1b[0m');
  console.log('');
  console.log('  ' + getConfigIcon('GIT_PLATFORM') + '  \x1b[33mGIT_PLATFORM\x1b[0m');
  console.log('     \x1b[2m' + t('config.keys.gitPlatform') + '\x1b[0m');
  console.log('');
  console.log('  ' + getConfigIcon('GITHUB_TOKEN') + '  \x1b[33mGITHUB_TOKEN\x1b[0m');
  console.log('     \x1b[2m' + t('config.keys.githubToken') + '\x1b[0m');
  console.log('');
  console.log('  ' + getConfigIcon('GITLAB_TOKEN') + '  \x1b[33mGITLAB_TOKEN\x1b[0m');
  console.log('     \x1b[2m' + t('config.keys.gitlabToken') + '\x1b[0m');
  console.log('');
  console.log('  ' + getConfigIcon('GITLAB_URL') + '  \x1b[33mGITLAB_URL\x1b[0m');
  console.log('     \x1b[2m' + t('config.keys.gitlabUrl') + '\x1b[0m');
  console.log('');
  console.log('  ' + getConfigIcon('QUARTZ_LANG') + '  \x1b[33mQUARTZ_LANG\x1b[0m');
  console.log('     \x1b[2m' + t('config.keys.language') + '\x1b[0m');
  console.log('');
  console.log('  ' + getConfigIcon('PROMPT_LANG') + '  \x1b[33mPROMPT_LANG\x1b[0m');
  console.log('     \x1b[2m' + t('config.keys.promptLanguage') + '\x1b[0m');
  console.log('');
  
  // Examples section
  console.log('\x1b[1m%s\x1b[0m', '💡 ' + t('config.examples'));
  console.log('');
  console.log('  \x1b[2m# ' + t('config.initDesc') + '\x1b[0m');
  console.log('  \x1b[32m$\x1b[0m quartz config init');
  console.log('');
  console.log('  \x1b[2m# ' + t('config.setDesc') + '\x1b[0m');
  console.log('  \x1b[32m$\x1b[0m quartz config set OPENAI_API_KEY sk-your-key');
  console.log('  \x1b[32m$\x1b[0m quartz config set OPENAI_MODEL gpt-4-turbo-preview');
  console.log('  \x1b[32m$\x1b[0m quartz config set QUARTZ_LANG zh-CN');
  console.log('  \x1b[32m$\x1b[0m quartz config set PROMPT_LANG en');
  console.log('');
  console.log('  \x1b[2m# ' + t('config.profilesDesc') + '\x1b[0m');
  console.log('  \x1b[32m$\x1b[0m quartz config save-profile my-profile');
  console.log('  \x1b[32m$\x1b[0m quartz config load-profile my-profile');
  console.log('  \x1b[32m$\x1b[0m quartz config list-profiles');
  console.log('');
  console.log('  \x1b[2m# ' + t('config.getDesc') + '\x1b[0m');
  console.log('  \x1b[32m$\x1b[0m quartz config get OPENAI_API_KEY');
  console.log('');
  console.log('  \x1b[2m# ' + t('config.listDesc') + '\x1b[0m');
  console.log('  \x1b[32m$\x1b[0m quartz config list');
  console.log('');
  console.log('\x1b[2m%s\x1b[0m', '━'.repeat(70));
  console.log('');
}

/**
 * Save current configuration as a profile
 */
function saveProfile(name: string) {
  const config = readEnvFile();
  const profiles = loadProfiles();
  
  profiles[name] = {
    name,
    configs: Object.fromEntries(config),
  };
  
  fs.writeFileSync(getProfilesPath(), JSON.stringify(profiles, null, 2), 'utf-8');
  console.log(t('config.profileSaved', { name }));
}

/**
 * Load profiles from file
 */
function loadProfiles(): Record<string, any> {
  const profilesPath = getProfilesPath();
  if (fs.existsSync(profilesPath)) {
    try {
      return JSON.parse(fs.readFileSync(profilesPath, 'utf-8'));
    } catch (error) {
      console.error('Failed to load profiles:', error);
      return {};
    }
  }
  return {};
}

/**
 * Load a configuration profile
 */
function loadProfile(name: string) {
  const profiles = loadProfiles();
  
  if (!profiles[name]) {
    console.error(t('config.profileNotFound', { name }));
    console.log('\n' + t('config.availableProfiles'));
    listProfiles();
    process.exit(1);
  }
  
  const config = new Map<string, string>(Object.entries(profiles[name].configs));
  writeEnvFile(config);
  console.log(t('config.profileLoaded', { name }));
}

/**
 * List all saved profiles
 */
function listProfiles() {
  const profiles = loadProfiles();
  const profileNames = Object.keys(profiles);
  
  if (profileNames.length === 0) {
    console.log(t('config.noProfiles'));
    return;
  }
  
  console.log('');
  console.log('\x1b[1m%s\x1b[0m', '📋 ' + t('config.savedProfiles'));
  console.log('\x1b[2m%s\x1b[0m', '━'.repeat(70));
  console.log('');
  
  for (const name of profileNames) {
    const profile = profiles[name];
    console.log(`  📦 \x1b[36m${name}\x1b[0m`);
    const configCount = Object.keys(profile.configs).length;
    console.log(`     \x1b[2m${configCount} ${t('config.configItems')}\x1b[0m`);
    console.log('');
  }
}

/**
 * Delete a configuration profile
 */
function deleteProfile(name: string) {
  const profiles = loadProfiles();
  
  if (!profiles[name]) {
    console.error(t('config.profileNotFound', { name }));
    process.exit(1);
  }
  
  delete profiles[name];
  fs.writeFileSync(getProfilesPath(), JSON.stringify(profiles, null, 2), 'utf-8');
  console.log(t('config.profileDeleted', { name }));
}

/**
 * Main config command handler
 */
export async function configCommand(args: string[]) {
  const subCommand = args[0];

  if (!subCommand || subCommand === 'help' || subCommand === '-h' || subCommand === '--help') {
    showHelp();
    return;
  }

  switch (subCommand) {
    case 'list':
    case 'ls':
      listConfig();
      break;

    case 'set':
      if (args.length < 3) {
        console.error(t('config.errors.setUsage'));
        process.exit(1);
      }
      setConfig(args[1], args[2]);
      break;

    case 'get':
      if (args.length < 2) {
        console.error(t('config.errors.getUsage'));
        process.exit(1);
      }
      getConfig(args[1]);
      break;

    case 'init':
    case 'setup':
      await setupWizard();
      break;

    case 'save-profile':
    case 'save':
      if (args.length < 2) {
        console.error(t('config.errors.saveProfileUsage'));
        process.exit(1);
      }
      saveProfile(args[1]);
      break;

    case 'load-profile':
    case 'load':
      if (args.length < 2) {
        console.error(t('config.errors.loadProfileUsage'));
        process.exit(1);
      }
      loadProfile(args[1]);
      break;

    case 'list-profiles':
    case 'profiles':
      listProfiles();
      break;

    case 'delete-profile':
    case 'delete':
    case 'rm':
      if (args.length < 2) {
        console.error(t('config.errors.deleteProfileUsage'));
        process.exit(1);
      }
      deleteProfile(args[1]);
      break;

    default:
      console.error(t('config.errors.unknownCommand', { command: subCommand }));
      showHelp();
      process.exit(1);
  }
}