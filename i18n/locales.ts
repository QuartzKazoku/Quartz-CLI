//cli/i18n/locales.ts
// Multi-language type definitions and configuration

/**
 * Supported language type definitions
 */
export type Language = 'zh-CN' | 'zh-TW' | 'ja' | 'ko' | 'en';

/**
 * Multi-language translation text interface definition
 * Contains translation fields for each functional module
 */
export interface Translations {
  // Common
  common: {
    success: string;
    error: string;
    warning: string;
    info: string;
    loading: string;
    cancel: string;
    confirm: string;
  };

  // CLI main menu
  cli: {
    usage: string;
    commands: string;
    options: string;
    examples: string;
    moreInfo: string;
    subtitle: string;
    help: string;
    version: string;
    configDesc: string;
    initConfig: string;
  };

  // Review command
  review: {
    starting: string;
    foundFiles: string;
    reviewing: string;
    found: string;
    issues: string;
    generating: string;
    result: string;
    score: string;
    summary: string;
    statistics: string;
    error: string;
    warning: string;
    suggestion: string;
    total: string;
    details: string;
    noFiles: string;
    tip: string;
    saved: string;
  };

  // Commit command
  commit: {
    starting: string;
    foundStaged: string;
    generating: string;
    generated: string;
    tips: string;
    editTip: string;
    manualTip: string;
    saved: string;
    noStaged: string;
    useGitAdd: string;
    success: string;
    failed: string;
    cancelled: string;
    editMode: string;
    autoStaged: string;
    stageFailed: string;
    selectPrompt: string;
    generatingOptions: string;
    selectedMessage: string;
  };

  // PR command
  pr: {
    starting: string;
    currentBranch: string;
    targetBranch: string;
    repository: string;
    statistics: string;
    commits: string;
    filesChanged: string;
    generating: string;
    generatedTitle: string;
    generatedBody: string;
    tips: string;
    autoTip: string;
    ghTip: string;
    selectTip: string;
    baseTip: string;
    manualTip: string;
    saved: string;
    creating: string;
    success: string;
    failed: string;
    sameBranch: string;
    switchBranch: string;
    noDiff: string;
    ensureBranch: string;
    selectBranch: string;
    noBranches: string;
    noToken: string;
    useGHTip: string;
    pushingBranch: string;
    branchPushed: string;
  };

  // Score levels
  scoreLevel: {
    excellent: string;
    good: string;
    pass: string;
    needImprovement: string;
  };

  // Config command
  config: {
    usage: string;
    commands: string;
    listDesc: string;
    setDesc: string;
    getDesc: string;
    initDesc: string;
    availableKeys: string;
    examples: string;
    current: string;
    notSet: string;
    notConfigured: string;
    set: string;
    keys: {
      apiKey: string;
      baseUrl: string;
      model: string;
      gitPlatform: string;
      githubToken: string;
      gitlabToken: string;
      gitlabUrl: string;
      language: string;
      promptLanguage: string;
    };
    wizard: {
      welcome: string;
      apiKey: string;
      apiKeyWithCurrent: string;
      baseUrl: string;
      model: string;
      gitPlatform: string;
      githubToken: string;
      githubTokenWithCurrent: string;
      gitlabToken: string;
      gitlabTokenWithCurrent: string;
      gitlabUrl: string;
      language: string;
      success: string;
      saved: string;
    };
    errors: {
      setUsage: string;
      getUsage: string;
      unknownCommand: string;
      saveProfileUsage: string;
      loadProfileUsage: string;
      deleteProfileUsage: string;
    };
    profilesDesc: string;
    profileSaved: string;
    profileLoaded: string;
    profileDeleted: string;
    profileNotFound: string;
    savedProfiles: string;
    availableProfiles: string;
    noProfiles: string;
    configItems: string;
    configuredPlatforms: string;
    platformCount: string;
    gitlabTokenSetFirst: string;
    gitPlatformDeprecated: string;
    unknownKey: string;
  };

  // Error messages
  errors: {
    noApiKey: string;
    setApiKey: string;
    apiFailed: string;
    fileNotFound: string;
    gitError: string;
    networkError: string;
  };
}

// Import language translations
import { zhCN } from './locales/zh-CN';
import { zhTW } from './locales/zh-TW';
import { ja } from './locales/ja';
import { ko } from './locales/ko';
import { en } from './locales/en';

/**
 * Mapping relationship between languages and translation content
 */
export const locales: Record<Language, Translations> = {
  'zh-CN': zhCN,
  'zh-TW': zhTW,
  'ja': ja,
  'ko': ko,
  'en': en,
};

/**
 * Default language setting
 */
export const defaultLanguage: Language = 'en';
