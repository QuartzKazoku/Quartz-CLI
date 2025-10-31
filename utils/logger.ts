// utils/logger.ts
import chalk from 'chalk';
import ora, { type Ora } from 'ora';
import boxen from 'boxen';
import figlet from 'figlet';
import gradient from 'gradient-string';
import { consola } from 'consola';

/**
 * Logger utility with enhanced CLI styling
 */
export const logger = {
  // Basic logging with consola
  info: (message: string, ...args: any[]) => consola.info(message, ...args),
  success: (message: string, ...args: any[]) => consola.success(message, ...args),
  warn: (message: string, ...args: any[]) => consola.warn(message, ...args),
  error: (message: string, ...args: any[]) => consola.error(message, ...args),
  log: (message: string, ...args: any[]) => consola.log(message, ...args),
  debug: (message: string, ...args: any[]) => consola.debug(message, ...args),

  // Styled text
  text: {
    primary: (text: string) => chalk.cyan(text),
    success: (text: string) => chalk.green(text),
    warning: (text: string) => chalk.yellow(text),
    error: (text: string) => chalk.red(text),
    muted: (text: string) => chalk.gray(text),
    bold: (text: string) => chalk.bold(text),
    dim: (text: string) => chalk.dim(text),
  },

  // Box messages
  box: (message: string, options?: { title?: string; padding?: number }) => {
    console.log(
      boxen(message, {
        padding: options?.padding ?? 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'cyan',
        title: options?.title,
        titleAlignment: 'center',
      })
    );
  },

  // ASCII art title
  title: async (text: string, gradient?: boolean) => {
    return new Promise<void>((resolve) => {
      figlet.text(
        text,
        {
          font: 'Standard',
          horizontalLayout: 'default',
          verticalLayout: 'default',
        },
        (err, data) => {
          if (err) {
            console.log(text);
            resolve();
            return;
          }
          if (data) {
            if (gradient) {
              console.log(gradientText(data));
            } else {
              console.log(chalk.cyan(data));
            }
          }
          resolve();
        }
      );
    });
  },

  // Gradient text
  gradient: (text: string) => {
    console.log(gradientText(text));
  },

  // Separator line
  separator: (length: number = 70, char: string = '━') => {
    console.log(chalk.dim(char.repeat(length)));
  },

  // Empty line
  line: () => {
    console.log('');
  },

  // Spinner for loading states
  spinner: (text: string): Ora => {
    return ora({
      text,
      color: 'cyan',
      spinner: 'dots',
    }).start();
  },

  // Simple list item
  listItem: (text: string, indent: number = 1) => {
    console.log(`${' '.repeat(indent * 2)}• ${text}`);
  },

  // Numbered list item
  numberedItem: (index: number, text: string, indent: number = 1) => {
    const indexText = `${index}.`;
    console.log(`${' '.repeat(indent * 2)}${chalk.cyan(indexText)} ${text}`);
  },

  // Key-value pair
  keyValue: (key: string, value: string, indent: number = 1) => {
    console.log(`${' '.repeat(indent * 2)}${chalk.bold(key)}: ${chalk.cyan(value)}`);
  },

  // Section header
  section: (title: string) => {
    console.log('');
    console.log(chalk.bold.cyan(`⚡ ${title}`));
    console.log(chalk.dim('─'.repeat(title.length + 3)));
  },

  // Command usage
  command: (cmd: string, description?: string) => {
    console.log(`  ${chalk.cyan(cmd)}`);
    if (description) {
      console.log(`  ${chalk.dim(description)}`);
    }
    console.log('');
  },

  // Example command
  example: (description: string, command: string) => {
    const descriptionText = `# ${description}`;
    console.log(`  ${chalk.dim(descriptionText)}`);
    console.log(`  ${chalk.green('$')} ${command}`);
    console.log('');
  },
};

/**
 * Create gradient text using gradient-string v3 API
 */
const gradientInstance = gradient(['#00D9FF', '#FF69B4']);

function gradientText(text: string): string {
  return gradientInstance.multiline(text);
}

/**
 * Export individual utilities for specific needs
 */
export { default as chalk } from 'chalk';
export { default as ora } from 'ora';
export { default as boxen } from 'boxen';
export { default as figlet } from 'figlet';
export { default as gradient } from 'gradient-string';
export { consola } from 'consola';