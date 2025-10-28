//app/commands/commit.ts
//cli/commands/commit.ts
import OpenAI from 'openai';
import { $ } from '@/utils/shell';
import { execa } from 'execa';
import fs from 'node:fs';
import path from 'node:path';
import { t } from '@/i18n';
import { getCommitPrompt } from '@/utils/prompt';
import { loadConfig } from '@/utils/config';
import { selectFromList, formatCommitMessage } from '@/utils/enquirer';
import { logger } from '@/utils/logger';

/**
 * Stage all changes using git add .
 */
async function stageAllChanges(): Promise<void> {
  try {
    await $`git add .`;
    logger.success(t('commit.autoStaged'));
  } catch (error) {
    logger.error(t('commit.stageFailed'), error);
    process.exit(1);
  }
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
      logger.error(t('commit.noStaged'));
      process.exit(1);
    }

    return diff;
  } catch (error) {
    logger.error(t('errors.gitError'), error);
    process.exit(1);
  }
}

/**
 * Get list of changed files
 * @returns Array of changed file paths
 */
async function getChangedFiles(): Promise<string[]> {
  try {
    return (await $`git diff --cached --name-only`.text())
      .trim()
      .split('\n')
      .filter(Boolean);
  } catch (error) {
    logger.error('Failed to get changed files:', error);
    return [];
  }
}

/**
 * Generate multiple commit messages using AI
 * @param openai - OpenAI client instance
 * @param model - OpenAI model to use
 * @param diff - Git diff content
 * @param files - Array of changed files
 * @param count - Number of messages to generate
 * @returns Array of generated commit messages
 */
async function generateCommitMessages(
  openai: OpenAI,
  model: string,
  diff: string,
  files: string[],
  count: number = 3
): Promise<string[]> {
  const prompt = getCommitPrompt(diff, files);
  const messages: string[] = [];

  const spinner = logger.spinner(t('commit.generatingOptions', { count }));

  try {
    // Generate multiple messages in parallel
    const promises = Array.from({ length: count }, async () => {
      const response = await openai.chat.completions.create({
        model,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7, // Slightly higher for variety
        max_tokens: 500,
      });

      const message = response.choices[0]?.message?.content?.trim();
      if (!message) {
        throw new Error(t('errors.apiFailed'));
      }
      return message;
    });

    const results = await Promise.all(promises);
    messages.push(...results);

    spinner.succeed(t('commit.generatingOptions', { count }));
    return messages;
  } catch (error) {
    spinner.fail(t('commit.failed'));
    logger.error(t('commit.failed'), error);
    process.exit(1);
  }
}

/**
 * Display interactive selection menu using enquirer
 * @param messages - Array of commit messages to choose from
 * @returns Selected message index
 */
async function selectCommitMessage(messages: string[]): Promise<number> {
  try {
    return await selectFromList(
      t('commit.selectPrompt'),
      messages,
      formatCommitMessage,
      0
    );
  } catch (error) {
    logger.line();
    logger.warn(t('commit.cancelled'));
    if (error instanceof Error) {
      logger.error('Selection error:', error.message);
    }
    process.exit(0);
  }
}

/**
 * Execute git commit with the provided message
 * @param message - Commit message to use
 */
async function executeCommit(message: string) {
  try {
    // Use execa with array arguments to properly handle multiline messages
    await execa('git', ['commit', '-m', message]);
    logger.success(t('commit.success'));
  } catch (error) {
    logger.error(t('commit.failed'), error);
    process.exit(1);
  }
}

/**
 * Parse command line arguments
 * @param args - Command line arguments array
 * @returns Parsed arguments object
 */
function parseArgs(args: string[]): { edit: boolean } {
  return {
    edit: args.includes('--edit') || args.includes('-e'),
  };
}

/**
 * Main function to generate commit message
 * @param args - Command line arguments
 */
export async function generateCommit(args: string[]) {
  logger.info(t('commit.starting'));

  const config = loadConfig();
  const openAIConfig = config.openai
  if (!openAIConfig.apiKey) {
    logger.error(t('errors.noApiKey'));
    logger.error(t('errors.setApiKey'));
    process.exit(1);
  }

  const { edit } = parseArgs(args);

  // Stage all changes first
  await stageAllChanges();

  // Get git diff
  const diff = await getGitDiff();
  const files = await getChangedFiles();

  logger.info(t('commit.foundStaged', { count: files.length }));
  for (const f of files) {
    logger.listItem(f);
  }
  logger.line();

  // Initialize OpenAI client
  const openai = new OpenAI({
    apiKey: openAIConfig.apiKey,
    baseURL: openAIConfig.baseUrl,
  });

  // Generate 3 commit messages
  const messages = await generateCommitMessages(openai, openAIConfig.model, diff, files, 3);

  if (edit) {
    // Edit mode - show first message in editor
    logger.info(t('commit.editMode'));
    const tempFile = path.join(process.cwd(), '.git', 'COMMIT_EDITMSG');
    fs.writeFileSync(tempFile, messages[0]);

    try {
      await $`git commit -e -F ${tempFile}`;
      logger.success(t('commit.success'));
    } catch (error) {
      logger.error('Commit cancelled or failed:', error);
      logger.warn(t('commit.cancelled'));
    }
  } else {
    // Interactive selection mode
    const selectedIndex = await selectCommitMessage(messages);
    const selectedMessage = messages[selectedIndex];

    logger.info(t('commit.selectedMessage', { index: selectedIndex + 1 }));
    logger.separator(80);
    logger.log(selectedMessage);
    logger.separator(80);
    logger.line();

    // Execute commit with selected message
    await executeCommit(selectedMessage);
  }
}