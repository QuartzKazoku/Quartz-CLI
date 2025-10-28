// utils/enquirer.ts
import enquirer from 'enquirer';

/**
 * Select from a list of options
 * @param message - Prompt message
 * @param choices - Array of choices
 * @param initial - Initial selected index
 * @returns Selected value
 */
export async function select<T = string>(
  message: string,
  choices: Array<{ name: string; value: T; message?: string }>,
  initial: number = 0
): Promise<T> {
  const { Select } = enquirer;
  
  const prompt = new Select({
    name: 'value',
    message,
    choices: choices.map(c => ({
      name: c.name,
      message: c.message || c.name,
      value: c.value,
    })),
    initial,
  });

  const result = await prompt.run();
  return result as T;
}

/**
 * Get text input from user
 * @param message - Prompt message
 * @param initial - Initial value
 * @param validate - Validation function
 * @returns User input
 */
export async function input(
  message: string,
  initial?: string,
  validate?: (value: string) => boolean | string
): Promise<string> {
  const { Input } = enquirer;
  
  const prompt = new Input({
    message,
    initial,
    validate,
  });

  return await prompt.run();
}

/**
 * Get password input from user
 * @param message - Prompt message
 * @returns User input (hidden)
 */
export async function password(message: string): Promise<string> {
  const { Password } = enquirer;
  
  const prompt = new Password({
    message,
  });

  return await prompt.run();
}

/**
 * Confirm yes/no question
 * @param message - Prompt message
 * @param initial - Initial value (default: false)
 * @returns User confirmation
 */
export async function confirm(
  message: string,
  initial: boolean = false
): Promise<boolean> {
  const { Confirm } = enquirer;
  
  const prompt = new Confirm({
    message,
    initial,
  });

  return await prompt.run();
}

/**
 * Multiple choice selection
 * @param message - Prompt message
 * @param choices - Array of choices
 * @param initial - Initial selected indices
 * @returns Array of selected values
 */
export async function multiselect<T = string>(
  message: string,
  choices: Array<{ name: string; value: T; message?: string }>,
  initial?: number[]
): Promise<T[]> {
  const { MultiSelect } = enquirer;
  
  const prompt = new MultiSelect({
    name: 'value',
    message,
    choices: choices.map(c => ({
      name: c.name,
      message: c.message || c.name,
      value: c.value,
    })),
    initial,
  });

  const result = await prompt.run();
  return result as T[];
}

/**
 * AutoComplete prompt
 * @param message - Prompt message
 * @param choices - Array of choices
 * @param initial - Initial value
 * @returns Selected value
 */
export async function autocomplete<T = string>(
  message: string,
  choices: Array<{ name: string; value: T; message?: string }>,
  initial?: number
): Promise<T> {
  const { AutoComplete } = enquirer;
  
  const prompt = new AutoComplete({
    name: 'value',
    message,
    choices: choices.map(c => ({
      name: c.name,
      message: c.message || c.name,
      value: c.value,
    })),
    initial,
  });

  const result = await prompt.run();
  return result as T;
}

/**
 * Display list and let user select one item
 * Used for commit message selection, language selection, etc.
 */
export async function selectFromList<T>(
  message: string,
  items: T[],
  formatter: (item: T, index: number) => string,
  initial: number = 0
): Promise<number> {
  const choices = items.map((item, index) => ({
    name: String(index),
    value: index,
    message: formatter(item, index),
  }));

  return await select(message, choices, initial);
}

/**
 * Format commit message for display in selection
 */
export function formatCommitMessage(message: string, index: number): string {
  const lines = message.split('\n');
  const firstLine = lines[0];
  const rest = lines.slice(1).filter(l => l.trim());
  
  let formatted = `[${index + 1}] ${firstLine}`;
  if (rest.length > 0) {
    formatted += `\n    ${rest.slice(0, 2).join('\n    ')}`;
    if (rest.length > 2) {
      formatted += '\n    ...';
    }
  }
  
  return formatted;
}

/**
 * Display a styled message box
 * @param message - Main message
 * @param details - Optional details message
 * @param type - Message type (success, info, error, warning)
 */
export async function message(
  message: string,
  details?: string,
  type: 'success' | 'info' | 'error' | 'warning' = 'info'
): Promise<void> {
  const { Snippet } = enquirer;
  
  const icons = {
    success: '✅',
    info: 'ℹ️',
    error: '❌',
    warning: '⚠️',
  };
  
  const colors = {
    success: '\x1b[32m',
    info: '\x1b[36m',
    error: '\x1b[31m',
    warning: '\x1b[33m',
  };
  
  const reset = '\x1b[0m';
  const icon = icons[type];
  const color = colors[type];
  
  console.log('');
  console.log(`${icon}  ${color}${message}${reset}`);
  if (details) {
    console.log(`${' '.repeat(4)}\x1b[2m${details}${reset}`);
  }
  console.log('');
}