// Multi-language configuration file

export type Language = 'zh-CN' | 'zh-TW' | 'ja' | 'ko' | 'en';

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
    autoTip: string;
    editTip: string;
    manualTip: string;
    saved: string;
    noStaged: string;
    useGitAdd: string;
    success: string;
    failed: string;
    cancelled: string;
    editMode: string;
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
      githubToken: string;
      language: string;
      promptLanguage: string;
    };
    wizard: {
      welcome: string;
      apiKey: string;
      apiKeyWithCurrent: string;
      baseUrl: string;
      model: string;
      githubToken: string;
      githubTokenWithCurrent: string;
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

// Simplified Chinese
export const zhCN: Translations = {
  common: {
    success: '✅ 成功',
    error: '❌ 错误',
    warning: '⚠️  警告',
    info: 'ℹ️  提示',
    loading: '⏳ 加载中...',
    cancel: '取消',
    confirm: '确认',
  },

  cli: {
    usage: '用法',
    commands: '命令',
    options: '选项',
    examples: '示例',
    moreInfo: '更多信息',
    subtitle: 'AI 驱动的 Git 工作流助手',
    help: '显示帮助信息',
    version: '显示版本号',
    configDesc: '配置管理 (API Key, 模型等)',
    initConfig: '初始化配置',
  },

  review: {
    starting: '🚀 开始本地代码审查...\n',
    foundFiles: '📁 发现 {count} 个文件需要审查:\n',
    reviewing: '🔍 审查: {file}',
    found: '发现',
    issues: '个问题',
    generating: '📊 生成总结...',
    result: 'Code Review 结果',
    score: '📊 评分',
    summary: '📝 总结',
    statistics: '📋 问题统计',
    error: '错误',
    warning: '警告',
    suggestion: '建议',
    total: '总计',
    details: '📝 详细问题:\n',
    noFiles: '✅ 没有需要审查的文件',
    tip: '   提示: 请先修改一些文件，或使用 --files 指定要审查的文件',
    saved: '💾 结果已保存到: {path}\n',
  },

  commit: {
    starting: '🚀 生成 Commit Message...\n',
    foundStaged: '📁 发现 {count} 个已暂存的文件:\n',
    generating: '🤖 正在生成 commit message...\n',
    generated: '📝 生成的 Commit Message:',
    tips: '💡 提示:',
    autoTip: '   - 使用 --auto 或 -a 自动提交',
    editTip: '   - 使用 --edit 或 -e 在编辑器中修改后提交',
    manualTip: '   - 手动复制上述消息进行提交\n',
    saved: '💾 Commit message 已保存到: {path}\n',
    noStaged: '❌ 没有已暂存的变更',
    useGitAdd: '   请先使用 git add 暂存要提交的文件',
    success: '\n✅ 提交成功!',
    failed: '❌ 提交失败',
    cancelled: '\n⚠️  取消提交',
    editMode: '✏️  编辑模式: 请在编辑器中修改 commit message',
  },

  pr: {
    starting: '🚀 生成 Pull Request 描述...\n',
    currentBranch: '📌 当前分支',
    targetBranch: '📌 目标分支',
    repository: '📦 仓库',
    statistics: '📊 变更统计:',
    commits: '个提交',
    filesChanged: '个文件变更',
    generating: '🤖 正在生成 PR 描述...\n',
    generatedTitle: '📝 生成的 PR 标题:',
    generatedBody: '\n📝 生成的 PR 描述:',
    tips: '💡 提示:',
    autoTip: '   - 使用 --auto 或 -a 自动创建 PR',
    ghTip: '   - 使用 --gh 选项通过 GitHub CLI 创建',
    baseTip: '   - 使用 --base <branch> 指定目标分支 (默认: main)',
    manualTip: '   - 或手动复制上述描述到 GitHub 创建 PR\n',
    saved: '💾 PR 描述已保存到: {path}\n',
    creating: '⚡ 自动创建 PR...\n',
    success: '\n✅ PR 创建成功!',
    failed: '❌ 创建 PR 失败',
    sameBranch: '❌ 错误: 当前分支 ({current}) 与目标分支相同',
    switchBranch: '   请切换到功能分支后再创建 PR',
    noDiff: '❌ 当前分支与 {base} 分支没有差异',
    ensureBranch: '   请确保 {base} 分支存在',
  },

  scoreLevel: {
    excellent: '优秀',
    good: '良好',
    pass: '及格',
    needImprovement: '需要改进',
  },

  config: {
    usage: '💎 Quartz 配置管理\n\n用法: quartz config <command> [options]',
    commands: '可用命令:',
    listDesc: '列出所有配置',
    setDesc: '设置配置值',
    getDesc: '获取配置值',
    initDesc: '交互式配置向导',
    availableKeys: '可配置项:',
    examples: '示例:',
    current: '\n📋 当前配置:',
    notSet: '❌ {key} 未设置',
    notConfigured: '未配置',
    set: '✅ 已设置 {key}={value}',
    keys: {
      apiKey: 'OpenAI API Key',
      baseUrl: 'OpenAI API 基础 URL',
      model: 'OpenAI 模型名称',
      githubToken: 'GitHub Personal Access Token (可选)',
      language: '界面语言',
      promptLanguage: 'AI 提示语言',
    },
    wizard: {
      welcome: '🚀 欢迎使用 Quartz 配置向导!\n   我们将帮助你设置必要的配置项。\n',
      apiKey: '请输入你的 OpenAI API Key: ',
      apiKeyWithCurrent: '请输入你的 OpenAI API Key (当前: {current}, 回车跳过): ',
      baseUrl: 'OpenAI API 基础 URL (默认: {default}, 回车使用默认值): ',
      model: 'OpenAI 模型 (默认: {default}, 回车使用默认值): ',
      githubToken: 'GitHub Token (可选, 用于创建 PR, 回车跳过): ',
      githubTokenWithCurrent: 'GitHub Token (当前: {current}, 回车跳过): ',
      language: '选择界面语言 [zh-CN/zh-TW/ja/ko/en] (默认: {default}, 回车使用默认值): ',
      success: '✅ 配置保存成功!',
      saved: '💾 配置文件已保存到: {path}',
    },
    errors: {
      setUsage: '❌ 用法: quartz config set <key> <value>',
      getUsage: '❌ 用法: quartz config get <key>',
      unknownCommand: '❌ 未知命令: {command}',
      saveProfileUsage: '❌ 用法: quartz config save-profile <name>',
      loadProfileUsage: '❌ 用法: quartz config load-profile <name>',
      deleteProfileUsage: '❌ 用法: quartz config delete-profile <name>',
    },
    profilesDesc: '配置文件管理',
    profileSaved: '✅ 配置文件已保存: {name}',
    profileLoaded: '✅ 配置文件已加载: {name}',
    profileDeleted: '✅ 配置文件已删除: {name}',
    profileNotFound: '❌ 配置文件不存在: {name}',
    savedProfiles: '已保存的配置文件',
    availableProfiles: '可用的配置文件:',
    noProfiles: '📋 没有保存的配置文件\n   使用 "quartz config save-profile <name>" 保存当前配置',
    configItems: '项配置',
  },

  errors: {
    noApiKey: '❌ 错误: 未设置 OPENAI_API_KEY',
    setApiKey: '   请设置环境变量或在项目根目录创建 .env 文件',
    apiFailed: '❌ API 调用失败',
    fileNotFound: '❌ 文件不存在',
    gitError: '❌ Git 操作失败',
    networkError: '❌ 网络错误',
  },
};

// Traditional Chinese
export const zhTW: Translations = {
  common: {
    success: '✅ 成功',
    error: '❌ 錯誤',
    warning: '⚠️  警告',
    info: 'ℹ️  提示',
    loading: '⏳ 載入中...',
    cancel: '取消',
    confirm: '確認',
  },

  cli: {
    usage: '用法',
    commands: '命令',
    options: '選項',
    examples: '範例',
    moreInfo: '更多資訊',
    subtitle: 'AI 驅動的 Git 工作流助手',
    help: '顯示幫助資訊',
    version: '顯示版本號',
    configDesc: '配置管理 (API Key, 模型等)',
    initConfig: '初始化配置',
  },

  review: {
    starting: '🚀 開始本地程式碼審查...\n',
    foundFiles: '📁 發現 {count} 個檔案需要審查:\n',
    reviewing: '🔍 審查: {file}',
    found: '發現',
    issues: '個問題',
    generating: '📊 生成總結...',
    result: 'Quartz 結果',
    score: '📊 評分',
    summary: '📝 總結',
    statistics: '📋 問題統計',
    error: '錯誤',
    warning: '警告',
    suggestion: '建議',
    total: '總計',
    details: '📝 詳細問題:\n',
    noFiles: '✅ 沒有需要審查的檔案',
    tip: '   提示: 請先修改一些檔案，或使用 --files 指定要審查的檔案',
    saved: '💾 結果已儲存到: {path}\n',
  },

  commit: {
    starting: '🚀 生成 Commit Message...\n',
    foundStaged: '📁 發現 {count} 個已暫存的檔案:\n',
    generating: '🤖 AI 正在生成 commit message...\n',
    generated: '📝 生成的 Commit Message:',
    tips: '💡 提示:',
    autoTip: '   - 使用 --auto 或 -a 自動提交',
    editTip: '   - 使用 --edit 或 -e 在編輯器中修改後提交',
    manualTip: '   - 手動複製上述訊息進行提交\n',
    saved: '💾 Commit message 已儲存到: {path}\n',
    noStaged: '❌ 沒有已暫存的變更',
    useGitAdd: '   請先使用 git add 暫存要提交的檔案',
    success: '\n✅ 提交成功!',
    failed: '❌ 提交失敗',
    cancelled: '\n⚠️  取消提交',
    editMode: '✏️  編輯模式: 請在編輯器中修改 commit message',
  },

  pr: {
    starting: '🚀 生成 Pull Request 描述...\n',
    currentBranch: '📌 當前分支',
    targetBranch: '📌 目標分支',
    repository: '📦 倉庫',
    statistics: '📊 變更統計:',
    commits: '個提交',
    filesChanged: '個檔案變更',
    generating: '💎正在生成 PR 描述...\n',
    generatedTitle: '📝 生成的 PR 標題:',
    generatedBody: '\n📝 生成的 PR 描述:',
    tips: '💡 提示:',
    autoTip: '   - 使用 --auto 或 -a 自動建立 PR',
    ghTip: '   - 使用 --gh 選項透過 GitHub CLI 建立',
    baseTip: '   - 使用 --base <branch> 指定目標分支 (預設: main)',
    manualTip: '   - 或手動複製上述描述到 GitHub 建立 PR\n',
    saved: '💾 PR 描述已儲存到: {path}\n',
    creating: '⚡ 自動建立 PR...\n',
    success: '\n✅ PR 建立成功!',
    failed: '❌ 建立 PR 失敗',
    sameBranch: '❌ 錯誤: 當前分支 ({current}) 與目標分支相同',
    switchBranch: '   請切換到功能分支後再建立 PR',
    noDiff: '❌ 當前分支與 {base} 分支沒有差異',
    ensureBranch: '   請確保 {base} 分支存在',
  },

  scoreLevel: {
    excellent: '優秀',
    good: '良好',
    pass: '及格',
    needImprovement: '需要改進',
  },
  config: {
    usage: '💎 Quartz 配置管理\n\n用法: quartz config <command> [options]',
    commands: '可用命令:',
    listDesc: '列出所有配置',
    setDesc: '設定配置值',
    getDesc: '獲取配置值',
    initDesc: '交互式配置嚮導',
    availableKeys: '可配置項:',
    examples: '範例:',
    current: '\n📋 當前配置:',
    notSet: '❌ {key} 未設定',
    notConfigured: '未配置',
    set: '✅ 已設定 {key}={value}',
    keys: {
      apiKey: 'OpenAI API Key',
      baseUrl: 'OpenAI API 基礎 URL',
      model: 'OpenAI 模型名稱',
      githubToken: 'GitHub Personal Access Token (可選)',
      language: '介面語言',
      promptLanguage: 'AI 提示語言',
    },
    wizard: {
      welcome: '🚀 歡迎使用 Quartz 配置嚮導!\n   我們將幫助你設定必要的配置項。\n',
      apiKey: '請輸入你的 OpenAI API Key: ',
      apiKeyWithCurrent: '請輸入你的 OpenAI API Key (當前: {current}, 回車跳過): ',
      baseUrl: 'OpenAI API 基礎 URL (預設: {default}, 回車使用預設值): ',
      model: 'OpenAI 模型 (預設: {default}, 回車使用預設值): ',
      githubToken: 'GitHub Token (可選, 用於建立 PR, 回車跳過): ',
      githubTokenWithCurrent: 'GitHub Token (當前: {current}, 回車跳過): ',
      language: '選擇介面語言 [zh-CN/zh-TW/ja/ko/en] (預設: {default}, 回車使用預設值): ',
      success: '✅ 配置儲存成功!',
      saved: '💾 配置檔案已儲存到: {path}',
    },
    errors: {
      setUsage: '❌ 用法: quartz config set <key> <value>',
      getUsage: '❌ 用法: quartz config get <key>',
      unknownCommand: '❌ 未知命令: {command}',
      saveProfileUsage: '❌ 用法: quartz config save-profile <name>',
      loadProfileUsage: '❌ 用法: quartz config load-profile <name>',
      deleteProfileUsage: '❌ 用法: quartz config delete-profile <name>',
    },
    profilesDesc: '配置檔案管理',
    profileSaved: '✅ 配置檔案已儲存: {name}',
    profileLoaded: '✅ 配置檔案已載入: {name}',
    profileDeleted: '✅ 配置檔案已刪除: {name}',
    profileNotFound: '❌ 配置檔案不存在: {name}',
    savedProfiles: '已儲存的配置檔案',
    availableProfiles: '可用的配置檔案:',
    noProfiles: '📋 沒有儲存的配置檔案\n   使用 "quartz config save-profile <name>" 儲存當前配置',
    configItems: '項配置',
  },


  errors: {
    noApiKey: '❌ 錯誤: 未設定 OPENAI_API_KEY',
    setApiKey: '   請設定環境變數或在專案根目錄建立 .env 檔案',
    apiFailed: '❌ API 呼叫失敗',
    fileNotFound: '❌ 檔案不存在',
    gitError: '❌ Git 操作失敗',
    networkError: '❌ 網路錯誤',
  },
};

// Japanese
export const ja: Translations = {
  common: {
    success: '✅ 成功',
    error: '❌ エラー',
    warning: '⚠️  警告',
    info: 'ℹ️  情報',
    loading: '⏳ 読み込み中...',
    cancel: 'キャンセル',
    confirm: '確認',
  },

  cli: {
    usage: '使用方法',
    commands: 'コマンド',
    options: 'オプション',
    examples: '例',
    moreInfo: '詳細情報',
    subtitle: 'AI搭載 Git ワークフローアシスタント',
    help: 'ヘルプ情報を表示',
    version: 'バージョン番号を表示',
    configDesc: '設定管理 (API Key, モデルなど)',
    initConfig: '設定を初期化',
  },

  review: {
    starting: '🚀 ローカルコードレビューを開始...\n',
    foundFiles: '📁 {count} 個のファイルをレビュー:\n',
    reviewing: '🔍 レビュー中: {file}',
    found: '発見',
    issues: '個の問題',
    generating: '📊 サマリーを生成中...',
    result: 'AI Code Review 結果',
    score: '📊 スコア',
    summary: '📝 サマリー',
    statistics: '📋 問題統計',
    error: 'エラー',
    warning: '警告',
    suggestion: '提案',
    total: '合計',
    details: '📝 詳細な問題:\n',
    noFiles: '✅ レビューするファイルがありません',
    tip: '   ヒント: まずファイルを変更するか、--files でファイルを指定してください',
    saved: '💾 結果を保存しました: {path}\n',
  },

  commit: {
    starting: '🚀 Commit Message を生成中...\n',
    foundStaged: '📁 {count} 個のステージされたファイル:\n',
    generating: '💎 Quartz が commit message を生成中...\n',
    generated: '📝 生成された Commit Message:',
    tips: '💡 ヒント:',
    autoTip: '   - --auto または -a で自動コミット',
    editTip: '   - --edit または -e でエディタで編集してコミット',
    manualTip: '   - 上記のメッセージを手動でコピーしてコミット\n',
    saved: '💾 Commit message を保存しました: {path}\n',
    noStaged: '❌ ステージされた変更がありません',
    useGitAdd: '   まず git add でファイルをステージしてください',
    success: '\n✅ コミット成功!',
    failed: '❌ コミット失敗',
    cancelled: '\n⚠️  コミットをキャンセルしました',
    editMode: '✏️  編集モード: エディタで commit message を編集してください',
  },

  pr: {
    starting: '🚀 Pull Request 説明を生成中...\n',
    currentBranch: '📌 現在のブランチ',
    targetBranch: '📌 ターゲットブランチ',
    repository: '📦 リポジトリ',
    statistics: '📊 変更統計:',
    commits: '個のコミット',
    filesChanged: '個のファイル変更',
    generating: '💎 Quartz が PR 説明を生成中...\n',
    generatedTitle: '📝 生成された PR タイトル:',
    generatedBody: '\n📝 生成された PR 説明:',
    tips: '💡 ヒント:',
    autoTip: '   - --auto または -a で PR を自動作成',
    ghTip: '   - --gh オプションで GitHub CLI を使用',
    baseTip: '   - --base <branch> でターゲットブランチを指定 (デフォルト: main)',
    manualTip: '   - または上記の説明を GitHub に手動でコピー\n',
    saved: '💾 PR 説明を保存しました: {path}\n',
    creating: '⚡ PR を自動作成中...\n',
    success: '\n✅ PR 作成成功!',
    failed: '❌ PR 作成失敗',
    sameBranch: '❌ エラー: 現在のブランチ ({current}) とターゲットブランチが同じです',
    switchBranch: '   機能ブランチに切り替えてから PR を作成してください',
    noDiff: '❌ 現在のブランチと {base} ブランチに差分がありません',
    ensureBranch: '   {base} ブランチが存在することを確認してください',
  },

  config: {
    usage: '💎 Quartz 設定管理\n\n使用方法: quartz config <command> [options]',
    commands: '利用可能なコマンド:',
    listDesc: 'すべての設定を表示',
    setDesc: '設定値を設定',
    getDesc: '設定値を取得',
    initDesc: '対話型設定ウィザード',
    availableKeys: '設定可能な項目:',
    examples: '例:',
    current: '\n📋 現在の設定:',
    notSet: '❌ {key} は設定されていません',
    notConfigured: '未設定',
    set: '✅ {key}={value} を設定しました',
    keys: {
      apiKey: 'OpenAI API Key',
      baseUrl: 'OpenAI API ベース URL',
      model: 'OpenAI モデル名',
      githubToken: 'GitHub Personal Access Token (オプション)',
      language: 'インターフェース言語',
      promptLanguage: 'AI プロンプト言語',
    },
    wizard: {
      welcome: '🚀 Quartz 設定ウィザードへようこそ!\n   必要な設定項目を設定します。\n',
      apiKey: 'OpenAI API Key を入力してください: ',
      apiKeyWithCurrent: 'OpenAI API Key を入力してください (現在: {current}, Enter でスキップ): ',
      baseUrl: 'OpenAI API ベース URL (デフォルト: {default}, Enter でデフォルト使用): ',
      model: 'OpenAI モデル (デフォルト: {default}, Enter でデフォルト使用): ',
      githubToken: 'GitHub Token (オプション, PR作成用, Enter でスキップ): ',
      githubTokenWithCurrent: 'GitHub Token (現在: {current}, Enter でスキップ): ',
      language: 'インターフェース言語を選択 [zh-CN/zh-TW/ja/ko/en] (デフォルト: {default}, Enter でデフォルト使用): ',
      success: '✅ 設定を保存しました!',
      saved: '💾 設定ファイルを保存しました: {path}',
    },
    errors: {
      setUsage: '❌ 使用方法: quartz config set <key> <value>',
      getUsage: '❌ 使用方法: quartz config get <key>',
      unknownCommand: '❌ 未知のコマンド: {command}',
      saveProfileUsage: '❌ 使用方法: quartz config save-profile <name>',
      loadProfileUsage: '❌ 使用方法: quartz config load-profile <name>',
      deleteProfileUsage: '❌ 使用方法: quartz config delete-profile <name>',
    },
    profilesDesc: '設定プロファイル管理',
    profileSaved: '✅ プロファイルを保存しました: {name}',
    profileLoaded: '✅ プロファイルを読み込みました: {name}',
    profileDeleted: '✅ プロファイルを削除しました: {name}',
    profileNotFound: '❌ プロファイルが見つかりません: {name}',
    savedProfiles: '保存されたプロファイル',
    availableProfiles: '利用可能なプロファイル:',
    noProfiles: '📋 保存されたプロファイルがありません\n   "quartz config save-profile <name>" で現在の設定を保存',
    configItems: '個の設定',
  },

  scoreLevel: {
    excellent: '優秀',
    good: '良好',
    pass: '合格',
    needImprovement: '改善が必要',
  },

  errors: {
    noApiKey: '❌ エラー: OPENAI_API_KEY が設定されていません',
    setApiKey: '   環境変数を設定するか、プロジェクトルートに .env ファイルを作成してください',
    apiFailed: '❌ API 呼び出し失敗',
    fileNotFound: '❌ ファイルが見つかりません',
    gitError: '❌ Git 操作失敗',
    networkError: '❌ ネットワークエラー',
  },
};

// Korean
export const ko: Translations = {
  common: {
    success: '✅ 성공',
    error: '❌ 오류',
    warning: '⚠️  경고',
    info: 'ℹ️  정보',
    loading: '⏳ 로딩 중...',
    cancel: '취소',
    confirm: '확인',
  },

  cli: {
    usage: '사용법',
    commands: '명령어',
    options: '옵션',
    examples: '예제',
    moreInfo: '자세한 정보',
    subtitle: 'AI 기반 Git 워크플로우 어시스턴트',
    help: '도움말 표시',
    version: '버전 표시',
    configDesc: '설정 관리 (API Key, 모델 등)',
    initConfig: '설정 초기화',
  },

  review: {
    starting: '🚀 로컬 코드 리뷰 시작...\n',
    foundFiles: '📁 {count}개의 파일 검토 필요:\n',
    reviewing: '🔍 검토 중: {file}',
    found: '발견됨',
    issues: '개의 문제',
    generating: '📊 요약 생성 중...',
    result: 'AI Code Review 결과',
    score: '📊 점수',
    summary: '📝 요약',
    statistics: '📋 문제 통계',
    error: '오류',
    warning: '경고',
    suggestion: '제안',
    total: '합계',
    details: '📝 상세 문제:\n',
    noFiles: '✅ 검토할 파일이 없습니다',
    tip: '   힌트: 먼저 파일을 수정하거나 --files로 파일을 지정하세요',
    saved: '💾 결과 저장됨: {path}\n',
},

  commit: {
    starting: '🚀 Commit Message 생성 중...\n',
    foundStaged: '📁 {count}개의 스테이징된 파일:\n',
    generating: '💎 Quartz가 commit message 생성 중...\n',
    generated: '📝 생성된 Commit Message:',
    tips: '💡 힌트:',
    autoTip: '   - --auto 또는 -a로 자동 커밋',
    editTip: '   - --edit 또는 -e로 에디터에서 수정 후 커밋',
    manualTip: '   - 위 메시지를 수동으로 복사하여 커밋\n',
    saved: '💾 Commit message 저장됨: {path}\n',
    noStaged: '❌ 스테이징된 변경사항이 없습니다',
    useGitAdd: '   먼저 git add로 파일을 스테이징하세요',
    success: '\n✅ 커밋 성공!',
    failed: '❌ 커밋 실패',
    cancelled: '\n⚠️  커밋 취소됨',
    editMode: '✏️  편집 모드: 에디터에서 commit message를 수정하세요',
  },

  pr: {
    starting: '🚀 Pull Request 설명 생성 중...\n',
    currentBranch: '📌 현재 브랜치',
    targetBranch: '📌 대상 브랜치',
    repository: '📦 저장소',
    statistics: '📊 변경 통계:',
    commits: '개의 커밋',
    filesChanged: '개의 파일 변경',
    generating: '💎 Quartz가 PR 설명 생성 중...\n',
    generatedTitle: '📝 생성된 PR 제목:',
    generatedBody: '\n📝 생성된 PR 설명:',
    tips: '💡 힌트:',
    autoTip: '   - --auto 또는 -a로 PR 자동 생성',
    ghTip: '   - --gh 옵션으로 GitHub CLI 사용',
    baseTip: '   - --base <branch>로 대상 브랜치 지정 (기본값: main)',
    manualTip: '   - 또는 위 설명을 GitHub에 수동으로 복사\n',
    saved: '💾 PR 설명 저장됨: {path}\n',
    creating: '⚡ PR 자동 생성 중...\n',
    success: '\n✅ PR 생성 성공!',
    failed: '❌ PR 생성 실패',
    sameBranch: '❌ 오류: 현재 브랜치 ({current})와 대상 브랜치가 동일합니다',
    switchBranch: '   기능 브랜치로 전환한 후 PR을 생성하세요',
    noDiff: '❌ 현재 브랜치와 {base} 브랜치 간 차이가 없습니다',
    ensureBranch: '   {base} 브랜치가 존재하는지 확인하세요',
  },

  config: {
    usage: '💎 Quartz 설정 관리\n\n사용법: quartz config <command> [options]',
    commands: '사용 가능한 명령어:',
    listDesc: '모든 설정 표시',
    setDesc: '설정값 지정',
    getDesc: '설정값 조회',
    initDesc: '대화형 설정 마법사',
    availableKeys: '설정 가능한 항목:',
    examples: '예제:',
    current: '\n📋 현재 설정:',
    notSet: '❌ {key}가 설정되지 않았습니다',
    notConfigured: '미설정',
    set: '✅ {key}={value} 설정 완료',
    keys: {
      apiKey: 'OpenAI API Key',
      baseUrl: 'OpenAI API 베이스 URL',
      model: 'OpenAI 모델명',
      githubToken: 'GitHub Personal Access Token (선택사항)',
      language: '인터페이스 언어',
      promptLanguage: 'AI 프롬프트 언어',
    },
    wizard: {
      welcome: '🚀 Quartz 설정 마법사에 오신 것을 환영합니다!\n   필요한 설정 항목을 구성합니다.\n',
      apiKey: 'OpenAI API Key를 입력하세요: ',
      apiKeyWithCurrent: 'OpenAI API Key를 입력하세요 (현재: {current}, Enter로 건너뛰기): ',
      baseUrl: 'OpenAI API 베이스 URL (기본값: {default}, Enter로 기본값 사용): ',
      model: 'OpenAI 모델 (기본값: {default}, Enter로 기본값 사용): ',
      githubToken: 'GitHub Token (선택사항, PR 생성용, Enter로 건너뛰기): ',
      githubTokenWithCurrent: 'GitHub Token (현재: {current}, Enter로 건너뛰기): ',
      language: '인터페이스 언어 선택 [zh-CN/zh-TW/ja/ko/en] (기본값: {default}, Enter로 기본값 사용): ',
      success: '✅ 설정이 저장되었습니다!',
      saved: '💾 설정 파일이 저장되었습니다: {path}',
    },
    errors: {
      setUsage: '❌ 사용법: quartz config set <key> <value>',
      getUsage: '❌ 사용법: quartz config get <key>',
      unknownCommand: '❌ 알 수 없는 명령어: {command}',
      saveProfileUsage: '❌ 사용법: quartz config save-profile <name>',
      loadProfileUsage: '❌ 사용법: quartz config load-profile <name>',
      deleteProfileUsage: '❌ 사용법: quartz config delete-profile <name>',
    },
    profilesDesc: '설정 프로필 관리',
    profileSaved: '✅ 프로필이 저장되었습니다: {name}',
    profileLoaded: '✅ 프로필이 로드되었습니다: {name}',
    profileDeleted: '✅ 프로필이 삭제되었습니다: {name}',
    profileNotFound: '❌ 프로필을 찾을 수 없습니다: {name}',
    savedProfiles: '저장된 프로필',
    availableProfiles: '사용 가능한 프로필:',
    noProfiles: '📋 저장된 프로필이 없습니다\n   "quartz config save-profile <name>"으로 현재 설정 저장',
    configItems: '개 설정',
  },

  scoreLevel: {
    excellent: '우수',
    good: '양호',
    pass: '합격',
    needImprovement: '개선 필요',
  },

  errors: {
    noApiKey: '❌ 오류: OPENAI_API_KEY가 설정되지 않았습니다',
    setApiKey: '   환경 변수를 설정하거나 프로젝트 루트에 .env 파일을 생성하세요',
    apiFailed: '❌ API 호출 실패',
    fileNotFound: '❌ 파일을 찾을 수 없습니다',
    gitError: '❌ Git 작업 실패',
    networkError: '❌ 네트워크 오류',
  },
};

// English
export const en: Translations = {
  common: {
    success: '✅ Success',
    error: '❌ Error',
    warning: '⚠️  Warning',
    info: 'ℹ️  Info',
    loading: '⏳ Loading...',
    cancel: 'Cancel',
    confirm: 'Confirm',
  },

  cli: {
    usage: 'Usage',
    commands: 'Commands',
    options: 'Options',
    examples: 'Examples',
    moreInfo: 'More Info',
    subtitle: 'AI-Powered Git Workflow Assistant',
    help: 'Show help information',
    version: 'Show version number',
    configDesc: 'Configuration management (API Key, model, etc.)',
    initConfig: 'Initialize configuration',
  },

  review: {
    starting: '🚀 Starting local code review...\n',
    foundFiles: '📁 Found {count} files to review:\n',
    reviewing: '🔍 Reviewing: {file}',
    found: 'Found',
    issues: 'issues',
    generating: '📊 Generating summary...',
    result: 'Quartz Results',
    score: '📊 Score',
    summary: '📝 Summary',
    statistics: '📋 Issue Statistics',
    error: 'Errors',
    warning: 'Warnings',
    suggestion: 'Suggestions',
    total: 'Total',
    details: '📝 Detailed Issues:\n',
    noFiles: '✅ No files to review',
    tip: '   Tip: Modify some files first, or use --files to specify files',
    saved: '💾 Results saved to: {path}\n',
  },

  commit: {
    starting: '🚀 Generating Commit Message...\n',
    foundStaged: '📁 Found {count} staged files:\n',
    generating: '💎 Quartz is generating commit message...\n',
    generated: '📝 Generated Commit Message:',
    tips: '💡 Tips:',
    autoTip: '   - Use --auto or -a to commit automatically',
    editTip: '   - Use --edit or -e to edit before committing',
    manualTip: '   - Manually copy the message above\n',
    saved: '💾 Commit message saved to: {path}\n',
    noStaged: '❌ No staged changes',
    useGitAdd: '   Please use git add to stage files first',
    success: '\n✅ Commit successful!',
    failed: '❌ Commit failed',
    cancelled: '\n⚠️  Commit cancelled',
    editMode: '✏️  Edit mode: Modify commit message in editor',
  },

  pr: {
    starting: '🚀 Generating Pull Request description...\n',
    currentBranch: '📌 Current branch',
    targetBranch: '📌 Target branch',
    repository: '📦 Repository',
    statistics: '📊 Change statistics:',
    commits: 'commits',
    filesChanged: 'files changed',
    generating: '💎 Quartz is generating PR description...\n',
    generatedTitle: '📝 Generated PR Title:',
    generatedBody: '\n📝 Generated PR Description:',
    tips: '💡 Tips:',
    autoTip: '   - Use --auto or -a to create PR automatically',
    ghTip: '   - Use --gh option to create via GitHub CLI',
    baseTip: '   - Use --base <branch> to specify target (default: main)',
    manualTip: '   - Or manually copy the description to GitHub\n',
    saved: '💾 PR description saved to: {path}\n',
    creating: '⚡ Creating PR automatically...\n',
    success: '\n✅ PR created successfully!',
    failed: '❌ Failed to create PR',
    sameBranch: '❌ Error: Current branch ({current}) same as target',
    switchBranch: '   Please switch to a feature branch first',
    noDiff: '❌ No difference between current and {base} branch',
    ensureBranch: '   Please ensure {base} branch exists',
  },

  scoreLevel: {
    excellent: 'Excellent',
    good: 'Good',
    pass: 'Pass',
    needImprovement: 'Needs Improvement',
  },

  config: {
    usage: '💎 Quartz Configuration Management\n\nUsage: quartz config <command> [options]',
    commands: 'Available Commands:',
    listDesc: 'List all configurations',
    setDesc: 'Set a configuration value',
    getDesc: 'Get a configuration value',
    initDesc: 'Interactive configuration wizard',
    availableKeys: 'Available Keys:',
    examples: 'Examples:',
    current: '\n📋 Current Configuration:',
    notSet: '❌ {key} is not set',
    notConfigured: 'Not configured',
    set: '✅ Set {key}={value}',
    keys: {
      apiKey: 'OpenAI API Key',
      baseUrl: 'OpenAI API Base URL',
      model: 'OpenAI Model Name',
      githubToken: 'GitHub Personal Access Token (optional)',
      language: 'Interface Language',
      promptLanguage: 'AI Prompt Language',
    },
    wizard: {
      welcome: '🚀 Welcome to Quartz Configuration Wizard!\n   We will help you set up the necessary configurations.\n',
      apiKey: 'Enter your OpenAI API Key: ',
      apiKeyWithCurrent: 'Enter your OpenAI API Key (current: {current}, press Enter to skip): ',
      baseUrl: 'OpenAI API Base URL (default: {default}, press Enter for default): ',
      model: 'OpenAI Model (default: {default}, press Enter for default): ',
      githubToken: 'GitHub Token (optional, for creating PRs, press Enter to skip): ',
      githubTokenWithCurrent: 'GitHub Token (current: {current}, press Enter to skip): ',
      language: 'Choose interface language [zh-CN/zh-TW/ja/ko/en] (default: {default}, press Enter for default): ',
      success: '✅ Configuration saved successfully!',
      saved: '💾 Configuration saved to: {path}',
    },
    errors: {
      setUsage: '❌ Usage: quartz config set <key> <value>',
      getUsage: '❌ Usage: quartz config get <key>',
      unknownCommand: '❌ Unknown command: {command}',
      saveProfileUsage: '❌ Usage: quartz config save-profile <name>',
      loadProfileUsage: '❌ Usage: quartz config load-profile <name>',
      deleteProfileUsage: '❌ Usage: quartz config delete-profile <name>',
    },
    profilesDesc: 'Configuration profile management',
    profileSaved: '✅ Profile saved: {name}',
    profileLoaded: '✅ Profile loaded: {name}',
    profileDeleted: '✅ Profile deleted: {name}',
    profileNotFound: '❌ Profile not found: {name}',
    savedProfiles: 'Saved Profiles',
    availableProfiles: 'Available profiles:',
    noProfiles: '📋 No saved profiles\n   Use "quartz config save-profile <name>" to save current configuration',
    configItems: 'config items',
  },

  errors: {
    noApiKey: '❌ Error: OPENAI_API_KEY is not set',
    setApiKey: '   Please set environment variable or create .env file',
    apiFailed: '❌ API call failed',
    fileNotFound: '❌ File not found',
    gitError: '❌ Git operation failed',
    networkError: '❌ Network error',
  },
};

// Language mapping
export const locales: Record<Language, Translations> = {
  'zh-CN': zhCN,
  'zh-TW': zhTW,
  'ja': ja,
  'ko': ko,
  'en': en,
};

// Default language
export const defaultLanguage: Language = 'en';