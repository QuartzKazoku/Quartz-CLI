//app/commands/changelog.ts
import {execa} from 'execa';
import fs from 'node:fs';
import path from 'node:path';
import {t} from '@/i18n';
import {logger} from '@/utils/logger';
import {GitCommandHelper} from '@/helpers/git';
import minimist from 'minimist';

/**
 * Get git tags sorted by version
 * @returns Array of git tags
 */
async function getGitTags(): Promise<string[]> {
    return await GitCommandHelper.getGitTags();
}

/**
 * Get commits between two tags or from tag to HEAD
 * @param from - Starting tag or commit
 * @param to - Ending tag or commit (default: HEAD)
 * @returns Array of commit messages
 */
async function getCommitsBetween(from: string, to: string = 'HEAD'): Promise<string[]> {
    return await GitCommandHelper.getCommitsBetween(from, to);
}

/**
 * Get commit details between two tags
 * @param from - Starting tag or commit
 * @param to - Ending tag or commit (default: HEAD)
 * @returns Array of commit objects with hash, message, author, and date
 */
async function getCommitDetails(from: string, to: string = 'HEAD'): Promise<Array<{
    hash: string;
    message: string;
    author: string;
    date: string;
}>> {
    try {
        const range = from ? `${from}..${to}` : to;
        const {stdout} = await execa('git', [
            'log',
            range,
            '--pretty=format:%H|||%s|||%an|||%ad',
            '--date=short'
        ]);

        return stdout.trim().split('\n').filter(Boolean).map(line => {
            const [hash, message, author, date] = line.split('|||');
            return {hash, message, author, date};
        });
    } catch (error) {
        logger.error(t('errors.gitError'), error);
        return [];
    }
}

/**
 * Parse conventional commit message
 * @param message - Commit message
 * @returns Parsed commit object
 */
function parseConventionalCommit(message: string): {
    type: string;
    scope?: string;
    subject: string;
    breaking: boolean;
} {
    // Match pattern: type(scope): subject or type: subject
    const conventionalPattern = /^(\w+)(?:\(([^)]+)\))?:\s*(.+)$/;
    const match = conventionalPattern.exec(message);


    if (match) {
        const [, type, scope, subject] = match;
        const breaking = message.includes('BREAKING CHANGE') || message.includes('!:');
        return {
            type: type.toLowerCase(),
            scope,
            subject,
            breaking,
        };
    }

    // If not conventional commit format, treat as 'chore'
    return {
        type: 'chore',
        subject: message,
        breaking: false,
    };
}

/**
 * Group commits by type
 * @param commits - Array of commit details
 * @returns Grouped commits by type
 */
function groupCommitsByType(commits: Array<{ hash: string; message: string; author: string; date: string }>) {
    const groups: Record<string, Array<{
        hash: string;
        message: string;
        author: string;
        date: string;
        parsed: ReturnType<typeof parseConventionalCommit>;
    }>> = {};

    for (const commit of commits) {
        const parsed = parseConventionalCommit(commit.message);
        const type = parsed.type;

        if (!groups[type]) {
            groups[type] = [];
        }

        groups[type].push({
            ...commit,
            parsed,
        });
    }

    return groups;
}

/**
 * Get type emoji and label from changelog config
 * @param type - Commit type
 * @returns Object with emoji and label
 */
function getTypeInfo(type: string): { emoji: string; label: string } {
    const typeMap: Record<string, { emoji: string; label: string }> = {
        feat: {emoji: '✨', label: 'Features'},
        fix: {emoji: '🐛', label: 'Bug Fixes'},
        docs: {emoji: '📚', label: 'Documentation'},
        style: {emoji: '💄', label: 'Styles'},
        refactor: {emoji: '♻️', label: 'Code Refactoring'},
        perf: {emoji: '⚡', label: 'Performance Improvements'},
        test: {emoji: '✅', label: 'Tests'},
        build: {emoji: '📦', label: 'Build System'},
        ci: {emoji: '👷', label: 'CI/CD'},
        chore: {emoji: '🔧', label: 'Chores'},
        revert: {emoji: '⏪', label: 'Reverts'},
    };

    return typeMap[type] || {emoji: '📝', label: 'Other Changes'};
}

/**
 * Generate changelog markdown
 * @param version - Version number
 * @param date - Release date
 * @param commits - Grouped commits
 * @returns Markdown string
 */
function generateChangelogMarkdown(
    version: string,
    date: string,
    commits: ReturnType<typeof groupCommitsByType>
): string {
    let markdown = `## [${version}](${date})\n\n`;

    // Sort types by priority
    const typePriority = ['feat', 'fix', 'perf', 'refactor', 'docs', 'style', 'test', 'build', 'ci', 'chore', 'revert'];
    const sortedTypes = Object.keys(commits).sort((a, b) => {
        const indexA = typePriority.indexOf(a);
        const indexB = typePriority.indexOf(b);
        if (indexA === -1 && indexB === -1) return 0;
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
    });

    for (const type of sortedTypes) {
        const typeCommits = commits[type];
        if (typeCommits.length === 0) continue;

        const typeInfo = getTypeInfo(type);
        markdown += `### ${typeInfo.emoji} ${typeInfo.label}\n\n`;

        for (const commit of typeCommits) {
            const scope = commit.parsed.scope ? `**${commit.parsed.scope}**: ` : '';
            const breaking = commit.parsed.breaking ? '**BREAKING** ' : '';
            markdown += `* ${breaking}${scope}${commit.parsed.subject} ([${commit.hash.substring(0, 7)}](commit/${commit.hash}))\n`;
        }

        markdown += '\n';
    }

    return markdown;
}

/**
 * Read existing changelog file
 * @param filePath - Path to CHANGELOG.md
 * @returns Existing changelog content
 */
function readExistingChangelog(filePath: string): string {
    try {
        if (fs.existsSync(filePath)) {
            return fs.readFileSync(filePath, 'utf-8');
        }
    } catch (error) {
        logger.warn('Could not read existing changelog:', error);
    }
    return '';
}

/**
 * Write changelog to file
 * @param filePath - Path to CHANGELOG.md
 * @param content - Changelog content
 */
function writeChangelog(filePath: string, content: string): void {
    try {
        fs.writeFileSync(filePath, content, 'utf-8');
        logger.success(t('changelog.saved', {path: filePath}));
    } catch (error) {
        logger.error(t('changelog.saveFailed'), error);
        process.exit(1);
    }
}

/**
 * Parse command line arguments
 * @param args - Command line arguments
 * @returns Parsed arguments
 */
function parseArgs(args: string[]): {
    version?: string;
    from?: string;
    to?: string;
    output?: string;
    preview?: boolean;
} {
    const parsed = minimist(args, {
        alias: { v: 'version', f: 'from', t: 'to', o: 'output', p: 'preview' },
        boolean: ['preview'],
        string: ['version', 'from', 'to', 'output'],
        default: { preview: false } // default values can be set
    });

    // return to the reduced form
    return {
        version: parsed.version,
        from: parsed.from,
        to: parsed.to,
        output: parsed.output,
        preview: parsed.preview,
    };
}

/**
 * Get current version from package.json
 * @returns Current version string
 */
function getCurrentVersion(): string {
    try {
        const packagePath = path.join(process.cwd(), 'package.json');
        if (fs.existsSync(packagePath)) {
            const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
            return packageJson.version || '0.0.0';
        }
    } catch (error) {
        logger.warn('Could not read package.json:', error);
    }
    return '0.0.0';
}

/**
 * Main function to generate changelog
 * @param args - Command line arguments
 */
export async function generateChangelog(args: string[]) {
    logger.info(t('changelog.starting'));

    const options = parseArgs(args);
    const outputPath = options.output || path.join(process.cwd(), 'CHANGELOG.md');

    // Get tags
    const tags = await getGitTags();
    logger.info(t('changelog.foundTags', {count: tags.length}));

    // Determine version and range
    const version = options.version || getCurrentVersion();
    const from = options.from || tags[0] || '';
    const to = options.to || 'HEAD';

    logger.info(t('changelog.generating', {version, from: from || t('changelog.initial'), to}));
    logger.line();

    // Get commit details
    const spinner = logger.spinner(t('changelog.fetching'));
    const commits = await getCommitDetails(from, to);
    spinner.succeed(t('changelog.found', {count: commits.length}));

    if (commits.length === 0) {
        logger.warn(t('changelog.noCommits'));
        process.exit(0);
    }

    // Group commits by type
    const groupedCommits = groupCommitsByType(commits);

    // Generate changelog markdown
    const date = new Date().toISOString().split('T')[0];
    const newChangelog = generateChangelogMarkdown(version, date, groupedCommits);

    // Preview mode
    if (options.preview) {
        logger.line();
        logger.section(t('changelog.preview'));
        logger.separator(80);
        console.log(newChangelog);
        logger.separator(80);
        logger.line();
        return;
    }

    // Read existing changelog
    const existingChangelog = readExistingChangelog(outputPath);

    // Prepare final content
    let finalContent: string;
    if (existingChangelog) {
        // Insert new changelog at the beginning, after the header
        const lines = existingChangelog.split('\n');
        const headerEndIndex = lines.findIndex((line, index) =>
            index > 0 && line.startsWith('##')
        );

        if (headerEndIndex > -1) {
            finalContent = lines.slice(0, headerEndIndex).join('\n') + '\n\n' + newChangelog + '\n' + lines.slice(headerEndIndex).join('\n');
        } else {
            finalContent = existingChangelog + '\n\n' + newChangelog;
        }

    } else {
        // Create new changelog with header
        finalContent = `# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n${newChangelog}`;
    }

    // Write to file
    writeChangelog(outputPath, finalContent);

    logger.line();
    logger.success(t('changelog.success'));
    logger.info(t('changelog.location', {path: outputPath}));
    logger.line();
}