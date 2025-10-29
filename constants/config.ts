/**
 * @fileoverview Configuration-related constants for Quartz CLI
 * @description Defines configuration file names, keys, and default values
 * @author Quartz CLI Team
 * @version 1.0.0
 * @since 2025-10-28
 * @license MIT
 * @copyright (c) 2025 Quartz
 *
 * @example
 *   import { CONFIG_FILE, CONFIG_KEYS, DEFAULT_VALUES } from '@/constants/config';
 *   console.log(CONFIG_FILE.NAME); // => 'quartz.jsonc'
 *   console.log(CONFIG_KEYS.OPENAI_API_KEY); // => 'OPENAI_API_KEY'
 *   console.log(DEFAULT_VALUES.OPENAI_MODEL); // => 'gpt-5'
 *
 * @namespace ConfigConstants
 * @module constants/config
 */

/**
 * Configuration file related constants
 * Defines the configuration file name and default profile settings
 * @type {object}
 * @readonly
 * @property {string} DIR - The configuration directory name
 * @property {string} NAME - The name of the configuration file (JSON with comments)
 * @property {string} EXAMPLE_NAME - The name of the example configuration file
 * @property {string} DEFAULT_PROFILE - The default profile name to use
 */
export const CONFIG_FILE = {
    /** Configuration directory name */
    DIR: '.quartz',
    /** Configuration file name with JSONC extension (JSON with comments) */
    NAME: 'quartz.jsonc',
    /** Example configuration file name */
    EXAMPLE_NAME: 'quartz.example.jsonc',
    /** Default profile name used when no profile is specified */
    DEFAULT_PROFILE: 'default',
} as const;

/**
 * Configuration key name constants
 * Defines all available configuration keys used throughout the application
 * @type {object}
 * @readonly
 * @property {string} OPENAI_API_KEY - Environment variable key for OpenAI API token
 * @property {string} OPENAI_BASE_URL - Environment variable key for OpenAI base URL
 * @property {string} OPENAI_MODEL - Environment variable key for OpenAI model name
 * @property {string} GITHUB_TOKEN - Environment variable key for GitHub personal access token
 * @property {string} GITLAB_TOKEN - Environment variable key for GitLab personal access token
 * @property {string} GITLAB_URL - Environment variable key for GitLab instance URL
 * @property {string} GIT_PLATFORM - Environment variable key for Git platform selection
 * @property {string} QUARTZ_LANG - Environment variable key for Quartz UI language
 * @property {string} PROMPT_LANG - Environment variable key for AI prompt language
 */
export const CONFIG_KEYS = {
    /** OpenAI API key for authentication */
    OPENAI_API_KEY: 'OPENAI_API_KEY',
    /** OpenAI API base URL endpoint */
    OPENAI_BASE_URL: 'OPENAI_BASE_URL',
    /** OpenAI model name for AI operations */
    OPENAI_MODEL: 'OPENAI_MODEL',
    /** GitHub personal access token for API operations */
    GITHUB_TOKEN: 'GITHUB_TOKEN',
    /** GitLab personal access token for API operations */
    GITLAB_TOKEN: 'GITLAB_TOKEN',
    /** GitLab instance URL for self-hosted deployments */
    GITLAB_URL: 'GITLAB_URL',
    /** Git platform selection (github, gitlab) */
    GIT_PLATFORM: 'GIT_PLATFORM',
    /** Quartz CLI interface language */
    QUARTZ_LANG: 'QUARTZ_LANG',
    /** Language used for AI-generated prompts */
    PROMPT_LANG: 'PROMPT_LANG',
} as const;

/**
 * Default configuration values
 * Provides fallback values for configuration when not specified by user
 * @type {object}
 * @readonly
 * @property {string} OPENAI_BASE_URL - Default OpenAI API endpoint
 * @property {string} OPENAI_MODEL - Default OpenAI model to use
 * @property {string} GITLAB_URL - Default GitLab instance URL
 * @property {string} LANGUAGE_UI - Default UI language code
 * @property {string} LANGUAGE_PROMPT - Default prompt language code
 */
export const DEFAULT_VALUES = {
    /** Default OpenAI API endpoint URL */
    OPENAI_BASE_URL: 'https://api.openai.com/v1',
    /** Default OpenAI model for AI operations */
    OPENAI_MODEL: 'gpt-5',
    /** Default GitLab public instance URL */
    GITLAB_URL: 'https://gitlab.com',
    /** Default UI language (English) */
    LANGUAGE_UI: 'en',
    /** Default prompt language (English) */
    LANGUAGE_PROMPT: 'en',
} as const;
/**
 * Default configuration content for quartz.jsonc
 * Provides a template for users to understand the configuration structure
 * @type {string}
 * @readonly
 */
export const DEFAULT_CONFIG_CONTENT = `{
  "default": {
    "name": "default",
    "config": {
      "openai": {
        "apiKey": "sk-",
        "baseUrl": "${DEFAULT_VALUES.OPENAI_BASE_URL}",
        "model": "${DEFAULT_VALUES.OPENAI_MODEL}"
      },
      "platforms": [
        {
          "type": "github",
          "token": ""
        },
        {
          "type": "gitlab",
          "url": "${DEFAULT_VALUES.GITLAB_URL}",
          "token": "glpat-your-gitlab-token-here"
        }
      ],
      "language": {
        "ui": "${DEFAULT_VALUES.LANGUAGE_UI}",
        "prompt": "${DEFAULT_VALUES.LANGUAGE_PROMPT}"
      }
    }
  }
}` as const;

/**
 * Example configuration content for quartz.example.jsonc
 * Provides a template for users to understand the configuration structure
 * @type {string}
 * @readonly
 */
export const EXAMPLE_CONFIG_CONTENT = `{
  "default": {
    "name": "default",
    "config": {
      "openai": {
        "apiKey": "sk-",
        "baseUrl": "${DEFAULT_VALUES.OPENAI_BASE_URL}",
        "model": "${DEFAULT_VALUES.OPENAI_MODEL}"
      },
      "platforms": [
        {
          "type": "github",
          "token": ""
        },
        {
          "type": "gitlab",
          "url": "${DEFAULT_VALUES.GITLAB_URL}",
          "token": "glpat-your-gitlab-token-here"
        }
      ],
      "language": {
        "ui": "${DEFAULT_VALUES.LANGUAGE_UI}",
        "prompt": "${DEFAULT_VALUES.LANGUAGE_PROMPT}"
      }
    }
  },
  "work": {
    "name": "work",
    "config": {
      "openai": {
        "apiKey": "sk-your-work-openai-api-key",
        "baseUrl": "${DEFAULT_VALUES.OPENAI_BASE_URL}",
        "model": "${DEFAULT_VALUES.OPENAI_MODEL}"
      },
      "platforms": [
        {
          "type": "gitlab",
          "url": "https://gitlab.company.com",
          "token": "glpat-your-company-gitlab-token"
        }
      ],
      "language": {
        "ui": "${DEFAULT_VALUES.LANGUAGE_UI}",
        "prompt": "${DEFAULT_VALUES.LANGUAGE_UI}"
      }
    }
  }
}` as const;
