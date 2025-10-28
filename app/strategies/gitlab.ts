//cli/strategies/gitlab.ts
import { BasePlatformStrategy, PullRequestResult } from "./platform.ts";
import { PlatformConfig } from "../../types/config.ts";

/**
 * GitLab platform strategy implementation class for interacting with GitLab, including creating merge requests, checking branch status, and other operations.
 */
export class GitLabStrategy extends BasePlatformStrategy {
    /**
     * Constructor initializes GitLab strategy instance
     * @param config Platform configuration information, must be GitLab type configuration
     * @throws Error when the passed platform type is not 'gitlab'
     */
    constructor(private readonly config: PlatformConfig) {
        super()
        if (config.type !== 'gitlab') {
            throw new Error('Invalid platform type for GitLabStrategy');
        }
    }

    /**
     * Create a merge request (Merge Request)
     *
     * @param owner Project owner name
     * @param repo Repository name
     * @param title Merge request title
     * @param body Merge request description content
     * @param head Source branch name
     * @param base Target branch name
     * @returns Returns result object containing merge request URL and internal ID
     * @throws Error when API call fails or response is abnormal
     */
    async createPullRequest(
        owner: string,
        repo: string,
        title: string,
        body: string,
        head: string,
        base: string
    ): Promise<PullRequestResult> {
        // Build GitLab API address
        const gitlabUrl = this.config.url || 'https://gitlab.com';
        const projectPath = encodeURIComponent(`${owner}/${repo}`);
        const apiUrl = `${gitlabUrl}/api/v4/projects/${projectPath}/merge_requests`;

        // Send POST request to create merge request
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

        // Handle possible API error responses
        if (!response.ok) {
            const error = await response.json();
            let errorMessage = `GitLab API error: ${error.message || response.statusText}`;
            if (error.error) {
                errorMessage += '\nDetails: ' + error.error;
            }
            throw new Error(errorMessage);
        }

        // Parse successful response data and return result
        const mr = await response.json();
        return {
            url: mr.web_url,
            id: mr.iid,
        };
    }
}
