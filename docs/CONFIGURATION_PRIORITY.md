
# 配置优先级系统

## 概述

Quartz CLI 现在支持多层级配置系统,配置优先级从高到低为:

```
环境变量 > 项目配置 > 全局配置 > 默认配置
```

## 配置层级说明

### 1. 默认配置 (最低优先级)

系统内置的默认配置,当其他配置层级都不存在时使用。

```json
{
  "openai": {
    "apiKey": "",
    "baseUrl": "https://api.openai.com/v1",
    "model": "gpt-5"
  },
  "platforms": [],
  "language": {
    "ui": "en",
    "prompt": "en"
  }
}
```

### 2. 全局配置

位于用户主目录: `~/.quartz/quartz.jsonc`

- 适用于所有项目的通用配置
- 作为所有项目的默认配置基础
- 可以包含常用的 API Key、默认模型等

#### 初始化全局配置

```bash
quartz config init --global
```

#### 设置全局配置

```bash
quartz config set OPENAI_API_KEY sk-your-global-key --global
quartz config set OPENAI_MODEL gpt-4 --global
```

### 3. 项目配置

位于项目目录: `./.quartz/quartz.jsonc`

- 仅适用于当前项目
- 会覆盖全局配置中的相同字段
- 空字符串值会被忽略,继续使用全局配置或默认值

#### 初始化项目配置

```bash
quartz init
quartz config init
```

#### 设置项目配置

```bash
quartz config set OPENAI_API_KEY sk-your-project-key
quartz config set GITHUB_TOKEN ghp-your-token
```

### 4. 环境变量 (最高优先级)

通过环境变量设置的配置,适用于 CI/CD 等场景。

支持的环境变量:

```bash
# OpenAI 配置
QUARTZ_OPENAI_API_KEY=sk-your-key
QUARTZ_OPENAI_BASE_URL=https://api.openai.com/v1
QUARTZ_OPENAI_MODEL=gpt-4

# GitHub 配置
QUARTZ_GITHUB_TOKEN=ghp-your-token

# GitLab 配置
QUARTZ_GITLAB_TOKEN=glpat-your-token
QUARTZ_GITLAB_URL=https://gitlab.com

# 语言配置
QUARTZ_LANG=zh-CN
QUARTZ_PROMPT_LANG=en
```

## 使用场景

### 场景 1: 个人开发者(推荐使用全局配置)

```bash
# 1. 一次性设置全局配置
quartz config init --global
quartz config set OPENAI_API_KEY sk-your-personal-key --global
quartz config set OPENAI_MODEL gpt-4 --global
quartz config set GITHUB_TOKEN ghp-your-token --global

# 2. 在任何项目中直接使用(无需 quartz init)
cd my-project
quartz commit  # 自动使用全局配置
quartz pr      # 自动使用全局配置

# 注意: 不需要在每个项目中执行 quartz init
# 全局配置会自动应用到所有项目
```

**优势**: 一次配置,所有项目通用,无需为每个项目单独初始化。

### 场景 2: 多项目需要不同配置

```bash
# 1. 设置全局配置作为默认值
quartz config init --global
quartz config set OPENAI_API_KEY sk-personal-key --global
quartz config set GITHUB_TOKEN ghp-personal-token --global

# 2. 大多数项目直接使用全局配置
cd personal-project
quartz commit  # 使用全局配置

# 3. 特定项目需要不同配置时才创建项目配置
cd work-project
quartz init    # 创建项目配置(会提示全局配置已存在)
quartz config init  # 配置向导
quartz config set OPENAI_API_KEY sk-company-key
quartz config set GITLAB_TOKEN glpat-company-token
quartz config set GITLAB_URL https://gitlab.company.com
```

**何时需要项目配置**:
- 项目使用不同的 API Key
- 项目使用不同的 Git 平台(如 GitLab vs GitHub)
- 项目需要特定的模型或 base URL

### 场景 3: CI/CD 环境

```bash
# 在 CI/CD 中使用环境变量(不需要配置文件)
export QUARTZ_OPENAI_API_KEY=sk-ci-key
export QUARTZ_GITHUB_TOKEN=ghp-ci-token

quartz commit  # 使用环境变量配置
```

### 场景 4: 临时覆盖配置(不修改配置文件)

```bash
# 临时使用不同的 API Key
QUARTZ_OPENAI_API_KEY=sk-temp-key quartz commit

# 临时使用不同的模型
QUARTZ_OPENAI_MODEL=gpt-4-turbo quartz pr

# 临时使用不同的 GitHub Token
QUARTZ_GITHUB_TOKEN=ghp-temp-token quartz branch
```

**优势**: 不修改配置文件,适合测试或一次性操作。

## 配置合并规则

配置合并遵循以下规则:

1. **非空覆盖**: 只有非空字符串才会覆盖低优先级配置
2. **平台配置**: 平台配置数组在项目配置中非空时会完全替换全局配置
3. **部分覆盖**: 可以只覆盖部分字段,其他字段继承低优先级配置

### 示例

**全局配置** (`~/.quartz/quartz.jsonc`):
```json
{
  "openai": {
    "apiKey": "sk-global-key",
    "baseUrl": "https://api.openai.com/v1",
    "model": "gpt-4"
  },
  "platforms": [
    {"type": "github", "token": "ghp-global-token"}
  ],
  "language": {
    "ui": "en",
    "prompt": "en"
  }
}
```

**项目配置** (`./.quartz/quartz.jsonc`):
```json
{
  "openai": {
    "apiKey": "sk-project-key",
    "baseUrl": "",
    "model": ""
  },
  "platforms": [],
  "language": {
    "ui": "zh-CN",
    "prompt": ""
  }
}
```

**最终生效配置**:
```json
{
  "openai": {
    "apiKey": "sk-project-key",        // 来自项目配置
    "baseUrl": "https://api.openai.com/v1",  // 来自全局配置(项目为空)
    "model": "gpt-4"                   // 来自全局配置(项目为空)
  },
  "platforms": [
    {"type": "github", "token": "ghp-global-token"}  // 来自全局配置(项目为空数组)
  ],
  "language": {
    "ui": "zh-CN",                     // 来自项目配置
    "prompt": "en"                     // 来自全局配置(项目为空)
  }
}
```

## 查看配置

### 查看当前生效配置

```bash
quartz config list
```

输出示例:
```
📊 Priority: Environment > Project > Global > Default

📁 Active Configuration Sources:
  ✓ Global Config
  ✓ Default Config

🔑 OpenAI API Key
   sk-***

🌐 OpenAI Base URL
   https://api.openai.com/v1

🤖 OpenAI Model
   gpt-4

...

📄 Global:  /Users/username/.quartz/quartz.jsonc
```

### 查看运行时配置

```bash
quartz config runtime
```

显示环境变量覆盖情况。

## 配置文件位置

| 配置类型 | Linux/macOS | Windows |
|---------|-------------|---------|
| 全局配置 | `~/.quartz/quartz.jsonc` | `C:\Users\{用户}\.quartz\quartz.jsonc` |
| 项目配置 | `./.quartz/quartz.jsonc` | `.\.quartz\quartz.jsonc` |

## 最佳实践

### 1. 首选全局配置

**推荐做法**:
```bash
# 首次使用 Quartz CLI
quartz config init --global
quartz config set OPENAI_API_KEY sk-your-key --global
quartz config set GITHUB_TOKEN ghp-your-token --global

# 之后在任何项目中直接使用,无需 quartz init
cd any-project
quartz commit
```

**优势**:
- ✓ 一次配置,全局生效
- ✓ 减少重复配置
- ✓ 简化项目设置流程
- ✓ 避免配置文件同步问题

### 2. 何时使用项目配置

**仅在以下情况下创建项目配置**:
- 项目需要不同的 API Key
- 项目使用不同的 Git 平台
- 项目需要特定的 OpenAI 模型
- 团队协作需要统一配置(通过模板)

### 3. 环境变量的使用时机

- CI/CD 管道
- 容器化部署
- 临时测试不同配置
- 敏感信息不便存储在文件中

### 4. 安全性建议

- ✓ 将 `.quartz/quartz.jsonc` 添加到 `.gitignore`
- ✓ 不要提交包含敏感信息的配置文件到版本控制
- ✓ 在 CI/CD 中使用加密的环境变量
- ✓ 定期轮换 API Key 和 Token
- ✓ 使用只读 Token(如果平台支持)

### 5. 团队协作

**方案 1: 全局配置 + 环境变量**
```bash
# 每个开发者设置自己的全局配置
quartz config init --global
quartz config set OPENAI_API_KEY sk-personal-key --global

# 项目不需要配置文件
# .gitignore 中忽略 .quartz/
```

**方案 2: 项目配置模板**
```bash
# 提供配置模板
cp .quartz/quartz.example.jsonc .quartz/quartz.jsonc
# 开发者填写自己的密钥

# .gitignore
.quartz/quartz.jsonc
```

## 快速开始指南

### 新用户推荐流程

```bash
# Step 1: 安装 Quartz CLI
npm install -g quartz-cli

# Step 2: 设置全局配置(一次性)
quartz config init --global

# Step 3: 配置 API Key 和 Token
quartz config set OPENAI_API_KEY sk-your-key --global
quartz config set GITHUB_TOKEN ghp-your-token --global

# Step 4: 在任何项目中使用
cd your-project
quartz commit
quartz pr
quartz branch

# 无需在每个项目中执行 quartz init
```

### 已有用户迁移指南

如果你已经在使用 Quartz CLI,现有的项目配置会继续工作。

**可选迁移步骤**(推荐):

```bash
# 1. 查看当前项目配置
cd your-project
quartz config list

# 2. 将通用配置迁移到全局
quartz config init --global
quartz config set OPENAI_API_KEY sk-your-key --global
quartz config set OPENAI_MODEL gpt-4 --global
quartz config set GITHUB_TOKEN ghp-your-token --global

# 3. 测试全局配置是否生效
cd another-project
quartz commit  # 应该能正常工作

# 4. (可选)清理项目配置
# 如果项目不需要特殊配置,可以删除 .quartz/ 目录
cd your-project
rm -rf .quartz/

# 5. 验证使用全局配置
quartz commit  # 应该使用全局配置
```

## 常见问题 FAQ

### Q: 是否必须执行 `quartz init`?

**A**: 不是必须的。
- 如果你设置了全局配置,可以直接使用 Quartz 命令
- 只有需要项目特定配置时才需要 `quartz init`

### Q: 什么时候需要项目配置?

**A**: 以下情况需要:
- 项目使用不同的 API Key 或 Token
- 项目使用不同的 Git 平台(GitHub/GitLab)
- 项目需要特定的 OpenAI 模型或 base URL
- 团队协作需要共享配置模板

### Q: 全局配置和项目配置有什么区别?

**A**:
- **全局配置** (`~/.quartz/quartz.jsonc`): 影响所有项目
- **项目配置** (`./.quartz/quartz.jsonc`): 仅影响当前项目,会覆盖全局配置

### Q: 如何知道当前使用的是哪个配置?

**A**: 使用 `quartz config list` 查看配置源和生效的配置值。

### Q: 配置不生效怎么办?

**A**: 
1. 检查配置优先级: 环境变量 > 项目 > 全局 > 默认
2. 使用 `quartz config list` 查看实际生效的配置
3. 使用 `quartz config runtime` 查看环境变量覆盖
4. 确认配置文件格式正确(JSON 格式)

### Q: 可以同时使用全局配置和项目配置吗?

**A**: 可以。项目配置会覆盖全局配置,未设置的字段会继承全局配置。

### Q: 如何在 CI/CD 中使用?

**A**: 推荐使用环境变量,无需配置文件:
```bash
export QUARTZ_OPENAI_API_KEY=sk-ci-key
export QUARTZ_GITHUB_TOKEN=ghp-ci-token
quartz commit
```

## API 使用

在代码中使用配置管理器:

```typescript
import {getConfigManager} from '@/manager/config';

const configManager = getConfigManager();

// 读取配置(自动应用优先级)
const config = configManager.readConfig();

// 读取不含环境变量覆盖的配置
const baseConfig = configManager.readConfig(undefined, false);

// 检查配置是否存在
const hasGlobal = configManager.globalConfigExists();
const hasProject = configManager.projectConfigExists();

// 写入配置
configManager.writeConfig(config, undefined, true);  // 写入全局配置
configManager.writeConfig(config, undefined, false); // 写入项目配置
```
