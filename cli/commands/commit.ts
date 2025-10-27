import OpenAI from 'openai';
import { $ } from 'bun';
import fs from 'fs';
import path from 'path';
import { t } from '../i18n';
import { getCommitPrompt } from '../utils/prompt';

/**
 * Load configuration from environment variables and .env file
 * @returns Configuration object
 */
function loadConfig() {
  const config = {
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    openaiBaseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    openaiModel: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
  };

  // Try to load from .env file
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        if (key === 'OPENAI_API_KEY' && !config.openaiApiKey) {
          config.openaiApiKey = value;
        } else if (key === 'OPENAI_BASE_URL' && process.env.OPENAI_BASE_URL === undefined) {
          config.openaiBaseUrl = value;
        } else if (key === 'OPENAI_MODEL' && process.env.OPENAI_MODEL === undefined) {
          config.openaiModel = value;
        }
      }
    });
  }

  if (!config.openaiApiKey) {
    console.error(t('errors.noApiKey'));
    console.error(t('errors.setApiKey'));
    process.exit(1);
  }

  return config;
}

/**
 * Get git diff of staged changes
 * @returns Git diff content
 */
async function getGitDiff(): Promise<string> {
  try {
    // Get staged changes
    const diff = await $`git diff --cached`.text();

    if (!diff) {
      console.error(t('commit.noStaged'));
      console.error(t('commit.useGitAdd'));
      process.exit(1);
    }

    return diff;
  } catch (error) {
    console.error(t('errors.gitError'), error);
    process.exit(1);
  }
}

/**
 * Get list of changed files
 * @returns Array of changed file paths
 */
async function getChangedFiles(): Promise<string[]> {
  try {
    const files = (await $`git diff --cached --name-only`.text())
      .trim()
      .split('\n')
      .filter((f: string) => f);

    return files;
  } catch (error) {
    return [];
  }
}

/**
 * Generate commit message using AI
 * @param openai - OpenAI client instance
 * @param model - OpenAI model to use
 * @param diff - Git diff content
 * @param files - Array of changed files
 * @returns Generated commit message
 */
async function generateCommitMessage(
  openai: OpenAI,
  model: string,
  diff: string,
  files: string[]
): Promise<string> {
  const prompt = getCommitPrompt(diff, files);

  try {
    const response = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.5,
      max_tokens: 500,
    });

    const message = response.choices[0]?.message?.content?.trim();
    if (!message) {
      throw new Error(t('errors.apiFailed'));
    }

    return message;
  } catch (error) {
    console.error(t('commit.failed'), error);
    process.exit(1);
  }
}

/**
 * Execute git commit with the provided message
 * @param message - Commit message to use
 */
async function executeCommit(message: string) {
  try {
    await $`git commit -m "${message.replace(/"/g, '\\"')}"`;
    console.log(t('commit.success'));
  } catch (error) {
    console.error(t('commit.failed'), error);
    process.exit(1);
  }
}

/**
 * Parse command line arguments
 * @param args - Command line arguments array
 * @returns Parsed arguments object
 */
function parseArgs(args: string[]): { auto: boolean; edit: boolean } {
  return {
    auto: args.includes('--auto') || args.includes('-a'),
    edit: args.includes('--edit') || args.includes('-e'),
  };
}

/**
 * Main function to generate commit message
 * @param args - Command line arguments
 */
export async function generateCommit(args: string[]) {
  console.log(t('commit.starting'));

  const config = loadConfig();
  const { auto, edit } = parseArgs(args);

  // Get git diff
  const diff = await getGitDiff();
  const files = await getChangedFiles();

  console.log(t('commit.foundStaged', { count: files.length }));
  files.forEach(f => console.log(`   - ${f}`));
  console.log('');

  // Initialize OpenAI client
  const openai = new OpenAI({
    apiKey: config.openaiApiKey,
    baseURL: config.openaiBaseUrl,
  });

  // Generate commit message
  console.log(t('commit.generating'));
  const message = await generateCommitMessage(openai, config.openaiModel, diff, files);

  console.log(t('commit.generated'));
  console.log('━'.repeat(60));
  console.log(message);
  console.log('━'.repeat(60));
  console.log('');

  if (auto) {
    // Auto commit mode
    await executeCommit(message);
  } else if (edit) {
    // Edit mode
    console.log(t('commit.editMode'));
    const tempFile = path.join(process.cwd(), '.git', 'COMMIT_EDITMSG');
    fs.writeFileSync(tempFile, message);
    
    try {
      await $`git commit -e -F "${tempFile}"`;
      console.log(t('commit.success'));
    } catch (error) {
      console.log(t('commit.cancelled'));
    }
  } else {
    // Confirmation mode
    console.log(t('commit.tips'));
    console.log(t('commit.autoTip'));
    console.log(t('commit.editTip'));
    console.log(t('commit.manualTip'));
    
    // Save to file
    const commitMsgFile = path.join(process.cwd(), '.ai-commit-message.txt');
    fs.writeFileSync(commitMsgFile, message);
    console.log(t('commit.saved', { path: commitMsgFile }));
  }
}