//cli/strategies/gitlab.ts
import {BasePlatformStrategy, PullRequestResult} from "./platform.ts";
import {PlatformConfig} from "../types/config.ts";

/**
 * GitLab平台策略实现类，用于与GitLab进行交互，包括创建合并请求、检查分支状态等操作。
 */
export class GitLabStrategy extends BasePlatformStrategy {
    /**
     * 构造函数初始化GitLab策略实例
     * @param config 平台配置信息，必须是GitLab类型的配置
     * @throws 当传入的平台类型不是'gitlab.ts'时抛出错误
     */
    constructor(private config: PlatformConfig) {
        super()
        if (config.type !== 'gitlab') {
            throw new Error('Invalid platform type for GitLabStrategy');
        }
    }

    /**
     * 创建一个合并请求（Merge Request）
     *
     * @param owner 项目所有者名称
     * @param repo 仓库名称
     * @param title 合并请求标题
     * @param body 合并请求描述内容
     * @param head 源分支名
     * @param base 目标分支名
     * @returns 返回包含合并请求URL和内部ID的结果对象
     * @throws 当API调用失败或响应异常时抛出错误
     */
    async createPullRequest(
        owner: string,
        repo: string,
        title: string,
        body: string,
        head: string,
        base: string
    ): Promise<PullRequestResult> {
        // 构建GitLab API地址
        const gitlabUrl = this.config.url || 'https://gitlab.com';
        const projectPath = encodeURIComponent(`${owner}/${repo}`);
        const apiUrl = `${gitlabUrl}/api/v4/projects/${projectPath}/merge_requests`;

        // 发起创建合并请求的POST请求
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'PRIVATE-TOKEN': this.config.token,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                source_branch: head,
                target_branch: base,
                title,
                description: body,
            }),
        });

        // 处理可能的API错误响应
        if (!response.ok) {
            const error = await response.json();
            let errorMessage = `GitLab API error: ${error.message || response.statusText}`;
            if (error.error) {
                errorMessage += '\nDetails: ' + error.error;
            }
            throw new Error(errorMessage);
        }

        // 解析成功响应数据并返回结果
        const mr = await response.json();
        return {
            url: mr.web_url,
            id: mr.iid,
        };
    }
}
