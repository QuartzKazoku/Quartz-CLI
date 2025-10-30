// app/commands/branch.ts
import {$} from '@/utils/shell';
import {t} from '@/i18n';
import {logger} from '@/utils/logger';
import {select, input, confirm, multiselect} from '@/utils/enquirer';
import {getConfigManager} from '@/manager/config';
import {PlatformStrategyFactory} from '@/app/strategies/factory';

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
            return {owner: githubSshMatch[1], repo: githubSshMatch[2], platform: 'github'};
        } else if (githubHttpsMatch) {
            return {owner: githubHttpsMatch[1], repo: githubHttpsMatch[2], platform: 'github'};
        }

        // Parse GitLab URL
        const gitlabSshRegex = /git@([^:]+):([^/]+)\/([^/]+?)(?:\.git)?$/;
        const gitlabHttpsRegex = /https:\/\/([^/]+)\/([^/]+)\/([^/]+?)(?:\.git)?$/;
        const gitlabSshMatch = gitlabSshRegex.exec(remoteUrl);
        const gitlabHttpsMatch = gitlabHttpsRegex.exec(remoteUrl);

        if (gitlabSshMatch?.[1]?.includes('gitlab')) {
            return {owner: gitlabSshMatch[2], repo: gitlabSshMatch[3], platform: 'gitlab'};
        } else if (gitlabHttpsMatch?.[1]?.includes('gitlab')) {
            return {owner: gitlabHttpsMatch[2], repo: gitlabHttpsMatch[3], platform: 'gitlab'};
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
        logger.warn(t('branch.noRepoInfo'));
        return [];
    }

    const configManager = getConfigManager();
    const platformConfigs = configManager.getPlatformConfigs();
    const matchingConfig = platformConfigs.find(p => p.type === repoInfo.platform);

    if (!matchingConfig) {
        logger.warn(t('branch.noToken'));
        return [];
    }

    try {
        const strategy = PlatformStrategyFactory.create(matchingConfig);
        return await strategy.fetchIssues(repoInfo.owner, repoInfo.repo);
    } catch (error) {
        logger.warn(t('branch.fetchIssuesFailed'), error);
        return [];
    }
}

/**
 * Generate branch name from issue
 * @param issue - Issue object
 * @returns Generated branch name
 */
function generateBranchName(issue: { number: number; title: string; labels: string[] }): string {
    // Determine branch type from labels
    let type = 'feature';
    const labels = issue.labels || [];
    if (labels.some(l => l?.toLowerCase().includes('bug'))) {
        type = 'fix';
    } else if (labels.some(l => l?.toLowerCase().includes('doc'))) {
        type = 'docs';
    } else if (labels.some(l => l?.toLowerCase().includes('refactor'))) {
        type = 'refactor';
    } else if (labels.some(l => l?.toLowerCase().includes('test'))) {
        type = 'test';
    } else if (labels.some(l => l?.toLowerCase().includes('chore'))) {
        type = 'chore';
    }

    // Clean and format title
    const title = issue.title || 'untitled';
    const cleanTitle = title
        .toLowerCase()
        .replaceAll(/[^\w\s-]/g, '') // Remove special characters
        .replaceAll(/\s+/g, '-') // Replace spaces with hyphens
        .replaceAll(/-+/g, '-') // Replace multiple hyphens with single hyphen
        .substring(0, 50); // Limit length

    const issueNumber = issue.number || 0;
    return `${type}/${issueNumber}-${cleanTitle}`;
}

/**
 * Create a new branch
 * @param branchName - Name of the branch to create
 * @param checkout - Whether to checkout the branch after creation
 */
async function createBranch(branchName: string, checkout: boolean = true): Promise<void> {
    try {
        if (checkout) {
            await $`git checkout -b ${branchName}`.text();
            logger.success(t('branch.created', {name: branchName}));
        } else {
            await $`git branch ${branchName}`.text();
            logger.success(t('branch.createdNoCheckout', {name: branchName}));
        }
    } catch (error: any) {
        // Extract the actual git error message
        const errorMessage = error?.message || String(error);

        // Parse git error messages for better user feedback
        if (errorMessage.includes('already exists') || errorMessage.includes('cannot lock ref')) {
            logger.error(`Branch "${branchName}" already exists`);
            logger.info('Switch to existing branch: git checkout ' + branchName);
        } else if (errorMessage.includes('not a valid branch name')) {
            logger.error(`"${branchName}" is not a valid branch name`);
            logger.info('Branch names cannot contain spaces or special characters like :, ~, ^, ?, *, [');
        } else {
            // Show the actual git error message
            logger.error('Failed to create branch');
            // Extract just the git error without the command wrapper
            const gitError = errorMessage.split('\n').find((line: string) => line.trim().startsWith('fatal:') || line.trim().startsWith('error:'));
            if (gitError) {
                logger.info(gitError.trim());
            } else {
                logger.info(errorMessage);
            }
        }
        process.exit(1);
    }
}

/**
 * Delete a branch
 * @param branchName - Name of the branch to delete
 * @param force - Whether to force delete
 */
async function deleteBranch(branchName: string, force: boolean = false): Promise<void> {
    try {
        const currentBranch = await getCurrentBranch();
        if (currentBranch === branchName) {
            logger.error(t('branch.cannotDeleteCurrent'));
            process.exit(1);
        }

        const flag = force ? '-D' : '-d';
        await $`git branch ${flag} ${branchName}`.quiet();
        logger.success(t('branch.deleted', {name: branchName}));
    } catch (error) {
        logger.error(t('branch.deleteFailed'), error);
        if (!force) {
            logger.info(t('branch.useForceDelete'));
        }
        process.exit(1);
    }
}

/**
 * List all branches with current branch highlighted
 */
async function listBranches(): Promise<void> {
    const branches = await getAllBranches();
    const currentBranch = await getCurrentBranch();

    logger.section(t('branch.list'));
    for (const branch of branches) {
        if (branch === currentBranch) {
            logger.listItem(`${logger.text.success('* ' + branch)} ${logger.text.dim('(current)')}`);
        } else {
            logger.listItem(`  ${branch}`);
        }
    }
    logger.line();
}

/**
 * Interactive branch creation with issue selection
 */
async function interactiveCreate(): Promise<void> {
    logger.section(t('branch.createMode'));

    // Ask if user wants to create from issue
    const createFromIssue = await confirm(t('branch.createFromIssue'), false);

    if (createFromIssue) {
        const spinner = logger.spinner(t('branch.fetchingIssues'));
        const issues = await fetchIssues();
        spinner.stop();

        if (issues.length === 0) {
            logger.warn(t('branch.noIssues'));
            logger.info(t('branch.manualCreate'));
            const branchName = await input(t('branch.enterBranchName'));
            await createBranch(branchName);
            return;
        }

        // Select issue
        const choices = issues.map(issue => {
            const labelInfo = issue.labels.length > 0 ? ` [${issue.labels.join(', ')}]` : '';
            const message = `#${issue.number} - ${issue.title}${labelInfo}`;
            return {
                name: `${issue.number}`,
                value: issue,
                message,
            };
        });

        const selectedIssueNumberOrObject = await select(t('branch.selectIssue'), choices, 0);

        // Handle case where select returns name (string) instead of value (object)
        const selectedIssue = typeof selectedIssueNumberOrObject === 'string'
            ? issues.find(issue => `${issue.number}` === selectedIssueNumberOrObject)
            : selectedIssueNumberOrObject;

        if (!selectedIssue) {
            logger.error('Failed to find selected issue');
            process.exit(1);
        }

        const suggestedName = generateBranchName(selectedIssue);

        logger.info(t('branch.suggestedName', {name: suggestedName}));
        const useSuggested = await confirm(t('branch.useSuggestedName'), true);

        let branchName: string;
        if (useSuggested) {
            branchName = suggestedName;
        } else {
            branchName = await input(t('branch.enterBranchName'), suggestedName);
        }

        await createBranch(branchName);
    } else {
        const branchName = await input(t('branch.enterBranchName'));
        await createBranch(branchName);
    }
}

/**
 * Interactive branch deletion with multi-select support
 */
async function interactiveDelete(): Promise<void> {
    logger.section(t('branch.deleteMode'));

    const branches = await getAllBranches();
    const currentBranch = await getCurrentBranch();
    const deletableBranches = branches.filter(b => b !== currentBranch);

    if (deletableBranches.length === 0) {
        logger.warn(t('branch.noDeletableBranches'));
        return;
    }

    const choices = deletableBranches.map(branch => ({
        name: branch,
        value: branch,
        message: branch,
    }));

    const branchesToDelete = await multiselect(t('branch.selectBranchesToDelete'), choices);

    if (branchesToDelete.length === 0) {
        logger.info(t('branch.deleteCancelled'));
        return;
    }

    const confirmDelete = await confirm(
        t('branch.confirmDeleteMultiple', {count: branchesToDelete.length, branches: branchesToDelete.join(', ')}),
        false
    );

    if (confirmDelete) {
        const forceDelete = await confirm(t('branch.forceDelete'), false);

        logger.line();
        for (const branch of branchesToDelete) {
            try {
                await deleteBranch(branch, forceDelete);
            } catch (error) {
                // Continue deleting other branches even if one fails
                logger.error(t('branch.deleteFailed') + `: ${branch}`);
            }
        }
        logger.line();
        logger.success(t('branch.deleteComplete', {count: branchesToDelete.length}));
    } else {
        logger.info(t('branch.deleteCancelled'));
    }
}

/**
 * Main branch command function
 * @param args - Command line arguments
 */
export async function branchCommand(args: string[]): Promise<void> {
    logger.section(t('branch.starting'));

    // If no arguments, show interactive menu
    if (args.length === 0) {
        const action = await select(
            t('branch.selectAction'),
            [
                {name: 'create', value: 'create', message: t('branch.actionCreate')},
                {name: 'delete', value: 'delete', message: t('branch.actionDelete')},
                {name: 'list', value: 'list', message: t('branch.actionList')},
            ],
            0
        );

        switch (action) {
            case 'create':
                await interactiveCreate();
                break;
            case 'delete':
                await interactiveDelete();
                break;
            case 'list':
                await listBranches();
                break;
        }
        return;
    }

    // Parse command line arguments
    const subcommand = args[0];

    switch (subcommand) {
        case 'create':
        case 'c':
            if (args[1]) {
                await createBranch(args[1]);
            } else {
                await interactiveCreate();
            }
            break;

        case 'delete':
        case 'd':
            if (args[1]) {
                const force = args.includes('--force') || args.includes('-f');
                await deleteBranch(args[1], force);
            } else {
                await interactiveDelete();
            }
            break;

        case 'list':
        case 'l':
            await listBranches();
            break;

        default:
            logger.error(t('branch.unknownCommand', {command: subcommand}));
            logger.info(t('branch.usage'));
            process.exit(1);
    }
}