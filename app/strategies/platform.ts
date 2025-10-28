//cli/strategies/platform.ts
/**
 * PR/MR creation result interface
 */
export interface PullRequestResult {
  url: string;
  number?: number;
  id?: number;
}

/**
 * Platform strategy interface
 */
export interface PlatformStrategy {
  /**
   * Create PR/MR
   */
  createPullRequest(
    owner: string,
    repo: string,
    title: string,
    body: string,
    head: string,
    base: string
  ): Promise<PullRequestResult>;

  /**
   * Check if branch exists on remote
   */
  isBranchOnRemote(branch: string): Promise<boolean>;

  /**
   * Push branch to remote
   */
  pushBranchToRemote(branch: string): Promise<void>;
}

/**
 * BasePlatformStrategy class is an abstract class that implements the basic functionality of the PlatformStrategy interface
 * Provides common methods for interacting with Git remote repositories, and abstract methods that need to be implemented by subclasses
 */
export abstract class BasePlatformStrategy implements PlatformStrategy {

    /**
     * Check if specified branch exists in remote repository
     * @param branch Branch name to check
     * @returns Promise<boolean> Returns true if branch exists in remote repository, otherwise returns false
     */
    async isBranchOnRemote(branch: string): Promise<boolean> {
        try {
            const { $ } = await import('bun');
            // Execute git ls-remote command to check if remote branch exists
            await $`git ls-remote --heads origin ${branch}`.text();
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Push specified branch to remote repository
     * @param branch Branch name to push
     * @returns Promise<void>
     * @throws Error when push fails
     */
    async pushBranchToRemote(branch: string): Promise<void> {
        const { $ } = await import('bun');
        try {
            // Execute git push command to push branch to remote repository
            await $`git push -u origin ${branch}`.quiet();
        } catch (error) {
            throw new Error(`Failed to push branch: ${error}`);
        }
    }

    /**
     * Abstract method for creating Pull Request, needs subclasses to implement specific platform-related logic
     * @param owner Repository owner
     * @param repo Repository name
     * @param title Pull Request title
     * @param body Pull Request content description
     * @param head Source branch name
     * @param base Target branch name
     * @returns Promise<PullRequestResult> Created Pull Request result
     */
    // Abstract method that needs to be implemented by subclasses
    abstract createPullRequest(
        owner: string,
        repo: string,
        title: string,
        body: string,
        head: string,
        base: string
    ): Promise<PullRequestResult>;
}

