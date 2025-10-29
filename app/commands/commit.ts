//app/commands/commit.ts
import OpenAI from 'openai';
import { $ } from '@/utils/shell';
import { execa } from 'execa';
import fs from 'node:fs';
import path from 'node:path';
import { t } from '@/i18n';
import { getCommitPrompt } from '@/utils/prompt';
import { getConfigManager } from '@/manager/config';
import { selectFromList, formatCommitMessage, confirm, autocompleteIssue } from '@/utils/enquirer';
import { logger } from '@/utils/logger';
import { PlatformStrategyFactory } from '@/app/strategies/factory';

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
 * Get remote repository information
 * @returns Repository owner, name, and platform
 */
async function getRepoInfo(): Promise<{ owner: string; repo: string; platform: 'github' | 'gitlab' } | null> {
  try {
    const remoteUrl = (await $`git remote get-url origin`.text()).trim();

    // Parse GitHub URL
    const githubSshRegex = /git@github\.com:([^/]+)\/([^/]+?)(?:\.git)?$/;
    const githubHttpsRegex = /https:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?$/;
    const githubSshMatch = githubSshRegex.exec(remoteUrl);
    const githubHttpsMatch = githubHttpsRegex.exec(remoteUrl);

    if (githubSshMatch) {
      return { owner: githubSshMatch[1], repo: githubSshMatch[2], platform: 'github' };
    } else if (githubHttpsMatch) {
      return { owner: githubHttpsMatch[1], repo: githubHttpsMatch[2], platform: 'github' };
    }

    // Parse GitLab URL
    const gitlabSshRegex = /git@([^:]+):([^/]+)\/([^/]+?)(?:\.git)?$/;
    const gitlabHttpsRegex = /https:\/\/([^/]+)\/([^/]+)\/([^/]+?)(?:\.git)?$/;
    const gitlabSshMatch = gitlabSshRegex.exec(remoteUrl);
    const gitlabHttpsMatch = gitlabHttpsRegex.exec(remoteUrl);

    if (gitlabSshMatch?.[1]?.includes('gitlab')) {
      return { owner: gitlabSshMatch[2], repo: gitlabSshMatch[3], platform: 'gitlab' };
    } else if (gitlabHttpsMatch?.[1]?.includes('gitlab')) {
      return { owner: gitlabHttpsMatch[2], repo: gitlabHttpsMatch[3], platform: 'gitlab' };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Fetch issues from remote repository
 * @returns Array of issues
 */
async function fetchIssues(): Promise<Array<{ number: number; title: string; labels: string[] }>> {
  const repoInfo = await getRepoInfo();
  if (!repoInfo) {
    return [];
  }

  const configManager = getConfigManager();
  const platformConfigs = configManager.getPlatformConfigs();
  const matchingConfig = platformConfigs.find(p => p.type === repoInfo.platform);

  if (!matchingConfig) {
    return [];
  }

  try {
    if (repoInfo.platform === 'github') {
      const apiUrl = matchingConfig.url
        ? `${matchingConfig.url}/api/v3/repos/${repoInfo.owner}/${repoInfo.repo}/issues?state=open&per_page=20`
        : `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}/issues?state=open&per_page=20`;

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `token ${matchingConfig.token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        return [];
      }

      const issues = await response.json() as Array<{
        number: number;
        title: string;
        labels: Array<{ name: string }>;
      }>;

      return issues.map(issue => ({
        number: issue.number,
        title: issue.title,
        labels: issue.labels.map(l => l.name),
      }));
    } else if (repoInfo.platform === 'gitlab') {
      const apiUrl = matchingConfig.url
        ? `${matchingConfig.url}/api/v4/projects/${encodeURIComponent(`${repoInfo.owner}/${repoInfo.repo}`)}/issues?state=opened&per_page=20`
        : `https://gitlab.com/api/v4/projects/${encodeURIComponent(`${repoInfo.owner}/${repoInfo.repo}`)}/issues?state=opened&per_page=20`;

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${matchingConfig.token}`,
        },
      });

      if (!response.ok) {
        return [];
      }

      const issues = await response.json() as Array<{
        iid: number;
        title: string;
        labels: string[];
      }>;

      return issues.map(issue => ({
        number: issue.iid,
        title: issue.title,
        labels: issue.labels,
      }));
    }
  } catch (error) {
    // Silently fail if issues cannot be fetched
    return [];
  }

  return [];
}

/**
 * Add issue reference to commit message
 * @param message - Original commit message
 * @param issueNumber - Issue number to reference
 * @returns Commit message with issue reference
 */
function addIssueReference(message: string, issueNumber: number): string {
  // Add issue reference in footer following conventional commits format
  const lines = message.split('\n');
  const hasFooter = lines.length > 2 && lines[lines.length - 1].trim().length > 0;
  
  if (hasFooter) {
    // Append to existing footer
    return `${message}\nRefs: #${issueNumber}`;
  } else {
    // Add footer section
    return `${message}\n\nRefs: #${issueNumber}`;
  }
}

/**
 * Generate multiple commit messages using AI
 * @param openai - OpenAI client instance
 * @param model - OpenAI model to use
 * @param diff - Git diff content
 * @param files - Array of changed files
 * @param count - Number of messages to generate
 * @param issueNumber - Optional issue number to reference
 * @returns Array of generated commit messages
 */
async function generateCommitMessages(
  openai: OpenAI,
  model: string,
  diff: string,
  files: string[],
  count: number = 3,
  issueNumber?: number
): Promise<string[]> {
  const prompt = getCommitPrompt(diff, files, issueNumber);
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
 * Close an issue on the platform
 * @param issueNumber - Issue number to close
 */
async function closeIssueOnPlatform(issueNumber: number): Promise<void> {
  const repoInfo = await getRepoInfo();
  if (!repoInfo) {
    logger.warn('Cannot close issue: repository information not available');
    return;
  }

  const configManager = getConfigManager();
  const platformConfigs = configManager.getPlatformConfigs();
  const matchingConfig = platformConfigs.find(p => p.type === repoInfo.platform);

  if (!matchingConfig) {
    logger.warn('Cannot close issue: platform token not configured');
    return;
  }

  try {
    const spinner = logger.spinner(t('commit.closingIssue'));
    const strategy = PlatformStrategyFactory.create(matchingConfig);
    await strategy.closeIssue(repoInfo.owner, repoInfo.repo, issueNumber);
    spinner.succeed(t('commit.issueClosed', { number: issueNumber }));
  } catch (error) {
    logger.error('Failed to close issue:', error);
  }
}

/**
 * Parse command line arguments
 * @param args - Command line arguments array
 * @returns Parsed arguments object
 */
function parseArgs(args: string[]): { edit: boolean; issue: string | null } {
  const issueIndex = args.findIndex(arg => arg === '--issue' || arg === '-i');
  const issueNumber = issueIndex !== -1 && args[issueIndex + 1] ? args[issueIndex + 1] : null;
  
  return {
    edit: args.includes('--edit') || args.includes('-e'),
    issue: issueNumber,
  };
}

/**
 * Validate configuration before execution
 * @param config - Configuration object to validate
 */
function validateConfiguration(config: any): void {
  // Validate OpenAI configuration
  if (!config.openai?.apiKey) {
    logger.error(t('errors.noApiKey'));
    logger.error(t('errors.setApiKey'));
    process.exit(1);
  }
  
  if (!config.openai?.model) {
    logger.error('OpenAI model is not configured');
    logger.error('Please run: quartz config --set openai.model <model-name>');
    process.exit(1);
  }
  
  // Validate language configuration
  if (!config.language?.ui) {
    logger.error('UI language is not configured');
    logger.error('Please run: quartz config --set language.ui <language-code>');
    process.exit(1);
  }
  
  if (!config.language?.prompt) {
    logger.error('Prompt language is not configured');
    logger.error('Please run: quartz config --set language.prompt <language-code>');
    process.exit(1);
  }
}

/**
 * Main function to generate commit message
 * @param args - Command line arguments
 */
export async function generateCommit(args: string[]) {
  logger.info(t('commit.starting'));

  const configManager = getConfigManager();
  const config = configManager.readConfig();
  
  // Validate configuration before proceeding
  validateConfiguration(config);
  
  const openAIConfig = config.openai;

  const { edit, issue } = parseArgs(args);

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

  // Handle issue linking
  let linkedIssue: { number: number; title: string } | null = null;
  
  if (issue) {
    // Issue number provided via command line
    linkedIssue = { number: parseInt(issue, 10), title: '' };
    logger.info(t('commit.linkedIssue', { number: linkedIssue.number, title: linkedIssue.title }));
  } else {
    // Ask if user wants to link an issue
    try {
      const shouldLinkIssue = await confirm(t('commit.linkIssue'), false);
      
      if (shouldLinkIssue) {
        const spinner = logger.spinner(t('commit.fetchingIssues'));
        const issues = await fetchIssues();
        spinner.stop();

        if (issues.length === 0) {
          logger.warn(t('commit.noIssues'));
          logger.info(t('commit.skipIssue'));
        } else {
          // Select issue using autocomplete
          const selectedIssue = await autocompleteIssue(t('commit.selectIssue'), issues);
          linkedIssue = selectedIssue;
          logger.info(t('commit.linkedIssue', { number: linkedIssue.number, title: linkedIssue.title }));
          logger.line();
        }
      }
    } catch (error) {
      // User cancelled issue selection, continue without linking
      logger.info(t('commit.skipIssue'));
    }
  }

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
    let messageToEdit = messages[0];
    
    // Add issue reference if linked
    if (linkedIssue) {
      messageToEdit = addIssueReference(messageToEdit, linkedIssue.number);
    }
    
    const tempFile = path.join(process.cwd(), '.git', 'COMMIT_EDITMSG');
    fs.writeFileSync(tempFile, messageToEdit);

    try {
      await $`git commit -e -F ${tempFile}`;
      logger.success(t('commit.success'));

      // Ask if user wants to close the issue
      if (linkedIssue) {
        try {
          const shouldCloseIssue = await confirm(t('commit.closeIssue'), false);
          if (shouldCloseIssue) {
            await closeIssueOnPlatform(linkedIssue.number);
          }
        } catch (error) {
          // User cancelled, skip closing issue
        }
      }
    } catch (error) {
      logger.error('Commit cancelled or failed:', error);
      logger.warn(t('commit.cancelled'));
    }
  } else {
    // Interactive selection mode
    const selectedIndex = await selectCommitMessage(messages);
    let selectedMessage = messages[selectedIndex];

    // Add issue reference if linked
    if (linkedIssue) {
      selectedMessage = addIssueReference(selectedMessage, linkedIssue.number);
    }

    logger.info(t('commit.selectedMessage', { index: selectedIndex + 1 }));
    logger.separator(80);
    logger.log(selectedMessage);
    logger.separator(80);
    logger.line();

    // Execute commit with selected message
    await executeCommit(selectedMessage);

    // Ask if user wants to close the issue
    if (linkedIssue) {
      try {
        const shouldCloseIssue = await confirm(t('commit.closeIssue'), false);
        if (shouldCloseIssue) {
          await closeIssueOnPlatform(linkedIssue.number);
        }
      } catch (error) {
        // User cancelled, skip closing issue
      }
    }
  }
}