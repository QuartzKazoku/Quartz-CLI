import fs from 'node:fs';
import path from 'node:path';
import {setLanguage, t} from '../i18n';
import {readQuartzConfig as readConfig, upsertPlatformConfig, writeQuartzConfig as writeConfig} from '../utils/config';
import {QuartzConfig} from '../types/config';

/**
 * Get quartz.json file path
 */
function getQuartzPath(): string {
  return path.join(process.cwd(), 'quartz.json');
}

/**
 * 从新配置结构中获取显示值的辅助函数
 */
function getConfigDisplayValue(config: QuartzConfig, key: string): string | undefined {
  switch (key) {
    case 'OPENAI_API_KEY':
      return config.openai.apiKey;
    case 'OPENAI_BASE_URL':
      return config.openai.baseUrl;
    case 'OPENAI_MODEL':
      return config.openai.model;
    case 'QUARTZ_LANG':
      return config.language.ui;
    case 'PROMPT_LANG':
      return config.language.prompt;
    case 'GITHUB_TOKEN':
      return config.platforms.find(p => p.type === 'github')?.token;
    case 'GITLAB_TOKEN':
      return config.platforms.find(p => p.type === 'gitlab')?.token;
    case 'GITLAB_URL':
      return config.platforms.find(p => p.type === 'gitlab')?.url;
    case 'GIT_PLATFORM':
      return config.platforms.length > 0 ? config.platforms[0].type : undefined;
    default:
      return undefined;
  }
}

/**
 * 设置配置值（支持新结构）
 */
function setConfig(key: string, value: string) {
  const config = readConfig();
  
  switch (key) {
    case 'OPENAI_API_KEY':
      config.openai.apiKey = value;
      break;
    case 'OPENAI_BASE_URL':
      config.openai.baseUrl = value;
      break;
    case 'OPENAI_MODEL':
      config.openai.model = value;
      break;
    case 'QUARTZ_LANG':
      config.language.ui = value;
      break;
    case 'PROMPT_LANG':
      config.language.prompt = value;
      break;
    case 'GITHUB_TOKEN':
      upsertPlatformConfig({ type: 'github', token: value });
      console.log(t('config.set', { key, value: '***' }));
      return;
    case 'GITLAB_TOKEN': {
      const existingGitlab = config.platforms.find(p => p.type === 'gitlab');
      upsertPlatformConfig({ 
        type: 'gitlab',
        token: value,
        url: existingGitlab?.url || 'https://gitlab.com'
      });
      console.log(t('config.set', { key, value: '***' }));
      return;
    }
    case 'GITLAB_URL': {
      const existingGitlab = config.platforms.find(p => p.type === 'gitlab');
      if (existingGitlab) {
        upsertPlatformConfig({ ...existingGitlab, url: value });
      } else {
        console.error('请先设置 GITLAB_TOKEN');
        return;
      }
      console.log(t('config.set', { key, value }));
      return;
    }
    case 'GIT_PLATFORM':
      // GIT_PLATFORM 已废弃，现在支持多平台
      console.warn('警告: GIT_PLATFORM 配置已废弃，请直接配置对应平台的 TOKEN');
      return;
    default:
      console.error(`未知的配置键: ${key}`);
      return;
  }
  
  writeConfig(config);
  console.log(t('config.set', { key, value: key.includes('KEY') || key.includes('TOKEN') ? '***' : value }));
}

/**
 * 获取配置值
 */
function getConfig(key: string) {
  const config = readConfig();
  const value = getConfigDisplayValue(config, key);
  
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
 * 列出所有配置
 */
function listConfig() {
  const config = readConfig();
  
  console.log('');
  printLogo();
  console.log('');
  console.log('\x1b[1m%s\x1b[0m', t('config.current'));
  console.log('\x1b[2m%s\x1b[0m', '━'.repeat(70));
  console.log('');
  
  // Configuration items with icons and colors
  const configItems = [
    { key: 'OPENAI_API_KEY', label: t('config.keys.apiKey') },
    { key: 'OPENAI_BASE_URL', label: t('config.keys.baseUrl') },
    { key: 'OPENAI_MODEL', label: t('config.keys.model') },
    { key: 'GITHUB_TOKEN', label: t('config.keys.githubToken') },
    { key: 'GITLAB_TOKEN', label: t('config.keys.gitlabToken') },
    { key: 'GITLAB_URL', label: t('config.keys.gitlabUrl') },
    { key: 'QUARTZ_LANG', label: t('config.keys.language') },
    { key: 'PROMPT_LANG', label: t('config.keys.promptLanguage') },
  ];

  for (const item of configItems) {
    const value = getConfigDisplayValue(config, item.key);
    const icon = getConfigIcon(item.key);
    
    if (value) {
      const displayValue = item.key.includes('KEY') || item.key.includes('TOKEN')
        ? value.substring(0, 8) + '***'
        : value;
      
      console.log(`  ${icon}  \x1b[1m${item.label}\x1b[0m`);
      console.log(`     \x1b[36m${displayValue}\x1b[0m`);
    } else {
      console.log(`  ${icon}  \x1b[1m${item.label}\x1b[0m`);
      console.log(`     \x1b[2m\x1b[31m${t('config.notConfigured')}\x1b[0m`);
    }
    console.log('');
  }
  
  // 显示配置的平台信息
  if (config.platforms.length > 0) {
    console.log('\x1b[1m%s\x1b[0m', '🔧 配置的代码托管平台:');
    console.log('');
    for (const platform of config.platforms) {
      console.log(`  ✓ \x1b[36m${platform.type.toUpperCase()}\x1b[0m`);
      if (platform.url) {
        console.log(`    URL: ${platform.url}`);
      }
      console.log(`    Token: ${platform.token.substring(0, 8)}***`);
      console.log('');
    }
  }
  
  console.log('\x1b[2m%s\x1b[0m', '━'.repeat(70));
  console.log('\x1b[2m%s\x1b[0m', `💾 ${getQuartzPath()}`);
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
  console.log('\x1b[36m%s\x1b[0m', logo);
}

/**
 * Ask a question with improved formatting
 */
async function askQuestion(
  readline: any,
  label: string,
  description?: string
): Promise<string> {
  return new Promise(resolve => {
    console.log('');
    console.log('\x1b[1m%s\x1b[0m', label);
    if (description) {
      console.log('\x1b[2m%s\x1b[0m', description);
    }
    
    const prompt = `\x1b[32m❯\x1b[0m `;
    
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

    if (stdin.isTTY) {
      stdin.setRawMode(true);
    }
    stdin.resume();
    stdin.setEncoding('utf8');

    const render = () => {
      stdout.write('\x1B[2J\x1B[0f');
      
      console.log('');
      console.log('\x1b[1m%s\x1b[0m', '🔧 ' + t('config.keys.gitPlatform'));
      console.log('\x1b[2m%s\x1b[0m', t('config.wizard.gitPlatform', { default: currentPlatform || 'github' }));
      console.log('');

      for (let index = 0; index < platforms.length; index++) {
        const platform = platforms[index];
        if (index === selectedIndex) {
          stdout.write(`  \x1b[32m❯ ${platform.label}\x1b[0m\n`);
        } else {
          stdout.write(`    ${platform.label}\n`);
        }
      }

      console.log('');
      console.log('\x1b[2m%s\x1b[0m', '↑↓: Navigate  Enter: Select  Esc: Skip');
    };

    const onData = (key: string) => {
      if (key === '\u001B[A') {
        selectedIndex = (selectedIndex - 1 + platforms.length) % platforms.length;
        render();
      } else if (key === '\u001B[B') {
        selectedIndex = (selectedIndex + 1) % platforms.length;
        render();
      } else if (key === '\r' || key === '\n') {
        cleanup();
        resolve(platforms[selectedIndex].value);
      } else if (key === '\u001B' || key === '\u0003') {
        cleanup();
        resolve(currentPlatform || 'github');
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

    if (stdin.isTTY) {
      stdin.setRawMode(true);
    }
    stdin.resume();
    stdin.setEncoding('utf8');

    const render = () => {
      stdout.write('\x1B[2J\x1B[0f');
      
      console.log('');
      console.log('\x1b[1m%s\x1b[0m', '🌍 ' + (title || t('config.keys.language')));
      console.log('\x1b[2m%s\x1b[0m', t('config.wizard.language', { default: currentLang || 'en' }));
      console.log('');

      for (let index = 0; index < languages.length; index++) {
        const lang = languages[index];
        if (index === selectedIndex) {
          stdout.write(`  \x1b[32m❯ ${lang.label}\x1b[0m\n`);
        } else {
          stdout.write(`    ${lang.label}\n`);
        }
      }

      console.log('');
      console.log('\x1b[2m%s\x1b[0m', '↑↓: Navigate  Enter: Select  Esc: Skip');
    };

    const onData = (key: string) => {
      if (key === '\u001B[A') {
        selectedIndex = (selectedIndex - 1 + languages.length) % languages.length;
        render();
      } else if (key === '\u001B[B') {
        selectedIndex = (selectedIndex + 1) % languages.length;
        render();
      } else if (key === '\r' || key === '\n') {
        cleanup();
        resolve(languages[selectedIndex].value);
      } else if (key === '\u001B' || key === '\u0003') {
        cleanup();
        resolve(currentLang || 'en');
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
  console.clear();
  printLogo();
  console.log('');
  console.log(t('config.wizard.welcome'));
  console.log('');
  console.log('\x1b[2m%s\x1b[0m', '━'.repeat(70));
  
  const config = readConfig();
  const readline = require('node:readline').createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    // UI Language
    readline.close();
    const currentLang = config.language.ui;
    const lang = await selectLanguage(currentLang, t('config.keys.language'));
    config.language.ui = lang;
    
    process.env.QUARTZ_LANG = lang;
    setLanguage(lang as any);

    // Prompt Language
    const currentPromptLang = config.language.prompt || lang;
      config.language.prompt = await selectLanguage(currentPromptLang, t('config.keys.promptLanguage'));

    // Git Platform
    const currentPlatform = config.platforms.length > 0 ? config.platforms[0].type : 'github';
    const platform = await selectPlatform(currentPlatform);

    const readline2 = require('node:readline').createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    // OpenAI API Key
    const currentApiKey = config.openai.apiKey;
    const apiKeyLabel = '🔑 ' + t('config.keys.apiKey');
    const apiKeyDesc = currentApiKey
      ? t('config.wizard.apiKeyWithCurrent', { current: currentApiKey.substring(0, 8) + '***' })
      : t('config.wizard.apiKey');
    
    const apiKey = await askQuestion(readline2, apiKeyLabel, apiKeyDesc);
    if (apiKey.trim()) {
      config.openai.apiKey = apiKey.trim();
    }

    // OpenAI Base URL
    const currentBaseUrl = config.openai.baseUrl;
    const defaultBaseUrl = currentBaseUrl || 'https://api.openai.com/v1';
    const baseUrlLabel = '🌐 ' + t('config.keys.baseUrl');
    const baseUrlDesc = t('config.wizard.baseUrl', { default: defaultBaseUrl });
    
    const baseUrl = await askQuestion(readline2, baseUrlLabel, baseUrlDesc);
    if (baseUrl.trim()) {
      config.openai.baseUrl = baseUrl.trim();
    } else if (!currentBaseUrl) {
      config.openai.baseUrl = defaultBaseUrl;
    }

    // OpenAI Model
    const currentModel = config.openai.model;
    const defaultModel = currentModel || 'gpt-4-turbo-preview';
    const modelLabel = '🤖 ' + t('config.keys.model');
    const modelDesc = t('config.wizard.model', { default: defaultModel });
    
    const model = await askQuestion(readline2, modelLabel, modelDesc);
    if (model.trim()) {
      config.openai.model = model.trim();
    } else if (!currentModel) {
      config.openai.model = defaultModel;
    }

    // Git Token (based on selected platform)
    if (platform === 'github') {
      const existingGithub = config.platforms.find(p => p.type === 'github');
      const currentGithubToken = existingGithub?.token;
      const githubTokenLabel = '🔐 ' + t('config.keys.githubToken');
      const githubTokenDesc = currentGithubToken
        ? t('config.wizard.githubTokenWithCurrent', { current: currentGithubToken.substring(0, 8) + '***' })
        : t('config.wizard.githubToken');
      
      const githubToken = await askQuestion(readline2, githubTokenLabel, githubTokenDesc);
      if (githubToken.trim()) {
        upsertPlatformConfig({ type: 'github', token: githubToken.trim() });
      }
    } else if (platform === 'gitlab') {
      const existingGitlab = config.platforms.find(p => p.type === 'gitlab');
      const currentGitlabToken = existingGitlab?.token;
      const gitlabTokenLabel = '🔐 ' + t('config.keys.gitlabToken');
      const gitlabTokenDesc = currentGitlabToken
        ? t('config.wizard.gitlabTokenWithCurrent', { current: currentGitlabToken.substring(0, 8) + '***' })
        : t('config.wizard.gitlabToken');
      
      const gitlabToken = await askQuestion(readline2, gitlabTokenLabel, gitlabTokenDesc);
      if (gitlabToken.trim()) {
        const currentGitlabUrl = existingGitlab?.url;
        const defaultGitlabUrl = currentGitlabUrl || 'https://gitlab.com';
        const gitlabUrlLabel = '🌐 ' + t('config.keys.gitlabUrl');
        const gitlabUrlDesc = t('config.wizard.gitlabUrl', { default: defaultGitlabUrl });
        
        const gitlabUrl = await askQuestion(readline2, gitlabUrlLabel, gitlabUrlDesc);
        upsertPlatformConfig({
          type: 'gitlab',
          token: gitlabToken.trim(),
          url: gitlabUrl.trim() || defaultGitlabUrl
        });
      }
    }

    readline2.close();

    // Save configuration
    writeConfig(config);
    console.log('');
    console.log('\x1b[2m%s\x1b[0m', '━'.repeat(70));
    console.log('');
    console.log('\x1b[32m%s\x1b[0m', '✅ ' + t('config.wizard.success'));
    console.log('\x1b[2m%s\x1b[0m', '💾 ' + t('config.wizard.saved', { path: getQuartzPath() }));
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
  
  console.log('\x1b[1m%s\x1b[0m', '📖 ' + t('config.usage'));
  console.log('\x1b[2m%s\x1b[0m', '━'.repeat(70));
  console.log('');
  
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
  const config = readConfig();
  writeConfig(config, name);
  console.log(t('config.profileSaved', { name }));
}

/**
 * Load profiles from quartz.json
 */
function loadProfiles(): Record<string, any> {
  const quartzPath = getQuartzPath();
  if (fs.existsSync(quartzPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(quartzPath, 'utf-8'));
      const { default: _, ...profiles } = data;
      return profiles;
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
  const quartzPath = getQuartzPath();
  let data: any = {};

  if (fs.existsSync(quartzPath)) {
    try {
      const content = fs.readFileSync(quartzPath, 'utf-8');
      data = JSON.parse(content);
    } catch (error) {
      console.error('Failed to load quartz.json:', error);
      process.exit(1);
    }
  }

  if (!data[name]) {
    console.error(t('config.profileNotFound', { name }));
    console.log('\n' + t('config.availableProfiles'));
    listProfiles();
    process.exit(1);
  }

  // Update default profile with selected profile config
  data.default = data[name];

  fs.writeFileSync(quartzPath, JSON.stringify(data, null, 2), 'utf-8');
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
    if (profile.config) {
      const platformCount = profile.config.platforms?.length || 0;
      console.log(`     \x1b[2m${platformCount} 个平台配置\x1b[0m`);
    }
    console.log('');
  }
}

/**
 * Delete a configuration profile
 */
function deleteProfile(name: string) {
  const quartzPath = getQuartzPath();
  let data: any = {};

  if (fs.existsSync(quartzPath)) {
    try {
      const content = fs.readFileSync(quartzPath, 'utf-8');
      data = JSON.parse(content);
    } catch (error) {
      console.error('Failed to load quartz.json:', error);
      process.exit(1);
    }
  }

  if (!data[name]) {
    console.error(t('config.profileNotFound', { name }));
    process.exit(1);
  }

  delete data[name];
  fs.writeFileSync(quartzPath, JSON.stringify(data, null, 2), 'utf-8');
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