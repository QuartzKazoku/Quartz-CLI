# 运行时配置注入 (Runtime Configuration Injection)

## 概述

Quartz CLI 支持通过环境变量在运行时覆盖配置文件中的设置。这对于 CI/CD 环境特别有用，可以避免在代码库中存储敏感信息，同时保持配置的灵活性。

## 配置优先级

配置加载遵循以下优先级顺序（从高到低）：

```
环境变量 > 配置文件 > 默认值
```

1. **环境变量** - 最高优先级，适用于 CI/CD 和临时覆盖
2. **配置文件** - 中等优先级，存储在 `~/.quartz/quartz.jsonc`
3. **默认值** - 最低优先级，内置的回退值

## 支持的环境变量

所有 Quartz 环境变量都使用 `QUARTZ_` 前缀：

### OpenAI 配置

| 环境变量 | 对应配置项 | 说明 | 示例 |
|---------|----------|------|------|
| `QUARTZ_OPENAI_API_KEY` | `openai.apiKey` | OpenAI API 密钥 | `sk-proj-xxx` |
| `QUARTZ_OPENAI_BASE_URL` | `openai.baseUrl` | OpenAI API 端点 | `https://api.openai.com/v1` |
| `QUARTZ_OPENAI_MODEL` | `openai.model` | 使用的模型名称 | `gpt-5` |

### 平台配置

| 环境变量 | 对应配置项 | 说明 | 示例 |
|---------|----------|------|------|
| `QUARTZ_GITHUB_TOKEN` | `platforms[].token` | GitHub 访问令牌 | `ghp_xxx` |
| `QUARTZ_GITLAB_TOKEN` | `platforms[].token` | GitLab 访问令牌 | `glpat-xxx` |
| `QUARTZ_GITLAB_URL` | `platforms[].url` | GitLab 实例 URL | `https://gitlab.com` |

### 语言配置

| 环境变量 | 对应配置项 | 说明 | 示例 |
|---------|----------|------|------|
| `QUARTZ_LANG` | `language.ui` | 界面语言 | `en`, `zh-CN` |
| `QUARTZ_PROMPT_LANG` | `language.prompt` | AI 提示语言 | `en`, `zh-CN` |

## 使用场景

### 场景 1: GitHub Actions CI/CD

在 GitHub Actions 中使用 secrets 注入配置：

```yaml
name: Quartz CI

on: [push, pull_request]

jobs:
  code-review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install Quartz CLI
        run: npm install -g @quartz/cli
      
      - name: Run Code Review
        env:
          QUARTZ_OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          QUARTZ_GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          QUARTZ_OPENAI_MODEL: gpt-5
          QUARTZ_LANG: zh-CN
        run: quartz review
```

### 场景 2: GitLab CI/CD

在 GitLab CI 中使用变量注入配置：

```yaml
# .gitlab-ci.yml
stages:
  - review

code-review:
  stage: review
  image: node:18
  variables:
    QUARTZ_OPENAI_API_KEY: $OPENAI_API_KEY
    QUARTZ_GITLAB_TOKEN: $GITLAB_TOKEN
    QUARTZ_GITLAB_URL: $CI_SERVER_URL
    QUARTZ_OPENAI_MODEL: gpt-5
  script:
    - npm install -g @quartz/cli
    - quartz review
  only:
    - merge_requests
```

### 场景 3: Docker 容器

在 Docker 中运行时注入配置：

```bash
docker run -e QUARTZ_OPENAI_API_KEY=sk-xxx \
           -e QUARTZ_GITHUB_TOKEN=ghp_xxx \
           -e QUARTZ_OPENAI_MODEL=gpt-5 \
           quartz-cli quartz commit
```

或使用 `.env` 文件：

```bash
# .env
QUARTZ_OPENAI_API_KEY=sk-xxx
QUARTZ_GITHUB_TOKEN=ghp_xxx
QUARTZ_OPENAI_MODEL=gpt-5
QUARTZ_LANG=zh-CN
```

```bash
docker run --env-file .env quartz-cli quartz commit
```

### 场景 4: 本地开发多环境切换

使用不同的环境变量快速切换配置：

```bash
# 工作项目使用公司 GitLab
export QUARTZ_GITLAB_TOKEN=glpat-company-xxx
export QUARTZ_GITLAB_URL=https://gitlab.company.com
quartz commit

# 个人项目使用 GitHub
export QUARTZ_GITHUB_TOKEN=ghp-personal-xxx
unset QUARTZ_GITLAB_TOKEN
quartz commit
```

### 场景 5: 临时覆盖特定配置

临时使用不同的模型或 API：

```bash
# 临时使用不同的模型
QUARTZ_OPENAI_MODEL=gpt-4-turbo quartz review

# 临时使用不同的 API 端点
QUARTZ_OPENAI_BASE_URL=https://custom-api.com/v1 quartz commit
```

## 命令行工具

### 查看当前配置

查看最终生效的配置（包括运行时覆盖）：

```bash
quartz config list
```

输出示例：
```
🔧 Detected runtime configuration overrides: QUARTZ_OPENAI_API_KEY, QUARTZ_GITHUB_TOKEN

   ██████╗ ██╗   ██╗ █████╗ ██████╗ ████████╗███████╗
  ...
  
  Current Configuration
  ──────────────────────────────────────────────────
  
     🔑  API Key
        sk-proj***
  
  ...
  
  📋 Configuration Source Analysis:
  
    ✓ OpenAI API Key: Environment Variable (QUARTZ_OPENAI_API_KEY)
    ○ OpenAI Base URL: Config File
    ○ OpenAI Model: Config File
    ✓ GitHub Token: Environment Variable (QUARTZ_GITHUB_TOKEN)
```

### 查看运行时配置详情

专门查看环境变量覆盖情况：

```bash
quartz config runtime
# 或
quartz config env
```

### 导出环境变量模板

生成环境变量配置模板：

```bash
quartz config runtime > .env.example
```

## 最佳实践

### 1. 安全性

- ❌ **不要** 在代码中硬编码敏感信息
- ✅ **使用** CI/CD 平台的 secrets 管理功能
- ✅ **使用** `.env` 文件（但要添加到 `.gitignore`）
- ✅ **使用** 密钥管理服务（如 AWS Secrets Manager, HashiCorp Vault）

### 2. 配置管理

```bash
# .gitignore
.env
.env.local
.quartz/quartz.jsonc
```

### 3. 分层配置策略

**推荐的配置分层：**

1. **配置文件** - 存储非敏感的默认值
   ```jsonc
   {
     "default": {
       "config": {
         "openai": {
           "baseUrl": "https://api.openai.com/v1",
           "model": "gpt-5"
         },
         "language": {
           "ui": "zh-CN",
           "prompt": "zh-CN"
         }
       }
     }
   }
   ```

2. **环境变量** - 覆盖敏感信息和环境特定配置
   ```bash
   export QUARTZ_OPENAI_API_KEY=sk-xxx
   export QUARTZ_GITHUB_TOKEN=ghp_xxx
   ```

### 4. CI/CD 配置模板

创建可复用的配置模板：

```yaml
# .github/workflows/quartz-template.yml
name: Quartz Template

on:
  workflow_call:
    inputs:
      model:
        required: false
        type: string
        default: 'gpt-5'
      language:
        required: false
        type: string
        default: 'en'
    secrets:
      openai_api_key:
        required: true
      github_token:
        required: true

jobs:
  run-quartz:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Quartz
        env:
          QUARTZ_OPENAI_API_KEY: ${{ secrets.openai_api_key }}
          QUARTZ_GITHUB_TOKEN: ${{ secrets.github_token }}
          QUARTZ_OPENAI_MODEL: ${{ inputs.model }}
          QUARTZ_LANG: ${{ inputs.language }}
        run: |
          npm install -g @quartz/cli
          quartz review
```

## 故障排查

### 问题：环境变量不生效

**检查步骤：**

1. 验证环境变量已设置：
   ```bash
   echo $QUARTZ_OPENAI_API_KEY
   ```

2. 检查变量名拼写是否正确（区分大小写）

3. 查看配置源分析：
   ```bash
   quartz config list
   ```

### 问题：配置优先级不清楚

使用 `quartz config runtime` 查看所有激活的环境变量覆盖。

### 问题：CI/CD 中配置失败

1. 确认 secrets 已正确配置在 CI/CD 平台
2. 检查环境变量是否正确传递到命令执行环境
3. 使用 `quartz config runtime` 在 CI 中调试

## API 使用

如果你在代码中使用 Quartz，可以通过 API 控制运行时配置：

```typescript
import { getConfigManager } from '@quartz/cli/manager/config';
import { getRuntimeConfig, hasRuntimeConfig } from '@quartz/cli/utils/runtime-config';

const configManager = getConfigManager();

// 检查是否有运行时覆盖
if (configManager.hasRuntimeOverrides()) {
    console.log('Runtime overrides detected');
}

// 获取基础配置（不包含运行时覆盖）
const baseConfig = configManager.readBaseConfig();

// 获取最终配置（包含运行时覆盖）
const finalConfig = configManager.readRuntimeConfig();

// 手动应用运行时覆盖
const config = configManager.readConfig(); // 默认包含运行时覆盖
const configWithoutOverrides = configManager.readConfig(undefined, false);
```

## 环境变量完整列表

生成当前支持的所有环境变量列表：

```bash
quartz config runtime
```

或查看完整示例：

```bash
# Quartz CLI Runtime Configuration
# Set these environment variables in your CI/CD pipeline

# OpenAI Configuration
QUARTZ_OPENAI_API_KEY=sk-your-api-key-here
QUARTZ_OPENAI_BASE_URL=https://api.openai.com/v1
QUARTZ_OPENAI_MODEL=gpt-5

# GitHub Configuration
QUARTZ_GITHUB_TOKEN=ghp_your-github-token-here

# GitLab Configuration
QUARTZ_GITLAB_TOKEN=glpat-your-gitlab-token-here
QUARTZ_GITLAB_URL=https://gitlab.com

# Language Configuration
QUARTZ_LANG=en
QUARTZ_PROMPT_LANG=en
```

## 相关文档

- [配置管理](./CONFIGURATION.md)
- [CI/CD 集成指南](./CICD_INTEGRATION.md)
- [安全最佳实践](./SECURITY.md)

## 更新日志

- **v1.0.0** - 初始版本，支持基本的运行时配置注入