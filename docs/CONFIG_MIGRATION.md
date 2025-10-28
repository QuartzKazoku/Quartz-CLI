# 配置结构优化说明

## 概述

Quartz CLI 的配置结构已经过重大优化,主要改进包括:

1. **结构化配置**: 采用更清晰的层次结构
2. **多平台支持**: 可同时配置多个代码托管平台
3. **策略模式**: 使用策略模式重构平台相关代码,便于扩展

## 新配置结构

### 配置文件格式

```json
{
  "default": {
    "name": "default",
    "config": {
      "openai": {
        "apiKey": "sk-xxx",
        "baseUrl": "https://api.openai.com/v1",
        "model": "gpt-4-turbo-preview"
      },
      "platforms": [
        {
          "type": "github",
          "token": "ghp-xxx"
        },
        {
          "type": "gitlab.ts",
          "url": "https://gitlab.com",
          "token": "glpat-xxx"
        }
      ],
      "language": {
        "ui": "zh-CN",
        "prompt": "en"
      }
    }
  }
}
```

### 配置层次

#### 1. OpenAI 配置 (`openai`)
```typescript
{
  "apiKey": string,    // OpenAI API密钥
  "baseUrl": string,   // API基础URL
  "model": string      // 使用的模型
}
```

#### 2. 平台配置 (`platforms`)
支持配置多个代码托管平台:

```typescript
[
  {
    "type": "github" | "gitlab.ts",  // 平台类型
    "url"?: string,                // 可选:自定义URL(用于私有部署)
    "token": string                // 平台访问令牌
  }
]
```

**特点**:
- 可同时配置 GitHub 和 GitLab
- GitLab 支持自定义 URL,适用于私有部署
- 自动根据仓库URL选择对应平台

#### 3. 语言配置 (`language`)
```typescript
{
  "ui": string,      // UI语言 (原 QUARTZ_LANG)
  "prompt": string   // Prompt语言 (原 PROMPT_LANG)
}
```

## 从旧版本迁移

### 旧配置格式
```json
{
  "default": {
    "configs": {
      "OPENAI_API_KEY": "sk-xxx",
      "OPENAI_BASE_URL": "https://api.openai.com/v1",
      "OPENAI_MODEL": "gpt-4-turbo-preview",
      "GIT_PLATFORM": "github",
      "GITHUB_TOKEN": "ghp-xxx",
      "GITLAB_TOKEN": "glpat-xxx",
      "GITLAB_URL": "https://gitlab.com",
      "QUARTZ_LANG": "zh-CN",
      "PROMPT_LANG": "en"
    }
  }
}
```

### 自动迁移

配置系统会**自动检测和转换**旧格式配置,无需手动操作。首次读取旧格式配置时会自动转换为新格式。

### 手动迁移

如果需要手动迁移,可以:

1. 备份现有 `quartz.json`
2. 运行 `quartz config init` 重新初始化配置
3. 按照向导输入配置信息

## 使用策略模式

### 代码架构改进

新架构使用策略模式处理不同平台:

```typescript
// 平台策略接口
interface PlatformStrategy {
  createPullRequest(...): Promise<PullRequestResult>;
  isBranchOnRemote(branch: string): Promise<boolean>;
  pushBranchToRemote(branch: string): Promise<void>;
}

// GitHub 实现
class GitHubStrategy implements PlatformStrategy { ... }

// GitLab 实现
class GitLabStrategy implements PlatformStrategy { ... }

// 工厂模式创建策略
const strategy = PlatformStrategyFactory.create(platformConfig);
```

### 优势

1. **解耦**: 平台相关逻辑独立封装
2. **可扩展**: 新增平台只需实现接口
3. **可维护**: 每个平台的逻辑清晰独立
4. **可测试**: 易于单元测试

## 多平台工作流

### 场景 1: 同时使用 GitHub 和 GitLab

```json
{
  "platforms": [
    {
      "type": "github",
      "token": "ghp-xxx"
    },
    {
      "type": "gitlab.ts",
      "url": "https://gitlab.company.com",
      "token": "glpat-xxx"
    }
  ]
}
```

工具会根据当前仓库的 remote URL 自动选择对应平台。

### 场景 2: 多个 GitLab 实例

```json
{
  "platforms": [
    {
      "type": "gitlab.ts",
      "url": "https://gitlab.com",
      "token": "glpat-public-xxx"
    },
    {
      "type": "gitlab.ts",
      "url": "https://gitlab.company.com",
      "token": "glpat-company-xxx"
    }
  ]
}
```

## 配置命令

### 设置配置
```bash
# OpenAI 配置
quartz config set OPENAI_API_KEY sk-xxx
quartz config set OPENAI_BASE_URL https://api.openai.com/v1
quartz config set OPENAI_MODEL gpt-4-turbo-preview

# 平台 Token
quartz config set GITHUB_TOKEN ghp-xxx
quartz config set GITLAB_TOKEN glpat-xxx
quartz config set GITLAB_URL https://gitlab.com

# 语言配置
quartz config set QUARTZ_LANG zh-CN
quartz config set PROMPT_LANG en
```

### 查看配置
```bash
# 查看所有配置
quartz config list

# 查看特定配置
quartz config get OPENAI_API_KEY
```

### 配置向导
```bash
# 交互式配置
quartz config init
```

## 向后兼容性

- ✅ 旧版配置文件可以正常读取
- ✅ 自动转换为新格式
- ✅ 命令行接口保持不变
- ✅ `GIT_PLATFORM` 字段已废弃(会显示警告)

## 文件结构

```
cli/
├── types/
│   └── config.ts           # 配置类型定义
├── strategies/
│   └── platform.ts         # 平台策略实现
├── utils/
│   └── config.ts           # 配置读写逻辑
└── commands/
    ├── config.ts           # 配置命令
    └── pr.ts               # 使用策略模式的PR命令
```

## 扩展新平台

要添加新的代码托管平台支持:

1. 在 `cli/types/config.ts` 中添加平台类型
2. 在 `cli/strategies/platform.ts` 中实现策略类
3. 在工厂方法中注册新平台

示例:
```typescript
// 1. 添加类型
export interface PlatformConfig {
  type: 'github' | 'gitlab.ts' | 'bitbucket';  // 添加新类型
  url?: string;
  token: string;
}

// 2. 实现策略
class BitbucketStrategy implements PlatformStrategy {
  // 实现接口方法
}

// 3. 注册到工厂
static create(config: PlatformConfig): PlatformStrategy {
  switch (config.type) {
    case 'github': return new GitHubStrategy(config);
    case 'gitlab.ts': return new GitLabStrategy(config);
    case 'bitbucket': return new BitbucketStrategy(config);  // 新增
  }
}
```

## 总结

新的配置结构提供了:
- ✨ 更清晰的配置组织
- 🚀 多平台同时支持
- 🔧 更易于维护和扩展
- 📦 完全向后兼容
- 🎯 策略模式带来的架构优势

如有问题或建议,欢迎提issue!