/**
 * PR/MR创建结果接口
 */
export interface PullRequestResult {
  url: string;
  number?: number;
  id?: number;
}

/**
 * 平台策略接口
 */
export interface PlatformStrategy {
  /**
   * 创建PR/MR
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
   * 检查分支是否在远程存在
   */
  isBranchOnRemote(branch: string): Promise<boolean>;

  /**
   * 推送分支到远程
   */
  pushBranchToRemote(branch: string): Promise<void>;
}

/**
 * BasePlatformStrategy 类是一个抽象类，实现了 PlatformStrategy 接口的基础功能
 * 提供了与 Git 远程仓库交互的通用方法，以及需要子类实现的抽象方法
 */
export abstract class BasePlatformStrategy implements PlatformStrategy {

    /**
     * 检查指定分支是否存在于远程仓库
     * @param branch 要检查的分支名称
     * @returns Promise<boolean> 如果分支存在于远程仓库则返回 true，否则返回 false
     */
    async isBranchOnRemote(branch: string): Promise<boolean> {
        try {
            const { $ } = await import('bun');
            // 执行 git ls-remote 命令检查远程分支是否存在
            await $`git ls-remote --heads origin ${branch}`.text();
            return true;
        } catch {
            return false;
        }
    }

    /**
     * 将指定分支推送到远程仓库
     * @param branch 要推送的分支名称
     * @returns Promise<void>
     * @throws Error 当推送失败时抛出错误
     */
    async pushBranchToRemote(branch: string): Promise<void> {
        const { $ } = await import('bun');
        try {
            // 执行 git push 命令将分支推送到远程仓库
            await $`git push -u origin ${branch}`.quiet();
        } catch (error) {
            throw new Error(`Failed to push branch: ${error}`);
        }
    }

    /**
     * 创建 Pull Request 的抽象方法，需要子类实现具体的平台相关逻辑
     * @param owner 仓库所有者
     * @param repo 仓库名称
     * @param title Pull Request 标题
     * @param body Pull Request 内容描述
     * @param head 源分支名称
     * @param base 目标分支名称
     * @returns Promise<PullRequestResult> 创建的 Pull Request 结果
     */
    // 需要子类实现的抽象方法
    abstract createPullRequest(
        owner: string,
        repo: string,
        title: string,
        body: string,
        head: string,
        base: string
    ): Promise<PullRequestResult>;
}

