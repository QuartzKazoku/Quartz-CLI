import OpenAI from 'openai';
import { $ } from 'bun';
import fs from 'node:fs';
import path from 'node:path';
import { t } from '../i18n';
import { getPRPrompt } from '../utils/prompt';

/**
 * Load configuration from environment variables and .env file
 * @returns Configuration object
 */
function loadConfig() {
  const config = {
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    openaiBaseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    openaiModel: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
    githubToken: process.env.GITHUB_TOKEN || '',
  };

  // Try to load from .env file
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const lines = envContent.split('\n');
    for (const line of lines) {
      const regex = /^([^=]+)=(.*)$/;
      const match = regex.exec(line);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        if (key === 'OPENAI_API_KEY' && !config.openaiApiKey) {
          config.openaiApiKey = value;
        } else if (key === 'OPENAI_BASE_URL' && process.env.OPENAI_BASE_URL === undefined) {
          config.openaiBaseUrl = value;
        } else if (key === 'OPENAI_MODEL' && process.env.OPENAI_MODEL === undefined) {
          config.openaiModel = value;
        } else if (key === 'GITHUB_TOKEN' && !config.githubToken) {
          config.githubToken = value;
        }
      }
    }
  }

  if (!config.openaiApiKey) {
    console.error(t('errors.noApiKey'));
    console.error(t('errors.setApiKey'));
    process.exit(1);
  }

  return config;
}

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
    const branches = (await $`git branch --format='%(refname:short)'`.text())
      .trim()
      .split('\n')
      .filter(Boolean);
    return branches;
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
async function getRepoInfo(): Promise<{ owner: string; repo: string } | null> {
  try {
    const remoteUrl = (await $`git remote get-url origin`.text()).trim();

    // Parse GitHub URL
    // Support formats: git@github.com:owner/repo.git or https://github.com/owner/repo.git
    const sshRegex = /git@github\.com:(.+?)\/(.+?)(\.git)?$/;
    const httpsRegex = /https:\/\/github\.com\/(.+?)\/(.+?)(\.git)?$/;
    const sshMatch = sshRegex.exec(remoteUrl);
    const httpsMatch = httpsRegex.exec(remoteUrl);

    if (sshMatch) {
      return { owner: sshMatch[1], repo: sshMatch[2] };
    } else if (httpsMatch) {
      return { owner: httpsMatch[1], repo: httpsMatch[2] };
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
    const commits = (await $`git log ${baseBranch}..HEAD --pretty=format:"%s"`.text())
      .trim()
      .split('\n')
      .filter(Boolean);

    return commits;
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
    const files = (await $`git diff ${baseBranch}...HEAD --name-only`.text())
      .trim()
      .split('\n')
      .filter(Boolean);

    return files;
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
 * Create GitHub PR using API
 * @param token - GitHub token
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param title - PR title
 * @param body - PR body
 * @param head - Head branch
 * @param base - Base branch
 * @returns Created PR object
 */
async function createGitHubPR(
  token: string,
  owner: string,
  repo: string,
  title: string,
  body: string,
  head: string,
  base: string
) {
  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        body,
        head,
        base,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`GitHub API error: ${error.message || response.statusText}`);
    }

    const pr = await response.json();
    return pr;
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

    await $`gh pr create --title "${title.replaceAll('"', String.raw`\"`)}" --body-file "${tempFile}" --base ${baseBranch}"`;

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
function parseArgs(args: string[]): { auto: boolean; base: string | null; useGH: boolean; interactive: boolean } {
  const result = {
    auto: args.includes('--auto') || args.includes('-a'),
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
  const { auto, base: specifiedBase, useGH, interactive } = parseArgs(args);

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
    apiKey: config.openaiApiKey,
    baseURL: config.openaiBaseUrl,
  });

  // Generate PR description
  console.log(t('pr.generating'));
  const { title, body } = await generatePRDescription(
    openai,
    config.openaiModel,
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

  if (auto) {
    // Auto create PR
    console.log(t('pr.creating'));

    if (useGH) {
      // Use GitHub CLI
      await createPRWithGH(title, body, baseBranch);
    } else if (config.githubToken && repoInfo) {
      // Use GitHub API
      const pr = await createGitHubPR(
        config.githubToken,
        repoInfo.owner,
        repoInfo.repo,
        title,
        body,
        currentBranch,
        baseBranch
      );
      console.log(t('pr.success'));
      console.log(`🔗 ${pr.html_url}`);
    } else {
      console.error(t('pr.failed'));
      process.exit(1);
    }
  } else {
    // Save to file
    const prFile = path.join(process.cwd(), '.ai-pr-description.md');
    fs.writeFileSync(prFile, `# ${title}\n\n${body}`);
    console.log(t('pr.saved', { path: prFile }));

    console.log(t('pr.tips'));
    console.log(t('pr.autoTip'));
    console.log(t('pr.ghTip'));
    console.log(t('pr.selectTip'));
    console.log(t('pr.baseTip'));
    console.log(t('pr.manualTip'));
  }
}