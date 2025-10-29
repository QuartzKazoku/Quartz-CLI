//app/commands/pr.ts
import OpenAI from 'openai';
import { $ } from '@/utils/shell';
import fs from 'node:fs';
import path from 'node:path';
import { t } from '@/i18n/index';
import { getPRPrompt } from '@/utils/prompt';
import { getPlatformConfigs, loadConfig, type CLIOverrides } from '@/utils/config';
import { PlatformStrategy } from '@/app/strategies/platform';
import { PlatformStrategyFactory } from "@/app/strategies/factory";
import { logger } from '@/utils/logger';
import { select } from '@/utils/enquirer';

/**
 * Get current branch name
 * @returns Current branch name
 */
async function getCurrentBranch(): Promise<string> {
  try {
    return (await $`git branch --show-current`.text()).trim();
  } catch (error) {
    logger.error(t('errors.gitError'), error);
    process.exit(1);
  }
}

/**
 * Get all local branches
 * @returns Array of branch names
 */
async function getAllBranches(): Promise<string[]> {
  try {
    return (await $`git branch --format='%(refname:short)'`.text())
      .trim()
      .split('\n')
      .filter(Boolean);
  } catch (error) {
    logger.error(t('errors.gitError'), error);
    process.exit(1);
  }
}

/**
 * Interactive branch selector using enquirer
 * @param currentBranch - Current branch to exclude from selection
 * @returns Selected branch name
 */
async function selectBranch(currentBranch: string): Promise<string> {
  const allBranches = await getAllBranches();
  const branches = allBranches.filter(b => b !== currentBranch);

  if (branches.length === 0) {
    logger.error(t('pr.noBranches'));
    process.exit(1);
  }

  // Try to find common base branches and put them first
  const commonBases = new Set(['main', 'master', 'develop', 'dev']);
  const priorityBranches = branches.filter(b => commonBases.has(b));
  const otherBranches = branches.filter(b => !commonBases.has(b));
  const sortedBranches = [...priorityBranches, ...otherBranches];

  const choices = sortedBranches.map(branch => ({
    name: branch,
    value: branch,
    message: branch,
  }));

  return await select(t('pr.selectBranch'), choices, 0);
}

/**
 * Get remote repository information
 * @returns Repository owner and name, or null if not found
 */
async function getRepoInfo(): Promise<{ owner: string; repo: string; platform: 'github' | 'gitlab' } | null> {
  try {
    const remoteUrl = (await $`git remote get-url origin`.text()).trim();

    // Parse GitHub URL
    // Support formats: git@github.com:owner/repo.git or https://github.com/owner/repo.git
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
    // Support formats: git@gitlab.com:owner/repo.git or https://gitlab.com/owner/repo.git
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
 * Get diff with base branch
 * @param baseBranch - Base branch name
 * @returns Git diff content
 */
async function getDiffWithBase(baseBranch: string): Promise<string> {
  try {
    const diff = await $`git diff ${baseBranch}...HEAD`.text();

    if (!diff) {
      logger.error(t('pr.noDiff', { base: baseBranch }));
      process.exit(1);
    }

    return diff;
  } catch (error) {
    logger.error(t('errors.gitError'), error);
    logger.error(t('pr.ensureBranch', { base: baseBranch }));
    process.exit(1);
  }
}

/**
 * Get commit history since base branch
 * @param baseBranch - Base branch name
 * @returns Array of commit messages
 */
async function getCommitHistory(baseBranch: string): Promise<string[]> {
  try {
    return (await $`git log ${baseBranch}..HEAD --pretty=format:"%s"`.text())
      .trim()
      .split('\n')
      .filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Get list of changed files since base branch
 * @param baseBranch - Base branch name
 * @returns Array of changed file paths
 */
async function getChangedFiles(baseBranch: string): Promise<string[]> {
  try {
    return (await $`git diff ${baseBranch}...HEAD --name-only`.text())
      .trim()
      .split('\n')
      .filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Generate multiple PR descriptions using AI
 * @param openai - OpenAI client instance
 * @param model - OpenAI model to use
 * @param diff - Git diff content
 * @param commits - Array of commit messages
 * @param files - Array of changed files
 * @param currentBranch - Current branch name
 * @param baseBranch - Base branch name
 * @param count - Number of descriptions to generate
 * @returns Array of generated PR descriptions
 */
async function generatePRDescriptions(
  openai: OpenAI,
  model: string,
  diff: string,
  commits: string[],
  files: string[],
  currentBranch: string,
  baseBranch: string,
  count: number = 3
): Promise<Array<{ title: string; body: string }>> {
  const prompt = getPRPrompt(diff, commits, files, currentBranch, baseBranch);
  const descriptions: Array<{ title: string; body: string }> = [];

  try {
    // Generate multiple descriptions in parallel
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
        max_tokens: 1500,
        response_format: { type: 'json_object' },
      });

      const result = response.choices[0]?.message?.content;
      if (!result) {
        throw new Error(t('errors.apiFailed'));
      }

      const parsed = JSON.parse(result);
      return {
        title: parsed.title || 'Update',
        body: parsed.body || 'Update code',
      };
    });

    const results = await Promise.all(promises);
    descriptions.push(...results);

    return descriptions;
  } catch (error) {
    logger.error(t('pr.failed'), error);
    process.exit(1);
  }
}

/**
 * Generate single PR description using AI (for backward compatibility)
 * @param openai - OpenAI client instance
 * @param model - OpenAI model to use
 * @param diff - Git diff content
 * @param commits - Array of commit messages
 * @param files - Array of changed files
 * @param currentBranch - Current branch name
 * @param baseBranch - Base branch name
 * @returns Generated PR title and body
 */
async function generatePRDescription(
  openai: OpenAI,
  model: string,
  diff: string,
  commits: string[],
  files: string[],
  currentBranch: string,
  baseBranch: string
): Promise<{ title: string; body: string }> {
  const descriptions = await generatePRDescriptions(openai, model, diff, commits, files, currentBranch, baseBranch, 1);
  return descriptions[0];
}

/**
 * Check if branch exists on remote
 * @param branch - Branch name
 * @returns True if branch exists on remote
 */
async function isBranchOnRemote(branch: string): Promise<boolean> {
  try {
    await $`git ls-remote --heads origin ${branch}`.text();
    return true;
  } catch {
    return false;
  }
}

/**
 * Push current branch to remote
 * @param branch - Branch name
 */
async function pushBranchToRemote(branch: string): Promise<void> {
  try {
    await $`git push -u origin ${branch}`.quiet();
  } catch (error) {
    throw new Error(`Failed to push branch: ${error}`);
  }
}

/**
 * Create PR/MR using strategy pattern
 * @param strategy - Platform strategy instance
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param title - PR title
 * @param body - PR body
 * @param head - Source branch
 * @param base - Target branch
 */
async function createPullRequestWithStrategy(
  strategy: PlatformStrategy,
  owner: string,
  repo: string,
  title: string,
  body: string,
  head: string,
  base: string
) {
  try {
    // Check if branch exists on remote
    const isHeadOnRemote = await strategy.isBranchOnRemote(head);
    if (!isHeadOnRemote) {
      logger.info(t('pr.pushingBranch', { branch: head }));
      await strategy.pushBranchToRemote(head);
      logger.success(t('pr.branchPushed'));
    }

    // Create PR/MR
    return await strategy.createPullRequest(owner, repo, title, body, head, base);
  } catch (error) {
    logger.error(t('pr.failed'), error);
    process.exit(1);
  }
}

/**
 * Display interactive selection menu for PR descriptions
 * @param descriptions - Array of PR descriptions to choose from
 * @returns Selected description index
 */
async function selectPRDescription(descriptions: Array<{ title: string; body: string }>): Promise<number> {
  try {
    const choices = descriptions.map((desc, index) => ({
      name: String(index),
      value: index,
      message: `[${index + 1}] ${desc.title}`,
    }));

    return await select(t('pr.selectPrompt'), choices, 0);
  } catch (error) {
    logger.line();
    logger.warn(t('pr.cancelled'));
    if (error instanceof Error) {
      logger.error('Selection error:', error.message);
    }
    process.exit(0);
  }
}

/**
 * Format PR description for display
 * @param description - PR description object
 * @param index - Index number
 * @returns Formatted string
 */
function formatPRDescription(description: { title: string; body: string }, index: number): string {
  const lines = description.body.split('\n');
  const firstLine = lines[0];
  const rest = lines.slice(1).filter(l => l.trim());
  
  let formatted = `[${index + 1}] ${description.title}`;
  if (firstLine && firstLine.trim()) {
    formatted += `\n    ${firstLine}`;
  }
  if (rest.length > 0) {
    formatted += `\n    ${rest.slice(0, 2).join('\n    ')}`;
    if (rest.length > 2) {
      formatted += '\n    ...';
    }
  }
  
  return formatted;
}

/**
 * Create PR using GitHub CLI
 * @param title - PR title
 * @param body - PR body
 * @param baseBranch - Base branch name
 */
async function createPRWithGH(title: string, body: string, baseBranch: string) {
  try {
    // Save body to temporary file
    const tempFile = path.join(process.cwd(), '.ai-pr-body.md');
    fs.writeFileSync(tempFile, body);

    const escapedTitle = title.replaceAll('"', String.raw`\"`);
    await $`gh pr create --title "${escapedTitle}" --body-file "${tempFile}" --base ${baseBranch}"`;

    // Delete temporary file
    fs.unlinkSync(tempFile);

    logger.success(t('pr.success'));
  } catch (error) {
    logger.error(t('pr.failed'), error);
    process.exit(1);
  }
}

/**
 * Parse command line arguments
 * @param args - Command line arguments array
 * @returns Parsed arguments object
 */
function parseArgs(args: string[]): { base: string | null; useGH: boolean; interactive: boolean; auto: boolean } {
  const result = {
    base: null as string | null,
    useGH: args.includes('--gh'),
    interactive: args.includes('--select') || args.includes('-s'),
    auto: args.includes('--auto'),
  };

  const baseIndex = args.findIndex(arg => arg === '--base' || arg === '-b');
  if (baseIndex !== -1 && args[baseIndex + 1]) {
    result.base = args[baseIndex + 1];
  }

  return result;
}

/**
 * Main function to generate PR description
 * @param args - Command line arguments
 * @param cliOverrides - CLI overrides for OpenAI config
 */
export async function generatePR(args: string[], cliOverrides?: CLIOverrides) {
  logger.section(t('pr.starting'));

  const config = loadConfig(cliOverrides);
  let openAIConfig = config.openai;
  if (!openAIConfig.apiKey) {
    logger.error(t('errors.noApiKey'));
    logger.error(t('errors.setApiKey'));
    process.exit(1);
  }

  const { base: specifiedBase, useGH, interactive, auto } = parseArgs(args);

  // Get current branch
  const currentBranch = await getCurrentBranch();

  // Determine base branch
  let baseBranch: string;
  if (interactive || specifiedBase === null) {
    // Interactive mode: let user select branch
    baseBranch = await selectBranch(currentBranch);
  } else {
    // Use specified base branch
    baseBranch = specifiedBase;
  }

  if (currentBranch === baseBranch) {
    logger.error(t('pr.sameBranch', { current: currentBranch }));
    logger.error(t('pr.switchBranch'));
    process.exit(1);
  }

  logger.line();
  logger.keyValue(t('pr.currentBranch'), logger.text.primary(currentBranch));
  logger.keyValue(t('pr.targetBranch'), logger.text.primary(baseBranch));

  // Get repository information
  const repoInfo = await getRepoInfo();
  if (repoInfo) {
    logger.keyValue(t('pr.repository'), logger.text.primary(`${repoInfo.owner}/${repoInfo.repo}`));
  }
  logger.line();

  // Get change information
  const diff = await getDiffWithBase(baseBranch);
  const commits = await getCommitHistory(baseBranch);
  const files = await getChangedFiles(baseBranch);

  logger.section(t('pr.statistics'));
  logger.listItem(`${logger.text.primary(commits.length.toString())} ${t('pr.commits')}`);
  logger.listItem(`${logger.text.primary(files.length.toString())} ${t('pr.filesChanged')}`);
  logger.line();

  // Initialize OpenAI client
  const openai = new OpenAI({
    apiKey: openAIConfig.apiKey,
    baseURL: openAIConfig.baseUrl,
  });

  // Generate PR descriptions
  let selectedDescription: { title: string; body: string };

  if (auto) {
    // Auto mode: generate single description
    const spinner = logger.spinner(t('pr.generating'));
    selectedDescription = await generatePRDescription(
      openai,
      openAIConfig.model,
      diff,
      commits,
      files,
      currentBranch,
      baseBranch
    );
    spinner.succeed(t('pr.generating'));

    logger.line();
    logger.section(t('pr.generatedTitle'));
    logger.box(selectedDescription.title, { padding: 1 });

    logger.section(t('pr.generatedBody'));
    logger.box(selectedDescription.body, { padding: 1 });
    logger.line();
  } else {
    // Interactive mode: generate 3 descriptions and let user choose
    const spinner = logger.spinner(t('pr.generatingOptions', { count: 3 }));
    const descriptions = await generatePRDescriptions(
      openai,
      openAIConfig.model,
      diff,
      commits,
      files,
      currentBranch,
      baseBranch,
      3
    );
    spinner.succeed(t('pr.generatingOptions', { count: 3 }));

    logger.line();
    logger.section(t('pr.generatedOptions'));
    
    // Display all options
    descriptions.forEach((desc, index) => {
      logger.box(formatPRDescription(desc, index), { padding: 1, title: `选项 ${index + 1}` });
      logger.line();
    });

    // Let user select
    const selectedIndex = await selectPRDescription(descriptions);
    selectedDescription = descriptions[selectedIndex];

    logger.info(t('pr.selectedOption', { index: selectedIndex + 1 }));
    logger.separator(80);
    logger.box(selectedDescription.title, { padding: 1, title: '选中的标题' });
    logger.line();
    logger.box(selectedDescription.body, { padding: 1, title: '选中的描述' });
    logger.separator(80);
    logger.line();
  }

  // Auto-create PR/MR (default behavior)
  const createSpinner = logger.spinner(t('pr.creating'));

  if (useGH) {
    // Use GitHub CLI
    await createPRWithGH(selectedDescription.title, selectedDescription.body, baseBranch);
    createSpinner.succeed(t('pr.success'));
  } else if (repoInfo) {
    // Get all platform configurations
    const platformConfigs = getPlatformConfigs(cliOverrides);

    // Find configuration matching current repository platform
    const matchingConfig = platformConfigs.find(p => p.type === repoInfo.platform);

    if (!matchingConfig) {
      createSpinner.fail(t('pr.noToken'));
      logger.error(`   请为 ${repoInfo.platform} 配置 token`);
      logger.error(t('pr.useGHTip'));
      process.exit(1);
    }

    // Use strategy pattern to create PR/MR
    const strategy = PlatformStrategyFactory.create(matchingConfig);
    const result = await createPullRequestWithStrategy(
      strategy,
      repoInfo.owner,
      repoInfo.repo,
      selectedDescription.title,
      selectedDescription.body,
      currentBranch,
      baseBranch
    );

    createSpinner.succeed(t('pr.success'));
    logger.line();
    logger.box(`🔗 ${result.url}`, { title: 'PR/MR URL', padding: 1 });
  } else {
    createSpinner.fail(t('pr.noToken'));
    logger.error(t('pr.useGHTip'));
    process.exit(1);
  }
}