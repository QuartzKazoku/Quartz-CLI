//cli/strategies/github.ts
import { BasePlatformStrategy, PullRequestResult } from "@/app/strategies/platform";
import { PlatformConfig } from "@/types/config";
import { PLATFORM_TYPES, JSON_FORMAT } from "@/constants";

/**
 * GitHub platform strategy implementation class for interacting with GitHub API to create Pull Requests, check branch status, and push branches.
 */
export class GitHubStrategy extends BasePlatformStrategy {
    /**
     * Constructor initializes GitHub strategy instance.
     * @param config Platform configuration object, must be of type 'github'.
     * @throws Error when the passed configuration type is not 'github'.
     */
    constructor(private readonly config: PlatformConfig) {
        super();
        if (config.type !== PLATFORM_TYPES.GITHUB) {
            throw new Error('Invalid platform type for GitHubStrategy');
        }
    }

    /**
     * Create a new Pull Request.
     * @param owner Name of the repository owner.
     * @param repo Repository name.
     * @param title Title of the Pull Request.
     * @param body Content description of the Pull Request.
     * @param head Source branch (usually feature branch).
     * @param base Target branch (usually main or development branch).
     * @returns Returns a Promise that resolves to an object containing PR link and number.
     * @throws Throws detailed error information when API request fails.
     */
    async createPullRequest(
        owner: string,
        repo: string,
        title: string,
        body: string,
        head: string,
        base: string
    ): Promise<PullRequestResult> {
        // Decide whether to use GitHub public API or private deployment API address based on whether URL is customized
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

        // Handle API response exception cases and construct detailed error messages
        if (!response.ok) {
            const error = await response.json() as { message?: string; errors?: unknown };
            let errorMessage = `GitHub API error: ${error.message || response.statusText}`;
            if (error.errors) {
                errorMessage += '\nDetails: ' + JSON.stringify(error.errors, null, JSON_FORMAT.INDENT);
            }
            throw new Error(errorMessage);
        }

        const pr = await response.json() as { html_url: string; number: number };
        return {
            url: pr.html_url,
            number: pr.number,
        };
    }
}
