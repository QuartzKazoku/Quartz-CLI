//cli/strategies/github.ts
import {BasePlatformStrategy, PullRequestResult} from "./platform";
import {PLATFORM_TYPES, JSON_FORMAT} from "../constants";
import {PlatformConfig} from "../../types/config";

/**
 * GitHub平台策略实现类，用于与GitHub API交互以创建Pull Request、检查分支状态及推送分支。
 */
export class GitHubStrategy extends BasePlatformStrategy {
    /**
     * 构造函数初始化GitHub策略实例。
     * @param config 平台配置对象，必须是类型为'github'的配置。
     * @throws 当传入的配置类型不是'github'时抛出错误。
     */
    constructor(private readonly config: PlatformConfig) {
        super();
        if (config.type !== PLATFORM_TYPES.GITHUB) {
            throw new Error('Invalid platform type for GitHubStrategy');
        }
    }

    /**
     * 创建一个新的Pull Request。
     * @param owner 仓库所有者的名称。
     * @param repo 仓库名称。
     * @param title Pull Request的标题。
     * @param body Pull Request的内容描述。
     * @param head 源分支（通常是特性分支）。
     * @param base 目标分支（通常是主分支或开发分支）。
     * @returns 返回一个Promise，解析为包含PR链接和编号的对象。
     * @throws 当API请求失败时抛出详细错误信息。
     */
    async createPullRequest(
        owner: string,
        repo: string,
        title: string,
        body: string,
        head: string,
        base: string
    ): Promise<PullRequestResult> {
        // 根据是否自定义URL决定使用GitHub公共API还是私有部署API地址
        const apiUrl = this.config.url
            ? `${this.config.url}/api/v3/repos/${owner}/${repo}/pulls`
            : `https://api.github.com/repos/${owner}/${repo}/pulls`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `token ${this.config.token}`,
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

        // 处理API响应异常情况并构造详细的错误消息
        if (!response.ok) {
            const error = await response.json();
            let errorMessage = `GitHub API error: ${error.message || response.statusText}`;
            if (error.errors) {
                errorMessage += '\nDetails: ' + JSON.stringify(error.errors, null, JSON_FORMAT.INDENT);
            }
            throw new Error(errorMessage);
        }

        const pr = await response.json();
        return {
            url: pr.html_url,
            number: pr.number,
        };
    }
}
