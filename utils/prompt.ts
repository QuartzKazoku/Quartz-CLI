//utils/prompt.ts
import {t} from '@/i18n';
import {getConfigManager} from '@/manager/config';
import {logger} from '@/utils/logger';

/**
 * Get prompt language from configuration
 * Throws error if configuration is missing or invalid
 * @returns Language code for prompts
 * @throws Error if prompt language is not configured
 */
function getPromptLanguage(): string {
  try {
    const configManager = getConfigManager();
    const config = configManager.readConfig();
    
    if (!config.language?.prompt) {
      logger.error(t('errors.noPromptLanguage'));
      logger.error('Please run: quartz config --set language.prompt <language-code>');
      process.exit(1);
    }
    
    return config.language.prompt;
  } catch (error) {
    logger.error('Failed to read configuration:', error);
    process.exit(1);
  }
}

/**
 * Get language name from language code
 * @param lang - Language code (e.g., 'en', 'zh-CN')
 * @returns Human-readable language name
 */
function getLanguageName(lang: string): string {
  const names: Record<string, string> = {
    'zh-CN': 'Simplified Chinese',
    'zh-TW': 'Traditional Chinese',
    'ja': 'Japanese',
    'ko': 'Korean',
    'en': 'English',
  };
  return names[lang] || 'English';
}

/**
 * Generate code review prompt for AI
 * @param file - File path being reviewed
 * @param diff - Git diff content
 * @param content - Full file content
 * @returns Formatted prompt string for code review
 */
export function getReviewPrompt(file: string, diff: string, content: string): string {
  const lang = getPromptLanguage();
  const langName = getLanguageName(lang);

  return `You are a professional code review expert. Please review the following code changes and respond in ${langName}.

Focus on:
1. **Code Quality**: Best practices and coding standards
2. **Potential Bugs**: Logic errors, edge cases, null handling
3. **Performance Issues**: Performance bottlenecks, unnecessary computations, memory leaks
4. **Security**: XSS, SQL injection, sensitive data exposure
5. **Maintainability**: Code complexity, readability, comment quality

File: ${file}

Code Changes (diff):
\`\`\`diff
${diff}
\`\`\`

Full File Content:
\`\`\`
${content.slice(0, 5000)}${content.length > 5000 ? '... (content truncated)' : ''}
\`\`\`

Please return the review result in JSON format (respond in ${langName}):
{
  "comments": [
    {
      "line": line_number(number),
      "severity": "error" | "warning" | "info",
      "message": "Issue description in ${langName}",
      "suggestion": "Improvement suggestion in ${langName} (optional, use markdown format, can include code blocks)"
    }
  ]
}

Note:
- Return only JSON, no additional text
- line must be a specific line number
- severity: error(critical issues must fix), warning(recommended to fix), info(optional optimization)
- suggestion can include code examples using markdown code block format
- If code quality is good, comments can be an empty array
- All messages must be in ${langName}`;
}

/**
 * Generate commit message prompt for AI
 * @param diff - Git diff content
 * @param files - Array of changed file paths
 * @returns Formatted prompt string for commit message generation
 */
export function getCommitPrompt(diff: string, files: string[]): string {
  const lang = getPromptLanguage();
  const langName = getLanguageName(lang);

  return `You are a professional Git commit message generator working with Quartz engine. Please generate a commit message following the Conventional Commits specification in ${langName}.

Conventional Commits Format:
<type>(<scope>): <subject>

<body>

<footer>

Allowed type values:
- feat: New feature
- fix: Bug fix
- docs: Documentation update
- style: Code formatting (does not affect code execution)
- refactor: Refactoring
- perf: Performance optimization
- test: Testing related
- chore: Build process or auxiliary tool changes
- revert: Revert
- build: Build system or external dependency changes
- ci: CI configuration file and script changes

Changed files:
${files.map(f => `- ${f}`).join('\n')}

Code Changes (diff):
\`\`\`diff
${diff.slice(0, 8000)}${diff.length > 8000 ? '\n... (diff truncated)' : ''}
\`\`\`

Requirements:
1. subject must be a concise one-sentence description (within 50 characters)
2. Use ${langName}
3. subject should not end with a period
4. body is optional, provide more detailed change description
5. If there are breaking changes, explain in footer
6. Choose the most appropriate type based on actual changes
7. scope is optional, indicating the scope of impact

Please directly return the commit message in ${langName}, do not add other explanatory text.`;
}

/**
 * Generate pull request description prompt for AI
 * @param diff - Git diff content
 * @param commits - Array of commit messages
 * @param files - Array of changed file paths
 * @param currentBranch - Current branch name
 * @param baseBranch - Base branch name
 * @returns Formatted prompt string for PR description generation
 */
export function getPRPrompt(
  diff: string,
  commits: string[],
  files: string[],
  currentBranch: string,
  baseBranch: string
): string {
  const lang = getPromptLanguage();
  const langName = getLanguageName(lang);

  return `You are a professional Pull Request description generator working with Quartz engine. Please generate a clear and professional PR description in ${langName} based on the following information.

Current branch: ${currentBranch}
Target branch: ${baseBranch}

Commit history (${commits.length} commits):
${commits.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Changed files (${files.length} files):
${files.slice(0, 20).map(f => `- ${f}`).join('\n')}${files.length > 20 ? `\n... and ${files.length - 20} more files` : ''}

Code changes (diff):
\`\`\`diff
${diff.slice(0, 10000)}${diff.length > 10000 ? '\n... (diff truncated)' : ''}
\`\`\`

Please generate a PR description including the following sections (in ${langName}):

1. **Title**: One sentence summarizing the main purpose of this PR (within 50 characters)
2. **Overview**: Brief description of the purpose and background of this PR
3. **Changes**: List the main changes
4. **Testing**: Describe how to test these changes
5. **Notes**: If there are things that need special attention

Please return in JSON format (all content in ${langName}):
{
  "title": "PR title in ${langName}",
  "body": "PR description body in ${langName} (use Markdown format)"
}

Requirements:
- Use ${langName}
- Title should be concise and clear
- Body should be well-structured, using Markdown format
- If there are breaking changes, mark them specially
- Return only JSON, do not add other text`;
}

/**
 * Generate code review summary prompt for AI
 * @param errorCount - Number of errors found
 * @param warningCount - Number of warnings found
 * @param infoCount - Number of info suggestions found
 * @param score - Overall code quality score
 * @returns Formatted prompt string for summary generation
 */
export function getSummaryPrompt(errorCount: number, warningCount: number, infoCount: number, score: number): string {
  const lang = getPromptLanguage();
  const langName = getLanguageName(lang);

  return `Based on the following code review results, generate a concise summary in ${langName} (within 50 characters):

- Found ${errorCount} errors
- Found ${warningCount} warnings
- Found ${infoCount} suggestions
- Score: ${score}/100

Please summarize the code quality and main issues in one sentence (in ${langName}).`;
}