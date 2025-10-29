# Quartz CLI 运行时配置注入实现说明

## 概述

本项目已实现完整的运行时配置注入功能，支持通过环境变量在 CI/CD 环境中覆盖配置文件的设置。

## 实现架构

### 配置优先级

```
环境变量 (最高) > 配置文件 (中等) > 默认值 (最低)
```

### 核心模块

#### 1. 运行时配置工具 (`utils/runtime-config.ts`)

提供运行时配置注入的核心功能：

**主要功能：**
- `getRuntimeConfig()` - 应用环境变量覆盖到基础配置
- `hasRuntimeConfig()` - 检测是否存在运行时覆盖
- `getActiveRuntimeVars()` - 获取所有激活的环境变量
- `validateRuntimeConfig()` - 验证运行时配置的完整性
- `getEnvOnlyConfig()` - 仅从环境变量构建配置（无配置文件）
- `logConfigurationSource()` - 显示配置来源分析
- `generateEnvExample()` - 生成环境变量示例

**环境变量映射：**
```typescript
QUARTZ_OPENAI_API_KEY    -> config.openai.apiKey
QUARTZ_OPENAI_BASE_URL   -> config.openai.baseUrl
QUARTZ_OPENAI_MODEL      -> config.openai.model
QUARTZ_GITHUB_TOKEN      -> config.platforms[github].token
QUARTZ_GITLAB_TOKEN      -> config.platforms[gitlab].token
QUARTZ_GITLAB_URL        -> config.platforms[gitlab].url
QUARTZ_LANG              -> config.language.ui
QUARTZ_PROMPT_LANG       -> config.language.prompt
```

#### 2. 配置管理器增强 (`manager/config.ts`)

扩展了 [`ConfigManager`](manager/config.ts:17) 类以支持运行时覆盖：

**新增方法：**
- [`readConfig(profileName?, applyRuntimeOverrides?)`](manager/config.ts:178) - 读取配置，可选择是否应用运行时覆盖
- [`hasRuntimeOverrides()`](manager/config.ts:627) - 检查是否有运行时覆盖
- [`readBaseConfig(profileName?)`](manager/config.ts:633) - 读取基础配置（无覆盖）
- [`readRuntimeConfig(profileName?)`](manager/config.ts:641) - 读取运行时配置（含覆盖）

**默认行为：**
- [`readConfig()`](manager/config.ts:178) 默认会应用运行时覆盖（`applyRuntimeOverrides=true`）
- 这确保所有命令默认支持环境变量注入

#### 3. 配置命令增强 (`app/commands/config.ts`)

增强了配置命令以显示运行时覆盖信息：

**新增功能：**
- `quartz config list` - 现在会显示运行时覆盖状态和配置源分析
- `quartz config runtime` - 新命令，专门显示运行时配置详情
- `quartz config env` - `runtime` 命令的别名

**改进：**
- [`listConfig()`](app/commands/config.ts:161) 函数现在显示：
  - 激活的运行时覆盖数量
  - 配置源分析（哪些值来自环境变量）
- [`showRuntimeConfig()`](app/commands/config.ts:685) 新函数显示：
  - 所有激活的环境变量
  - 环境变量示例

## 使用示例

### 场景 1: GitHub Actions CI/CD

```yaml
name: Code Review
on: [pull_request]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Quartz Review
        env:
          QUARTZ_OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          QUARTZ_GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          QUARTZ_OPENAI_MODEL: gpt-5
        run: |
          npm install -g quartz-cli
          quartz review
```

### 场景 2: GitLab CI/CD

```yaml
code-review:
  stage: review
  variables:
    QUARTZ_OPENAI_API_KEY: $OPENAI_API_KEY
    QUARTZ_GITLAB_TOKEN: $GITLAB_TOKEN
    QUARTZ_GITLAB_URL: $CI_SERVER_URL
  script:
    - quartz review
  only:
    - merge_requests
```

### 场景 3: 本地开发

```bash
# 设置环境变量
export QUARTZ_OPENAI_API_KEY=sk-xxx
export QUARTZ_GITHUB_TOKEN=ghp_xxx

# 运行命令（自动使用环境变量）
quartz commit

# 查看配置源
quartz config list

# 查看运行时覆盖详情
quartz config runtime
```

### 场景 4: Docker

```bash
docker run -e QUARTZ_OPENAI_API_KEY=sk-xxx \
           -e QUARTZ_GITHUB_TOKEN=ghp_xxx \
           quartz-cli quartz commit
```

## 命令行工具

### 查看当前配置

```bash
quartz config list
```

**输出示例：**
```
🔧 Detected runtime configuration overrides: QUARTZ_OPENAI_API_KEY, QUARTZ_GITHUB_TOKEN

   ██████╗ ██╗   ██╗ █████╗ ██████╗ ████████╗███████╗
  ...
  
📋 Configuration Source Analysis:

  ✓ OpenAI API Key: Environment Variable (QUARTZ_OPENAI_API_KEY)
  ○ OpenAI Base URL: Config File
  ○ OpenAI Model: Config File
  ✓ GitHub Token: Environment Variable (QUARTZ_GITHUB_TOKEN)
```

### 查看运行时配置

```bash
quartz config runtime
```

**输出示例：**
```
🔧 Runtime Configuration

Active environment variable overrides:

  OPENAI_API_KEY: sk-proj***
  GITHUB_TOKEN: ghp_***

📝 Environment Variable Examples:

# Quartz CLI Runtime Configuration
QUARTZ_OPENAI_API_KEY=sk-your-api-key-here
QUARTZ_OPENAI_BASE_URL=https://api.openai.com/v1
QUARTZ_OPENAI_MODEL=gpt-5
QUARTZ_GITHUB_TOKEN=ghp_your-github-token-here
...
```

## API 使用

如果你在代码中使用 Quartz，可以这样控制运行时配置：

```typescript
import { getConfigManager } from '@/manager/config';

const configManager = getConfigManager();

// 检查是否有运行时覆盖
if (configManager.hasRuntimeOverrides()) {
    console.log('Using environment variable overrides');
}

// 获取基础配置（不包含运行时覆盖）
const baseConfig = configManager.readBaseConfig();

// 获取最终配置（包含运行时覆盖） - 推荐用法
const config = configManager.readRuntimeConfig();

// 或使用默认方法（自动包含运行时覆盖）
const config2 = configManager.readConfig();
```

## 文件清单

### 新增文件

1. **[`utils/runtime-config.ts`](utils/runtime-config.ts:1)** - 运行时配置注入核心模块
   - 328 行代码
   - 完整的环境变量处理逻辑
   - 配置验证和调试工具

2. **[`docs/RUNTIME_CONFIG.md`](docs/RUNTIME_CONFIG.md:1)** - 详细文档
   - 449 行文档
   - 使用场景和最佳实践
   - 完整的 CI/CD 集成示例

3. **`README_RUNTIME_CONFIG.md`** - 本文件（实现说明）

### 修改文件

1. **[`manager/config.ts`](manager/config.ts:1)** - 配置管理器
   - 添加运行时覆盖支持
   - 新增 3 个公共方法
   - 兼容现有 API

2. **[`app/commands/config.ts`](app/commands/config.ts:1)** - 配置命令
   - 增强 `list` 命令显示
   - 新增 `runtime` 子命令
   - 集成配置源分析

## 技术特性

### 1. 零侵入设计

- 现有代码无需修改即可享受运行时配置
- [`readConfig()`](manager/config.ts:178) 默认启用运行时覆盖
- 向后兼容所有现有功能

### 2. 灵活的控制

- 可以选择性禁用运行时覆盖
- 支持查看基础配置和最终配置
- 提供详细的配置源追踪

### 3. 安全性

- 敏感信息自动脱敏显示
- 支持 CI/CD 平台的 secrets 管理
- 环境变量不会被写入配置文件

### 4. 调试友好

- `quartz config list` 显示配置源
- `quartz config runtime` 显示所有环境变量
- [`logConfigurationSource()`](utils/runtime-config.ts:281) 详细的源分析

### 5. 完整的验证

- [`validateRuntimeConfig()`](utils/runtime-config.ts:245) 验证必需字段
- [`getEnvOnlyConfig()`](utils/runtime-config.ts:263) 纯环境变量模式
- 自动补全缺失的默认值

## 最佳实践

### 1. CI/CD 环境

```bash
# 在 CI/CD 中设置环境变量
export QUARTZ_OPENAI_API_KEY=$SECRET_API_KEY
export QUARTZ_GITHUB_TOKEN=$GITHUB_TOKEN

# 命令会自动使用环境变量
quartz review
quartz commit
```

### 2. 本地开发

```bash
# 创建 .env 文件（添加到 .gitignore）
cat > .env << EOF
QUARTZ_OPENAI_API_KEY=sk-xxx
QUARTZ_GITHUB_TOKEN=ghp_xxx
EOF

# 使用 dotenv 加载
source .env
quartz commit
```

### 3. 多环境管理

```bash
# 开发环境
export QUARTZ_OPENAI_BASE_URL=https://dev-api.openai.com/v1

# 生产环境
export QUARTZ_OPENAI_BASE_URL=https://api.openai.com/v1
```

## 测试建议

### 1. 单元测试

```typescript
import { getRuntimeConfig, hasRuntimeConfig } from '@/utils/runtime-config';

describe('Runtime Config', () => {
  it('should detect environment variables', () => {
    process.env.QUARTZ_OPENAI_API_KEY = 'test-key';
    expect(hasRuntimeConfig()).toBe(true);
  });

  it('should override config with env vars', () => {
    const baseConfig = { openai: { apiKey: 'base-key' } };
    process.env.QUARTZ_OPENAI_API_KEY = 'env-key';
    const config = getRuntimeConfig(baseConfig);
    expect(config.openai.apiKey).toBe('env-key');
  });
});
```

### 2. 集成测试

```bash
# 测试环境变量覆盖
QUARTZ_OPENAI_MODEL=gpt-4 quartz config list | grep "gpt-4"

# 测试 runtime 命令
quartz config runtime | grep "QUARTZ_OPENAI_MODEL"
```

## 性能考虑

- 环境变量读取是轻量级操作
- 配置缓存机制保持不变（5秒 TTL）
- 运行时覆盖在配置读取时应用，无额外开销
- [`hasRuntimeConfig()`](utils/runtime-config.ts:48) 使用高效的环境变量检测

## 扩展性

### 添加新的环境变量

1. 在 [`runtime-config.ts`](utils/runtime-config.ts:1) 中添加映射：

```typescript
const ENV_VAR_MAPPING = {
    // ... 现有映射
    NEW_SETTING: `${ENV_PREFIX}NEW_SETTING`,
} as const;
```

2. 在 [`applyRuntimeOverrides()`](utils/runtime-config.ts:69) 中添加处理逻辑：

```typescript
const newSetting = getEnvVar(ENV_VAR_MAPPING.NEW_SETTING);
if (newSetting) {
    runtimeConfig.newSetting = newSetting;
}
```

3. 更新文档和示例

## 故障排查

### 环境变量不生效？

```bash
# 1. 检查环境变量是否设置
echo $QUARTZ_OPENAI_API_KEY

# 2. 查看运行时配置
quartz config runtime

# 3. 查看配置源分析
quartz config list
```

### 配置优先级问题？

使用 [`logConfigurationSource()`](utils/runtime-config.ts:281) 查看详细的配置源：

```typescript
import { logConfigurationSource } from '@/utils/runtime-config';
logConfigurationSource(baseConfig, finalConfig);
```

## 相关资源

- **详细文档**: [`docs/RUNTIME_CONFIG.md`](docs/RUNTIME_CONFIG.md:1)
- **核心实现**: [`utils/runtime-config.ts`](utils/runtime-config.ts:1)
- **配置管理**: [`manager/config.ts`](manager/config.ts:1)
- **命令集成**: [`app/commands/config.ts`](app/commands/config.ts:1)

## 总结

本实现提供了完整的运行时配置注入功能，具有以下优势：

✅ **易用性** - 零配置，自动检测和应用环境变量  
✅ **灵活性** - 支持完全控制覆盖行为  
✅ **安全性** - 敏感信息脱敏，支持 CI/CD secrets  
✅ **可观测性** - 详细的配置源追踪和调试工具  
✅ **兼容性** - 完全向后兼容现有代码  
✅ **可扩展性** - 易于添加新的环境变量支持  

这个实现完美支持 CI/CD 环境，同时也为本地开发提供了便利。