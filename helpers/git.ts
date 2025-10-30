// helpers/git.ts
import { GitExecutor, RepoInfo } from '@/utils/git';
import { logger } from '@/utils/logger';
import { t } from '@/i18n';

/**
 * Git 命令辅助类
 * 为命令层提供带业务错误处理的 Git 操作
 * 这是 GitExecutor 的业务层包装，处理错误和业务逻辑
 */
export class GitCommandHelper {
    /**
     * 获取当前分支（带错误处理）
     * @returns 当前分支名
     */
    static async getCurrentBranch(): Promise<string> {
        try {
            return await GitExecutor.getCurrentBranch();
        } catch (error) {
            logger.error(t('errors.gitError'), error);
            process.exit(1);
        }
    }

    /**
     * 获取所有本地分支（带错误处理）
     * @returns 分支名数组
     */
    static async getAllBranches(): Promise<string[]> {
        try {
            return await GitExecutor.getAllBranches();
        } catch (error) {
            logger.error(t('errors.gitError'), error);
            process.exit(1);
        }
    }

    /**
     * 获取远程仓库 URL（带错误处理）
     * @returns 远程 URL
     */
    static async getRemoteUrl(): Promise<string> {
        try {
            return await GitExecutor.getRemoteUrl();
        } catch (error) {
            logger.error(t('errors.gitError'), error);
            process.exit(1);
        }
    }

    /**
     * 获取仓库信息（静默失败，返回 null）
     * @returns 仓库信息或 null
     */
    static async getRepoInfo(): Promise<RepoInfo | null> {
        return await GitExecutor.getRepoInfo();
    }

    /**
     * 创建分支（带详细的错误处理）
     * @param branchName 分支名
     * @param checkout 是否切换到新分支
     */
    static async createBranch(branchName: string, checkout: boolean = true): Promise<void> {
        try {
            await GitExecutor.createBranch(branchName, checkout);
            if (checkout) {
                logger.success(t('branch.created', { name: branchName }));
            } else {
                logger.success(t('branch.createdNoCheckout', { name: branchName }));
            }
        } catch (error: any) {
            // 提取实际的 git 错误信息
            const errorMessage = error?.message || String(error);

            // 解析 git 错误消息以提供更好的用户反馈
            if (errorMessage.includes('already exists') || errorMessage.includes('cannot lock ref')) {
                logger.error(`Branch "${branchName}" already exists`);
                logger.info('Switch to existing branch: git checkout ' + branchName);
            } else if (errorMessage.includes('not a valid branch name')) {
                logger.error(`"${branchName}" is not a valid branch name`);
                logger.info('Branch names cannot contain spaces or special characters like :, ~, ^, ?, *, [');
            } else {
                // 显示实际的 git 错误消息
                logger.error('Failed to create branch');
                // 提取 git 错误，不包含命令包装
                const gitError = errorMessage.split('\n').find((line: string) => 
                    line.trim().startsWith('fatal:') || line.trim().startsWith('error:')
                );
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
     * 删除分支（带错误处理）
     * @param branchName 分支名
     * @param force 是否强制删除
     */
    static async deleteBranch(branchName: string, force: boolean = false): Promise<void> {
        try {
            await GitExecutor.deleteBranch(branchName, force);
            logger.success(t('branch.deleted', { name: branchName }));
        } catch (error) {
            logger.error(t('branch.deleteFailed'), error);
            if (!force) {
                logger.info(t('branch.useForceDelete'));
            }
            process.exit(1);
        }
    }

    /**
     * 获取与基础分支的差异（带错误处理和业务验证）
     * @param baseBranch 基础分支名
     * @returns Git diff 内容
     */
    static async getDiffWithBase(baseBranch: string): Promise<string> {
        try {
            const diff = await GitExecutor.getDiffWithBase(baseBranch);

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
     * 获取提交历史（静默失败，返回空数组）
     * @param baseBranch 基础分支名
     * @returns 提交消息数组
     */
    static async getCommitHistory(baseBranch: string): Promise<string[]> {
        try {
            return await GitExecutor.getCommitHistory(baseBranch);
        } catch {
            return [];
        }
    }

    /**
     * 获取变更文件列表（静默失败，返回空数组）
     * @param baseBranch 基础分支名
     * @returns 变更文件路径数组
     */
    static async getChangedFiles(baseBranch: string): Promise<string[]> {
        try {
            return await GitExecutor.getChangedFilesSinceBase(baseBranch);
        } catch {
            return [];
        }
    }

    /**
     * 检查分支是否在远程存在
     * @param branch 分支名
     * @returns 是否存在于远程
     */
    static async isBranchOnRemote(branch: string): Promise<boolean> {
        return await GitExecutor.isBranchOnRemote(branch);
    }

    /**
     * 推送分支到远程（带错误处理）
     * @param branch 分支名
     */
    static async pushBranch(branch: string): Promise<void> {
        try {
            await GitExecutor.pushBranch(branch);
        } catch (error) {
            throw new Error(`Failed to push branch: ${error}`);
        }
    }

    /**
     * 暂存所有更改（带错误处理）
     */
    static async stageAll(): Promise<void> {
        try {
            await GitExecutor.stageAll();
        } catch (error) {
            logger.error(t('errors.gitError'), error);
            process.exit(1);
        }
    }

    /**
     * 获取已暂存的差异
     * @returns Git diff 内容
     */
    static async getStagedDiff(): Promise<string> {
        try {
            return await GitExecutor.getStagedDiff();
        } catch (error) {
            logger.error(t('errors.gitError'), error);
            process.exit(1);
        }
    }

    /**
     * 获取已暂存的文件列表
     * @returns 文件路径数组
     */
    static async getStagedFiles(): Promise<string[]> {
        try {
            return await GitExecutor.getStagedFiles();
        } catch (error) {
            logger.error(t('errors.gitError'), error);
            process.exit(1);
        }
    }

    /**
     * 获取未暂存的文件列表
     * @returns 文件路径数组
     */
    static async getUnstagedFiles(): Promise<string[]> {
        try {
            return await GitExecutor.getUnstagedFiles();
        } catch (error) {
            logger.error(t('errors.gitError'), error);
            process.exit(1);
        }
    }

    /**
     * 获取特定文件的差异（已暂存）
     * @param file 文件路径
     * @returns Git diff 内容
     */
    static async getFileDiffStaged(file: string): Promise<string> {
        try {
            return await GitExecutor.getFileDiffStaged(file);
        } catch (error) {
            logger.error(t('errors.gitError'), error);
            process.exit(1);
        }
    }

    /**
     * 获取特定文件的差异（未暂存）
     * @param file 文件路径
     * @returns Git diff 内容
     */
    static async getFileDiffUnstaged(file: string): Promise<string> {
        try {
            return await GitExecutor.getFileDiffUnstaged(file);
        } catch (error) {
            logger.error(t('errors.gitError'), error);
            process.exit(1);
        }
    }

    /**
     * 获取特定文件的差异（已暂存或未暂存）
     * @param file 文件路径
     * @returns Git diff 内容
     */
    static async getFileDiff(file: string): Promise<string> {
        try {
            return await GitExecutor.getFileDiff(file);
        } catch (error) {
            logger.error(t('errors.gitError'), error);
            process.exit(1);
        }
    }

    /**
     * 使用消息文件提交（带编辑模式）
     * @param messageFile 消息文件路径
     */
    static async commitWithMessageFile(messageFile: string): Promise<void> {
        try {
            await GitExecutor.commitWithMessageFile(messageFile);
        } catch (error) {
            logger.error(t('errors.gitError'), error);
            process.exit(1);
        }
    }

    /**
     * 获取 Git 标签列表（按版本排序）
     * @returns 标签数组
     */
    static async getGitTags(): Promise<string[]> {
        return await GitExecutor.getGitTags();
    }

    /**
     * 获取两个标签或提交之间的提交记录
     * @param from 起始标签或提交
     * @param to 结束标签或提交（默认：HEAD）
     * @returns 提交消息数组
     */
    static async getCommitsBetween(from: string, to: string = 'HEAD'): Promise<string[]> {
        return await GitExecutor.getCommitsBetween(from, to);
    }
}