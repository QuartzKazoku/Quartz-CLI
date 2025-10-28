// utils/shell.ts
import { execa, type Options } from 'execa';

/**
 * Execute shell command and return stdout using execa
 * @param command - Shell command to execute
 * @returns Command stdout
 */
export async function shell(command: string): Promise<string> {
  try {
    const { stdout } = await execa({ shell: true })`${command}`;
    return stdout;
  } catch (error: any) {
    // If command fails, throw error with stderr
    throw new Error(error.stderr || error.message);
  }
}

/**
 * Execute shell command quietly (suppress output)
 * @param command - Shell command to execute
 * @returns Command stdout
 */
export async function shellQuiet(command: string): Promise<string> {
  try {
    const { stdout } = await execa({ shell: true, stderr: 'ignore' })`${command}`;
    return stdout;
  } catch (error: any) {
    throw new Error(error.message);
  }
}

/**
 * Template tag function for shell commands using execa
 * Usage: await $`git status` or await $`git status`.text()
 * This provides a similar API to Bun's $ but uses execa internally
 */
export function $(strings: TemplateStringsArray, ...values: any[]) {
  // Combine template strings and values into a single command
  const command = strings.reduce((acc, str, i) => {
    const value = values[i] !== undefined ? String(values[i]) : '';
    return acc + str + value;
  }, '');

  // Create a promise that executes the command
  const executePromise = (async () => {
    try {
      const { stdout } = await execa({ shell: true })`${command}`;
      return stdout;
    } catch (error: any) {
      throw new Error(error.stderr || error.message);
    }
  })();

  // Make the promise thenable and add methods
  const result = Object.assign(executePromise, {
    text: async () => {
      try {
        const { stdout } = await execa({ shell: true })`${command}`;
        return stdout;
      } catch (error: any) {
        throw new Error(error.stderr || error.message);
      }
    },
    quiet: async () => {
      try {
        const { stdout } = await execa({ shell: true, stderr: 'ignore' })`${command}`;
        return stdout;
      } catch (error: any) {
        throw new Error(error.message);
      }
    },
  });

  return result;
}