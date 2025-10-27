import OpenAI from 'openai';
import { $ } from 'bun';
import fs from 'node:fs';
import path from 'node:path';
import { t } from '../i18n';
import { getReviewPrompt, getSummaryPrompt } from '../utils/prompt';

interface ReviewComment {
  file: string;
  line: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestion?: string;
}

interface ReviewResult {
  score: number;
  summary: string;
  comments: ReviewComment[];
}

/**
 * Load configuration from quartz.json
 * @param config - Configuration object to update
 */
function loadQuartzConfig(config: { openaiApiKey: string; openaiBaseUrl: string; openaiModel: string }): void {
  const quartzPath = path.join(process.cwd(), 'quartz.json');
  
  if (!fs.existsSync(quartzPath)) {
    return;
  }
  
  try {
    const content = fs.readFileSync(quartzPath, 'utf-8');
    const data = JSON.parse(content);
    
    // Read from default profile
    if (data.default && data.default.configs) {
      const configs = data.default.configs;
      
      if (configs.OPENAI_API_KEY && !config.openaiApiKey) {
        config.openaiApiKey = configs.OPENAI_API_KEY;
      }
      if (configs.OPENAI_BASE_URL && process.env.OPENAI_BASE_URL === undefined) {
        config.openaiBaseUrl = configs.OPENAI_BASE_URL;
      }
      if (configs.OPENAI_MODEL && process.env.OPENAI_MODEL === undefined) {
        config.openaiModel = configs.OPENAI_MODEL;
      }
    }
  } catch (error) {
    console.error('Failed to parse quartz.json:', error);
  }
}

/**
 * Validate configuration and exit if invalid
 * @param config - Configuration object to validate
 */
function validateConfig(config: { openaiApiKey: string }): void {
  if (!config.openaiApiKey) {
    console.error(t('errors.noApiKey'));
    console.error(t('errors.setApiKey'));
    process.exit(1);
  }
}

/**
 * Load configuration from environment variables and quartz.json
 * @returns Configuration object
 */
function loadConfig() {
  const config = {
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    openaiBaseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    openaiModel: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
  };

  loadQuartzConfig(config);
  validateConfig(config);

  return config;
}

/**
 * Get changed files from git status
 * @param specificFiles - Optional array of specific files to review
 * @returns Array of changed file paths
 */
async function getChangedFiles(specificFiles?: string[]): Promise<string[]> {
  try {
    if (specificFiles && specificFiles.length > 0) {
      return specificFiles.filter(f => fs.existsSync(f));
    }

    // Get staged files
    const staged = (await $`git diff --cached --name-only`.text())
      .trim()
      .split('\n')
      .filter(Boolean);

    // Get unstaged files
    const unstaged = (await $`git diff --name-only`.text())
      .trim()
      .split('\n')
      .filter(Boolean);

    // Merge and deduplicate
    const allFiles = [...new Set([...staged, ...unstaged])];
    
    // Only return supported file types
    return allFiles.filter(f =>
      f && fs.existsSync(f) &&
      (f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.js') || f.endsWith('.jsx'))
    );
  } catch (error) {
    console.error(t('errors.gitError'), error);
    return [];
  }
}

/**
 * Get git diff for a file
 * @param file - File path to get diff for
 * @returns Git diff content
 */
async function getFileDiff(file: string): Promise<string> {
  try {
    // Try to get staged diff
    let diff = await $`git diff --cached -- "${file}"`.text();

    // If no staged diff, get working directory diff
    if (!diff) {
      diff = await $`git diff -- "${file}"`.text();
    }

    // If still no diff, might be a new file
    if (!diff) {
      const content = fs.readFileSync(file, 'utf-8');
      return `+++ b/${file}\n${content}`;
    }

    return diff;
  } catch (error) {
    console.error(t('errors.gitError'), error);
    return '';
  }
}

/**
 * Read file content
 * @param file - File path to read
 * @returns File content as string
 */
function readFileContent(file: string): string {
  try {
    return fs.readFileSync(file, 'utf-8');
  } catch (error) {
    console.warn(t('errors.fileNotFound'), error);
    return '';
  }
}

/**
 * Review code using AI
 * @param openai - OpenAI client instance
 * @param model - OpenAI model to use
 * @param file - File path being reviewed
 * @param diff - Git diff content
 * @param content - Full file content
 * @returns Array of review comments
 */
async function reviewCodeWithAI(
  openai: OpenAI,
  model: string,
  file: string,
  diff: string,
  content: string
): Promise<ReviewComment[]> {
  const prompt = getReviewPrompt(file, diff, content);

  try {
    const response = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const result = response.choices[0]?.message?.content;
    if (!result) {
      return [];
    }

    const parsed = JSON.parse(result);
    const comments: ReviewComment[] = (parsed.comments || []).map((c: any) => ({
      file,
      line: typeof c.line === 'number' ? c.line : 1,
      severity: c.severity || 'info',
      message: c.message || 'Unknown issue',
      suggestion: c.suggestion,
    }));

    return comments;
  } catch (error) {
    console.error(t('review.error'), error);
    return [];
  }
}

/**
 * Generate summary and score
 * @param openai - OpenAI client instance
 * @param model - OpenAI model to use
 * @param allComments - Array of all review comments
 * @returns Object containing score and summary
 */
async function generateSummary(
  openai: OpenAI,
  model: string,
  allComments: ReviewComment[]
): Promise<{ score: number; summary: string }> {
  const errorCount = allComments.filter(c => c.severity === 'error').length;
  const warningCount = allComments.filter(c => c.severity === 'warning').length;
  const infoCount = allComments.filter(c => c.severity === 'info').length;

  // Scoring algorithm
  let score = 100;
  score -= errorCount * 15;
  score -= warningCount * 8;
  score -= infoCount * 3;
  score = Math.max(0, Math.min(100, score));

  const prompt = getSummaryPrompt(errorCount, warningCount, infoCount, score);

  try {
    const response = await openai.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      max_tokens: 100,
    });

    const summary = response.choices[0]?.message?.content?.trim() || t('review.result');
    return { score, summary };
  } catch (error) {
    console.error(t('errors.apiFailed'), error);
    return { score, summary: t('review.result') };
  }
}

/**
 * Print review results to console
 * @param result - Review result object
 */
function printResult(result: ReviewResult) {
  const { score, summary, comments } = result;

  // Score and level
  let scoreEmoji: string;
  let scoreDesc: string;
  
  if (score >= 90) {
    scoreEmoji = '🌟';
    scoreDesc = t('scoreLevel.excellent');
  } else if (score >= 75) {
    scoreEmoji = '✅';
    scoreDesc = t('scoreLevel.good');
  } else if (score >= 60) {
    scoreEmoji = '⚠️';
    scoreDesc = t('scoreLevel.pass');
  } else {
    scoreEmoji = '❌';
    scoreDesc = t('scoreLevel.needImprovement');
  }

  console.log('\n' + '='.repeat(60));
  console.log(`${scoreEmoji} ${t('review.result')}`);
  console.log('='.repeat(60));
  console.log(`\n${t('review.score')}: ${score}/100 (${scoreDesc})`);
  console.log(`${t('review.summary')}: ${summary}\n`);

  // Issue statistics
  const errorCount = comments.filter(c => c.severity === 'error').length;
  const warningCount = comments.filter(c => c.severity === 'warning').length;
  const infoCount = comments.filter(c => c.severity === 'info').length;

  console.log(t('review.statistics'));
  console.log(`   ❌ ${t('review.error')}:   ${errorCount}`);
  console.log(`   ⚠️  ${t('review.warning')}:   ${warningCount}`);
  console.log(`   ℹ️  ${t('review.suggestion')}:   ${infoCount}`);
  console.log(`   📌 ${t('review.total')}:   ${comments.length}\n`);

  // Detailed issues
  if (comments.length > 0) {
    console.log(t('review.details'));
    for (let index = 0; index < comments.length; index++) {
      const comment = comments[index];
      let emoji: string;
      if (comment.severity === 'error') {
        emoji = '❌';
      } else if (comment.severity === 'warning') {
        emoji = '⚠️';
      } else {
        emoji = 'ℹ️';
      }
      console.log(`${index + 1}. ${emoji} ${comment.file}:${comment.line}`);
      console.log(`   ${comment.message}`);
      if (comment.suggestion) {
        console.log(`   💡 ${comment.suggestion.split('\n')[0]}...`);
      }
      console.log('');
    }
  }

  console.log('='.repeat(60) + '\n');
}

/**
 * Parse command line arguments
 * @param args - Command line arguments array
 * @returns Parsed arguments object
 */
function parseArgs(args: string[]): { files?: string[]; output?: string } {
  const result: { files?: string[]; output?: string } = {};
  
  let i = 0;
  while (i < args.length) {
    if (args[i] === '--files' || args[i] === '-f') {
      result.files = [];
      i++;
      while (i < args.length && !args[i].startsWith('-')) {
        result.files.push(args[i]);
        i++;
      }
    } else if (args[i] === '--output' || args[i] === '-o') {
      i++;
      if (i < args.length) {
        result.output = args[i];
        i++;
      }
    } else {
      i++;
    }
  }
  
  return result;
}

/**
 * Main function to review code
 * @param args - Command line arguments
 */
export async function reviewCode(args: string[]) {
  console.log(t('review.starting'));

  const config = loadConfig();
  const { files: specificFiles, output } = parseArgs(args);

  // Initialize OpenAI client
  const openai = new OpenAI({
    apiKey: config.openaiApiKey,
    baseURL: config.openaiBaseUrl,
  });

  // Get files to review
  const files = await getChangedFiles(specificFiles);

  if (files.length === 0) {
    console.log(t('review.noFiles'));
    console.log(t('review.tip'));
    return;
  }

  console.log(t('review.foundFiles', { count: files.length }));
  for (const f of files) {
    console.log(`   - ${f}`);
  }
  console.log('');

  // Review each file
  const allComments: ReviewComment[] = [];
  for (const file of files) {
    console.log(t('review.reviewing', { file }));
    
    const diff = await getFileDiff(file);
    if (!diff) {
      console.log(`   ⏭️  Skip\n`);
      continue;
    }

    const content = readFileContent(file);
    const comments = await reviewCodeWithAI(openai, config.openaiModel, file, diff, content);
    
    console.log(`   ✅ ${t('review.found')} ${comments.length} ${t('review.issues')}\n`);
    allComments.push(...comments);
  }

  // Generate summary
  console.log(t('review.generating'));
  const { score, summary } = await generateSummary(openai, config.openaiModel, allComments);

  // Output results
  const result: ReviewResult = {
    score,
    summary,
    comments: allComments,
  };

  // Save to file
  if (output) {
    fs.writeFileSync(output, JSON.stringify(result, null, 2));
    console.log(t('review.saved', { path: output }));
  }

  // Print results
  printResult(result);
}