//cli/commands/pr.ts
import OpenAI from 'openai';
import {$} from 'bun';
import fs from 'node:fs';
import path from 'node:path';
import {t} from '../i18n';
import {getPRPrompt} from '../utils/prompt';
import {getPlatformConfigs, loadConfig} from '../utils/config';
import {PlatformStrategy} from '../strategies/platform';
import {PlatformStrategyFactory} from "../strategies/factory.ts";

/**
 * Get current branch name
 * @returns Current branch name
 */
async function getCurrentBranch(): Promise<string> {
  try {
    return (await $`git branch --show-current`.text()).trim();
  } catch (error) {
    console.error(t('errors.gitError'), error);
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
    console.error(t('errors.gitError'), error);
    process.exit(1);
  }
}

/**
 * Interactive branch selector with arrow keys
 * @param currentBranch - Current branch to exclude from selection
 * @returns Selected branch name
 */
async function selectBranch(currentBranch: string): Promise<string> {
  const allBranches = await getAllBranches();
  const branches = allBranches.filter(b => b !== currentBranch);
  
  if (branches.length === 0) {
    console.error(t('pr.noBranches'));
    process.exit(1);
  }

  // Try to find common base branches and put them first
  const commonBases = new Set(['main', 'master', 'develop', 'dev']);
  const priorityBranches = branches.filter(b => commonBases.has(b));
  const otherBranches = branches.filter(b => !commonBases.has(b));
  const sortedBranches = [...priorityBranches, ...otherBranches];

  let selectedIndex = 0;

  return new Promise<string>((resolve) => {
    // Set up raw mode for arrow key detection
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }
    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    const render = () => {
      // Clear previous output
      if (selectedIndex > 0) {
        process.stdout.write('\x1b[' + (sortedBranches.length + 2) + 'A');
      }
      process.stdout.write('\x1b[J');

      // Display title
      console.log(`\n${t('pr.selectBranch')}:\n`);

      // Display branches
      for (let index = 0; index < sortedBranches.length; index++) {
        const branch = sortedBranches[index];
        if (index === selectedIndex) {
          // Highlighted option with cyan color
          console.log(`  \x1b[36m❯ ${branch}\x1b[0m`);
        } else {
          // Normal option
          console.log(`    ${branch}`);
        }
      }
    };

    const cleanup = () => {
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(false);
      }
      process.stdin.pause();
      process.stdin.removeAllListeners('data');
    };

    render();

    process.stdin.on('data', (key: string) => {
      if (key === '\u001B[A') { // Up arrow
        selectedIndex = (selectedIndex - 1 + sortedBranches.length) % sortedBranches.length;
        render();
      } else if (key === '\u001B[B') { // Down arrow
        selectedIndex = (selectedIndex + 1) % sortedBranches.length;
        render();
      } else if (key === '\r' || key === '\n') { // Enter
        cleanup();
        console.log('');
        resolve(sortedBranches[selectedIndex]);
      } else if (key === '\u001B' || key === '\u0003') { // Esc or Ctrl+C
        cleanup();
        console.log('\n');
        process.exit(0);
      }
    });
  });
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
      console.error(t('pr.noDiff', { base: baseBranch }));
      process.exit(1);
    }

    return diff;
  } catch (error) {
    console.error(t('errors.gitError'), error);
    console.error(t('pr.ensureBranch', { base: baseBranch }));
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
 * Generate PR description using AI
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
  const prompt = getPRPrompt(diff, commits, files, currentBranch, baseBranch);

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
  } catch (error) {
    console.error(t('pr.failed'), error);
    process.exit(1);
  }
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
 * 使用策略模式创建PR/MR
 * @param strategy - 平台策略实例
 * @param owner - 仓库所有者
 * @param repo - 仓库名称
 * @param title - PR标题
 * @param body - PR正文
 * @param head - 源分支
 * @param base - 目标分支
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
    // 检查分支是否在远程存在
    const isHeadOnRemote = await strategy.isBranchOnRemote(head);
    if (!isHeadOnRemote) {
      console.log(t('pr.pushingBranch', { branch: head }));
      await strategy.pushBranchToRemote(head);
      console.log(t('pr.branchPushed'));
    }

    // 创建PR/MR
      return await strategy.createPullRequest(owner, repo, title, body, head, base);
  } catch (error) {
    console.error(t('pr.failed'), error);
    process.exit(1);
  }
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
    
    console.log(t('pr.success'));
  } catch (error) {
    console.error(t('pr.failed'), error);
    process.exit(1);
  }
}

/**
 * Parse command line arguments
 * @param args - Command line arguments array
 * @returns Parsed arguments object
 */
function parseArgs(args: string[]): { base: string | null; useGH: boolean; interactive: boolean } {
  const result = {
    base: null as string | null,
    useGH: args.includes('--gh'),
    interactive: args.includes('--select') || args.includes('-s'),
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
 */
export async function generatePR(args: string[]) {
  console.log(t('pr.starting'));

  const config = loadConfig();
  let openAIConfig = config.openai;
  if (!openAIConfig.apiKey) {
    console.error(t('errors.noApiKey'));
    console.error(t('errors.setApiKey'));
    process.exit(1);
  }
  
  const { base: specifiedBase, useGH, interactive } = parseArgs(args);

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
    console.error(t('pr.sameBranch', { current: currentBranch }));
    console.error(t('pr.switchBranch'));
    process.exit(1);
  }

  console.log(`${t('pr.currentBranch')}: ${currentBranch}`);
  console.log(`${t('pr.targetBranch')}: ${baseBranch}\n`);

  // Get repository information
  const repoInfo = await getRepoInfo();
  if (repoInfo) {
    console.log(`${t('pr.repository')}: ${repoInfo.owner}/${repoInfo.repo}\n`);
  }

  // Get change information
  const diff = await getDiffWithBase(baseBranch);
  const commits = await getCommitHistory(baseBranch);
  const files = await getChangedFiles(baseBranch);

  console.log(t('pr.statistics'));
  console.log(`   - ${commits.length} ${t('pr.commits')}`);
  console.log(`   - ${files.length} ${t('pr.filesChanged')}\n`);

  // Initialize OpenAI client
  const openai = new OpenAI({
    apiKey: openAIConfig.apiKey,
    baseURL: openAIConfig.baseUrl,
  });

  // Generate PR description
  console.log(t('pr.generating'));
  const { title, body } = await generatePRDescription(
    openai,
    openAIConfig.model,
    diff,
    commits,
    files,
    currentBranch,
    baseBranch
  );

  console.log(t('pr.generatedTitle'));
  console.log('━'.repeat(60));
  console.log(title);
  console.log('━'.repeat(60));
  console.log(t('pr.generatedBody'));
  console.log('━'.repeat(60));
  console.log(body);
  console.log('━'.repeat(60));
  console.log('');

  // 自动创建 PR/MR（默认行为）
  console.log(t('pr.creating'));

  if (useGH) {
    // 使用 GitHub CLI
    await createPRWithGH(title, body, baseBranch);
  } else if (repoInfo) {
    // 获取所有平台配置
    const platformConfigs = getPlatformConfigs();
    
    // 查找匹配当前仓库平台的配置
    const matchingConfig = platformConfigs.find(p => p.type === repoInfo.platform);
    
    if (!matchingConfig) {
      console.error(t('pr.noToken'));
      console.error(`   请为 ${repoInfo.platform} 配置 token`);
      console.error(t('pr.useGHTip'));
      process.exit(1);
    }

    // 使用策略模式创建PR/MR
    const strategy = PlatformStrategyFactory.create(matchingConfig);
    const result = await createPullRequestWithStrategy(
      strategy,
      repoInfo.owner,
      repoInfo.repo,
      title,
      body,
      currentBranch,
      baseBranch
    );
    
    console.log(t('pr.success'));
    console.log(`🔗 ${result.url}`);
  } else {
    console.error(t('pr.noToken'));
    console.error(t('pr.useGHTip'));
    process.exit(1);
  }
}