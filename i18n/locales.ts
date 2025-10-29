//cli/i18n/locales.ts
/**
 * Multi-language type definitions and configuration
 * @module i18n/locales
 */

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

  // Migration
  migration: {
    detected: string;
    starting: string;
    success: string;
    applied: string;
    errors: string;
    failed: string;
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
    initDesc: string;
    configDesc: string;
    initProject: string;
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
    generatingOptions: string;
    generatedTitle: string;
    generatedBody: string;
    generatedOptions: string;
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
    selectPrompt: string;
    selectedOption: string;
    cancelled: string;
    optionTitle: string;
    selectedTitle: string;
    selectedBody: string;
    platformTokenRequired: string;
  };

  // Score levels
  scoreLevel: {
    excellent: string;
    good: string;
    pass: string;
    needImprovement: string;
  };

  // Changelog command
  changelog: {
    starting: string;
    foundTags: string;
    generating: string;
    initial: string;
    fetching: string;
    found: string;
    noCommits: string;
    preview: string;
    saved: string;
    saveFailed: string;
    success: string;
    location: string;
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
      switchProfileUsage: string;
    };
    profilesDesc: string;
    profileSaved: string;
    profileLoaded: string;
    profileSwitched: string;
    profileDeleted: string;
    profileNotFound: string;
    currentProfile: string;
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

  // Init command
  init: {
    starting: string;
    alreadyInitialized: string;
    reinitializeHint: string;
    dirExists: string;
    dirCreated: string;
    configCreated: string;
    configExists: string;
    versionInitialized: string;
    exampleCreated: string;
    exampleExists: string;
    success: string;
    complete: string;
    nextSteps: string;
    setupConfig: string;
    viewCommands: string;
    foundOldConfig: string;
    migrated: string;
    oldConfigReminder: string;
    gitignoreReminder: string;
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

  // Branch command
  branch: {
    starting: string;
    list: string;
    created: string;
    createdNoCheckout: string;
    deleted: string;
    createFailed: string;
    deleteFailed: string;
    cannotDeleteCurrent: string;
    useForceDelete: string;
    selectAction: string;
    actionCreate: string;
    actionDelete: string;
    actionList: string;
    createMode: string;
    deleteMode: string;
    createFromIssue: string;
    fetchingIssues: string;
    noIssues: string;
    manualCreate: string;
    enterBranchName: string;
    selectIssue: string;
    suggestedName: string;
    useSuggestedName: string;
    selectBranchToDelete: string;
    selectBranchesToDelete: string;
    confirmDelete: string;
    confirmDeleteMultiple: string;
    forceDelete: string;
    deleteCancelled: string;
    deleteComplete: string;
    noDeletableBranches: string;
    noRepoInfo: string;
    noToken: string;
    fetchIssuesFailed: string;
    unknownCommand: string;
    usage: string;
  };
}

/**
 * Import language translations from locale files
 */
import { zhCN } from './locales/zh-CN';
import { zhTW } from './locales/zh-TW';
import { ja } from './locales/ja';
import { ko } from './locales/ko';
import { en } from './locales/en';

/**
 * Mapping relationship between languages and translation content
 * Maps language codes to their respective translation objects
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
 * Used when no language is specified or configured
 */
export const defaultLanguage: Language = 'en';
