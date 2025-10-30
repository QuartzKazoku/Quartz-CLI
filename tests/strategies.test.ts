//tests/strategies.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GitHubStrategy } from '@/app/strategies/github';
import { GitLabStrategy } from '@/app/strategies/gitlab';
import { PlatformConfig } from '@/types/config';

// Mock shell module
vi.mock('@/utils/shell', () => ({
  $: vi.fn((strings: TemplateStringsArray) => {
    const command = strings.join('');
    return {
      text: async () => {
        if (command.includes('ls-remote')) {
          return 'refs/heads/feature-branch';
        }
        return '';
      },
      quiet: async () => {}
    };
  })
}));

describe('Platform Strategies', () => {
  describe('GitHubStrategy', () => {
    let githubConfig: PlatformConfig;

    beforeEach(() => {
      githubConfig = {
        type: 'github',
        token: 'ghp_test_token_123'
      };
      vi.clearAllMocks();
    });

    it('should create GitHub strategy with valid config', () => {
      const strategy = new GitHubStrategy(githubConfig);
      expect(strategy).toBeInstanceOf(GitHubStrategy);
      expect(strategy).toBeDefined();
    });

    it('should throw error with invalid platform type', () => {
      const invalidConfig = { type: 'gitlab', token: 'test' } as PlatformConfig;
      expect(() => new GitHubStrategy(invalidConfig)).toThrow('Invalid platform type for GitHubStrategy');
    });

    it('should initialize with default GitHub URL', () => {
      const strategy = new GitHubStrategy(githubConfig);
      expect(strategy).toBeInstanceOf(GitHubStrategy);
    });

    it('should create pull request successfully', async () => {
      const strategy = new GitHubStrategy(githubConfig);
      
      global.fetch = vi.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          html_url: 'https://github.com/owner/repo/pull/1',
          number: 1
        })
      } as Response));

      const result = await strategy.createPullRequest(
        'owner',
        'repo',
        'Test PR',
        'Test body',
        'feature',
        'main'
      );

      expect(result.url).toBe('https://github.com/owner/repo/pull/1');
      expect(result.number).toBe(1);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/owner/repo/pulls',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'token ghp_test_token_123'
          })
        })
      );
    });

    it('should use custom URL when provided', async () => {
      const configWithUrl: PlatformConfig = {
        type: 'github',
        token: 'ghp_test_token_123',
        url: 'https://github.enterprise.com'
      };
      const strategy = new GitHubStrategy(configWithUrl);
      
      global.fetch = vi.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          html_url: 'https://github.enterprise.com/owner/repo/pull/1',
          number: 1
        })
      } as Response));

      await strategy.createPullRequest('owner', 'repo', 'Test', 'Body', 'head', 'base');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://github.enterprise.com/api/v3/repos/owner/repo/pulls',
        expect.any(Object)
      );
    });

    it('should handle API error with message', async () => {
      const strategy = new GitHubStrategy(githubConfig);
      
      global.fetch = vi.fn(() => Promise.resolve({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () => Promise.resolve({
          message: 'Validation failed'
        })
      } as Response));

      await expect(
        strategy.createPullRequest('owner', 'repo', 'Test', 'Body', 'head', 'base')
      ).rejects.toThrow('GitHub API error (400): Validation failed');
    });

    it('should handle API error with details', async () => {
      const strategy = new GitHubStrategy(githubConfig);
      
      global.fetch = vi.fn(() => Promise.resolve({
        ok: false,
        status: 422,
        statusText: 'Unprocessable Entity',
        json: () => Promise.resolve({
          message: 'Validation failed',
          errors: [{ message: 'Pull request already exists' }]
        })
      } as Response));

      await expect(
        strategy.createPullRequest('owner', 'repo', 'Test', 'Body', 'head', 'base')
      ).rejects.toThrow(/GitHub API error \(422\): Validation failed/);
    });

    it('should check if branch exists on remote', async () => {
      const strategy = new GitHubStrategy(githubConfig);
      const result = await strategy.isBranchOnRemote('feature-branch');
      expect(result).toBe(true);
    });

    it('should return false when branch does not exist', async () => {
      const strategy = new GitHubStrategy(githubConfig);
      const shellModule = await import('@/utils/shell');
      
      vi.spyOn(shellModule, '$').mockImplementationOnce((() => ({
        text: async () => {
          throw new Error('Branch not found');
        }
      })) as any);

      const result = await strategy.isBranchOnRemote('non-existent-branch');
      expect(result).toBe(false);
    });

    it('should push branch to remote', async () => {
      const strategy = new GitHubStrategy(githubConfig);
      await expect(strategy.pushBranchToRemote('feature-branch')).resolves.toBeUndefined();
    });

    it('should handle push failure', async () => {
      const strategy = new GitHubStrategy(githubConfig);
      const shellModule = await import('@/utils/shell');
      
      vi.spyOn(shellModule, '$').mockImplementationOnce((() => ({
        quiet: async () => {
          throw new Error('Push failed');
        }
      })) as any);

      await expect(
        strategy.pushBranchToRemote('feature-branch')
      ).rejects.toThrow('Failed to push branch');
    });
  });

  describe('GitLabStrategy', () => {
    let gitlabConfig: PlatformConfig;

    beforeEach(() => {
      gitlabConfig = {
        type: 'gitlab',
        token: 'glpat_test_token_123'
      };
      vi.clearAllMocks();
    });

    it('should create GitLab strategy with valid config', () => {
      const strategy = new GitLabStrategy(gitlabConfig);
      expect(strategy).toBeInstanceOf(GitLabStrategy);
    });

    it('should throw error with invalid platform type', () => {
      const invalidConfig = { type: 'github', token: 'test' } as PlatformConfig;
      expect(() => new GitLabStrategy(invalidConfig)).toThrow('Invalid platform type for GitLabStrategy');
    });

    it('should create merge request successfully', async () => {
      const strategy = new GitLabStrategy(gitlabConfig);
      
      global.fetch = vi.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          web_url: 'https://gitlab.com/owner/repo/-/merge_requests/1',
          iid: 1
        })
      } as Response));

      const result = await strategy.createPullRequest(
        'owner',
        'repo',
        'Test MR',
        'Test body',
        'feature',
        'main'
      );

      expect(result.url).toBe('https://gitlab.com/owner/repo/-/merge_requests/1');
      expect(result.id).toBe(1);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://gitlab.com/api/v4/projects/owner%2Frepo/merge_requests',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'PRIVATE-TOKEN': 'glpat_test_token_123'
          })
        })
      );
    });

    it('should use custom URL when provided', async () => {
      const configWithUrl: PlatformConfig = {
        type: 'gitlab',
        token: 'glpat_test_token_123',
        url: 'https://gitlab.enterprise.com'
      };
      const strategy = new GitLabStrategy(configWithUrl);
      
      global.fetch = vi.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          web_url: 'https://gitlab.enterprise.com/owner/repo/-/merge_requests/1',
          iid: 1
        })
      } as Response));

      await strategy.createPullRequest('owner', 'repo', 'Test', 'Body', 'head', 'base');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://gitlab.enterprise.com/api/v4/projects/owner%2Frepo/merge_requests',
        expect.any(Object)
      );
    });

    it('should handle API error with message', async () => {
      const strategy = new GitLabStrategy(gitlabConfig);
      
      global.fetch = vi.fn(() => Promise.resolve({
        ok: false,
        statusText: 'Bad Request',
        json: () => Promise.resolve({
          message: 'Branch already exists'
        })
      } as Response));

      await expect(
        strategy.createPullRequest('owner', 'repo', 'Test', 'Body', 'head', 'base')
      ).rejects.toThrow('GitLab API error: Branch already exists');
    });

    it('should handle API error with details', async () => {
      const strategy = new GitLabStrategy(gitlabConfig);
      
      global.fetch = vi.fn(() => Promise.resolve({
        ok: false,
        statusText: 'Unprocessable Entity',
        json: () => Promise.resolve({
          message: 'Validation failed',
          error: 'Source branch does not exist'
        })
      } as Response));

      await expect(
        strategy.createPullRequest('owner', 'repo', 'Test', 'Body', 'head', 'base')
      ).rejects.toThrow(/GitLab API error: Validation failed[\s\S]*Details:/);
    });

    it('should check if branch exists on remote', async () => {
      const strategy = new GitLabStrategy(gitlabConfig);
      const result = await strategy.isBranchOnRemote('feature-branch');
      expect(result).toBe(true);
    });

    it('should push branch to remote', async () => {
      const strategy = new GitLabStrategy(gitlabConfig);
      await expect(strategy.pushBranchToRemote('feature-branch')).resolves.toBeUndefined();
    });
  });

  describe('PlatformStrategyFactory', () => {
    let PlatformStrategyFactory: any;

    beforeEach(async () => {
      vi.clearAllMocks();
      // Dynamically import to get fresh module
      const factoryModule = await import('@/app/strategies/factory');
      PlatformStrategyFactory = factoryModule.PlatformStrategyFactory;
    });

    it('should create GitHub strategy', () => {
      const config: PlatformConfig = {
        type: 'github',
        token: 'test_token'
      };
      const strategy = PlatformStrategyFactory.create(config);
      expect(strategy).toBeDefined();
      expect(strategy).toBeInstanceOf(GitHubStrategy);
    });

    it('should create GitLab strategy', () => {
      const config: PlatformConfig = {
        type: 'gitlab',
        token: 'test_token'
      };
      const strategy = PlatformStrategyFactory.create(config);
      expect(strategy).toBeDefined();
      expect(strategy).toBeInstanceOf(GitLabStrategy);
    });

    it('should throw error for unsupported platform', () => {
      const config = {
        type: 'bitbucket',
        token: 'test_token'
      } as any;
      expect(() => {
        PlatformStrategyFactory.create(config);
      }).toThrow('Unsupported platform type: bitbucket');
    });

    it('should detect GitHub from URL', () => {
      expect(PlatformStrategyFactory.detectPlatformFromUrl).toBeDefined();
      const result1 = PlatformStrategyFactory.detectPlatformFromUrl('git@github.com:owner/repo.git');
      expect(result1).toBe('github');
      
      const result2 = PlatformStrategyFactory.detectPlatformFromUrl('https://github.com/owner/repo.git');
      expect(result2).toBe('github');
    });

    it('should detect GitLab from URL', () => {
      expect(PlatformStrategyFactory.detectPlatformFromUrl).toBeDefined();
      const result1 = PlatformStrategyFactory.detectPlatformFromUrl('git@gitlab.com:owner/repo.git');
      expect(result1).toBe('gitlab');
      
      const result2 = PlatformStrategyFactory.detectPlatformFromUrl('https://gitlab.com/owner/repo.git');
      expect(result2).toBe('gitlab');
    });

    it('should return null for unknown platform', () => {
      expect(PlatformStrategyFactory.detectPlatformFromUrl).toBeDefined();
      const result1 = PlatformStrategyFactory.detectPlatformFromUrl('git@bitbucket.org:owner/repo.git');
      expect(result1).toBeNull();
      
      const result2 = PlatformStrategyFactory.detectPlatformFromUrl('https://custom-git.com/owner/repo.git');
      expect(result2).toBeNull();
    });
  });
});