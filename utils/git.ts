// utils/git.ts
import { $ } from '@/utils/shell';
import {logger} from "@/utils/logger";
import {t} from "@/i18n";

/**
 * Repository information interface
 */
export interface RepoInfo {
    owner: string;
    repo: string;
    platform: 'github' | 'gitlab';
}

/**
 * Git command executor class
 * Encapsulates all git command operations for centralized maintenance
 */
export class GitExecutor {
    /**
     * Get current branch name
     * @returns Current branch name
     */
    static async getCurrentBranch(): Promise<string> {
        return (await $`git branch --show-current`.text()).trim();
    }

    /**
     * Get all local branches
     * @returns Array of branch names
     */
    static async getAllBranches(): Promise<string[]> {
        return (await $`git branch --format='%(refname:short)'`.text())
            .trim()
            .split('\n')
            .filter(Boolean);
    }

    /**
     * Get remote repository URL
     * @returns Remote URL string
     */
    static async getRemoteUrl(): Promise<string> {
        return (await $`git remote get-url origin`.text()).trim();
    }

    /**
     * Parse remote URL to get repository information
     * @param remoteUrl Remote repository URL
     * @returns Repository information or null
     */
    static parseRepoInfo(remoteUrl: string): RepoInfo | null {
        // Parse GitHub URL
        const githubSshRegex = /git@github\.com::?\/?([^/]+)\/([^/]+?)(?:\.git)?$/;
        const githubHttpsRegex = /https:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?$/;
        const githubSshMatch = githubSshRegex.exec(remoteUrl);
        const githubHttpsMatch = githubHttpsRegex.exec(remoteUrl);

        if (githubSshMatch) {
            return { owner: githubSshMatch[1], repo: githubSshMatch[2], platform: 'github' };
        }
        if (githubHttpsMatch) {
            return { owner: githubHttpsMatch[1], repo: githubHttpsMatch[2], platform: 'github' };
        }

        // Parse GitLab URL
        const gitlabSshRegex = /git@([^:]+)::?\/?([^/]+)\/([^/]+?)(?:\.git)?$/;
        const gitlabHttpsRegex = /https:\/\/([^/]+)\/([^/]+)\/([^/]+?)(?:\.git)?$/;
        const gitlabSshMatch = gitlabSshRegex.exec(remoteUrl);
        const gitlabHttpsMatch = gitlabHttpsRegex.exec(remoteUrl);

        if (gitlabSshMatch?.[1]?.includes('gitlab')) {
            return { owner: gitlabSshMatch[2], repo: gitlabSshMatch[3], platform: 'gitlab' };
        }
        if (gitlabHttpsMatch?.[1]?.includes('gitlab')) {
            return { owner: gitlabHttpsMatch[2], repo: gitlabHttpsMatch[3], platform: 'gitlab' };
        }

        return null;
    }

    /**
     * Get remote repository information
     * @returns Repository information or null
     */
    static async getRepoInfo(): Promise<RepoInfo | null> {
        try {
            const remoteUrl = await this.getRemoteUrl();
            return this.parseRepoInfo(remoteUrl);
        } catch {
            return null;
        }
    }

    /**
     * Create and optionally checkout a new branch
     * @param branchName Branch name to create
     * @param checkout Whether to checkout after creation
     */
    static async createBranch(branchName: string, checkout: boolean = true): Promise<void> {
        if (checkout) {
            await $`git checkout -b ${branchName}`.text();
        } else {
            await $`git branch ${branchName}`.text();
        }
    }

    /**
     * Delete a branch
     * @param branchName Branch name to delete
     * @param force Whether to force delete
     */
    static async deleteBranch(branchName: string, force: boolean = false): Promise<void> {
        const flag = force ? '-D' : '-d';
        await $`git branch ${flag} ${branchName}`.quiet();
    }

    /**
     * Stage all changes
     */
    static async stageAll(): Promise<void> {
        await $`git add .`;
    }

    /**
     * Get git diff of staged changes
     * @returns Git diff content
     */
    static async getStagedDiff(): Promise<string> {
        return await $`git diff --cached`.text();
    }

    /**
     * Get list of staged files
     * @returns Array of staged file paths
     */
    static async getStagedFiles(): Promise<string[]> {
        return (await $`git diff --cached --name-only`.text())
            .trim()
            .split('\n')
            .filter(Boolean);
    }

    /**
     * Get list of unstaged files
     * @returns Array of unstaged file paths
     */
    static async getUnstagedFiles(): Promise<string[]> {
        return (await $`git diff --name-only`.text())
            .trim()
            .split('\n')
            .filter(Boolean);
    }

    /**
     * Get diff with base branch
     * @param baseBranch Base branch name
     * @returns Git diff content
     */
    static async getDiffWithBase(baseBranch: string): Promise<string> {
        return await $`git diff ${baseBranch}...HEAD`.text();
    }

    /**
     * Get commit history since base branch
     * @param baseBranch Base branch name
     * @returns Array of commit messages
     */
    static async getCommitHistory(baseBranch: string): Promise<string[]> {
        return (await $`git log ${baseBranch}..HEAD --pretty=format:"%s"`.text())
            .trim()
            .split('\n')
            .filter(Boolean);
    }

    /**
     * Get list of changed files since base branch
     * @param baseBranch Base branch name
     * @returns Array of changed file paths
     */
    static async getChangedFilesSinceBase(baseBranch: string): Promise<string[]> {
        return (await $`git diff ${baseBranch}...HEAD --name-only`.text())
            .trim()
            .split('\n')
            .filter(Boolean);
    }

    /**
     * Check if branch exists on remote
     * @param branch Branch name
     * @returns True if branch exists on remote
     */
    static async isBranchOnRemote(branch: string): Promise<boolean> {
        try {
            const output = await $`git ls-remote --heads origin ${branch}`.text();
            return output.trim().length > 0;
        } catch {
            return false;
        }
    }

    /**
     * Push branch to remote
     * @param branch Branch name
     */
    static async pushBranch(branch: string): Promise<void> {
        await $`git push -u origin ${branch}`.quiet();
    }

    /**
     * Get git diff for a specific file (staged)
     * @param file File path
     * @returns Git diff content
     */
    static async getFileDiffStaged(file: string): Promise<string> {
        return await $`git diff --cached -- "${file}"`.text();
    }

    /**
     * Get git diff for a specific file (unstaged)
     * @param file File path
     * @returns Git diff content
     */
    static async getFileDiffUnstaged(file: string): Promise<string> {
        return await $`git diff -- "${file}"`.text();
    }

    /**
     * Get git diff for a specific file (staged or unstaged)
     * @param file File path
     * @returns Git diff content
     */
    static async getFileDiff(file: string): Promise<string> {
        // Try staged first
        let diff = await this.getFileDiffStaged(file);
        
        // If no staged diff, try unstaged
        if (!diff) {
            diff = await this.getFileDiffUnstaged(file);
        }
        
        return diff;
    }

    /**
     * Commit with edit mode using a message file
     * @param messageFile Path to the message file
     */
    static async commitWithMessageFile(messageFile: string): Promise<void> {
        await $`git commit -e -F ${messageFile}`;
    }

    /**
     * Get git tags sorted by version
     * @returns Array of git tags
     */
    static async getGitTags(): Promise<string[]> {
        try {
            const output = await $`git tag --sort=-version:refname`.text();
            return output.trim().split('\n').filter(Boolean);
        } catch (error) {
            logger.warn(t('utils.git.failedToGetTags'), error);
            return [];
        }
    }

    /**
     * Get commits between two tags or from tag to HEAD
     * @param from Starting tag or commit
     * @param to Ending tag or commit (default: HEAD)
     * @returns Array of commit messages
     */
    static async getCommitsBetween(from: string, to: string = 'HEAD'): Promise<string[]> {
        try {
            const range = from ? `${from}..${to}` : to;
            const output = await $`git log ${range} --pretty=format:%s`.text();
            return output.trim().split('\n').filter(Boolean);
        } catch (error) {
            logger.warn(`Failed to get commits between ${from} and ${to}:`, error);
            return [];
        }
    }
}