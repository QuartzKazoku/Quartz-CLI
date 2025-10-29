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
            const error = await response.json() as { message?: string; errors?: unknown; documentation_url?: string };
            let errorMessage = `GitHub API error (${response.status}): ${error.message || response.statusText}`;
            
            // Add token validation hint for authentication errors
            if (response.status === 401) {
                errorMessage += '\n\n💡 Token validation failed. Please check:';
                errorMessage += '\n   1. Token is valid and not expired';
                errorMessage += '\n   2. Token has "repo" scope for creating PRs';
                errorMessage += '\n   3. Token format is correct (should start with "ghp_" or "github_pat_")';
            } else if (response.status === 403) {
                errorMessage += '\n\n💡 Permission denied. Please ensure:';
                errorMessage += '\n   1. Token has sufficient permissions (requires "repo" scope)';
                errorMessage += '\n   2. You have write access to the repository';
            } else if (response.status === 422) {
                errorMessage += '\n\n💡 Validation failed. Common issues:';
                errorMessage += '\n   1. PR already exists for this branch';
                errorMessage += '\n   2. No commits between base and head branches';
                errorMessage += '\n   3. Head branch does not exist on remote';
            }
            
            if (error.errors) {
                errorMessage += '\n\nAPI Details: ' + JSON.stringify(error.errors, null, JSON_FORMAT.INDENT);
            }
            
            if (error.documentation_url) {
                errorMessage += `\n\nDocumentation: ${error.documentation_url}`;
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
