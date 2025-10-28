# Enquirer 集成文档

## 概述

本项目已成功集成 [enquirer](https://github.com/enquirer/enquirer) 库来改进 CLI 的交互体验。enquirer 提供了更美观、更易用的命令行交互界面。

## 安装

enquirer 已添加到项目依赖中：

```bash
bun add enquirer
```

## 架构设计

### 工具模块

创建了统一的 enquirer 封装模块 [`utils/enquirer.ts`](../utils/enquirer.ts)，提供以下功能：

#### 主要函数

1. **`select()`** - 单选列表
   - 用于从多个选项中选择一个
   - 支持箭头键导航
   - 示例：语言选择、平台选择

2. **`input()`** - 文本输入
   - 用于获取用户输入的文本
   - 支持默认值和验证
   - 示例：API Key 输入、配置值输入

3. **`password()`** - 密码输入
   - 输入时隐藏字符
   - 用于敏感信息输入

4. **`confirm()`** - 确认对话框
   - 简单的是/否确认
   - 返回布尔值

5. **`multiselect()`** - 多选列表
   - 允许选择多个选项
   - 使用空格键切换选择

6. **`autocomplete()`** - 自动完成
   - 支持搜索和过滤
   - 适合大量选项的场景

7. **`selectFromList()`** - 通用列表选择
   - 接受自定义格式化函数
   - 灵活适配不同场景

8. **`formatCommitMessage()`** - 提交信息格式化
   - 专门用于格式化显示 commit 消息
   - 支持多行消息的优雅展示

## 已集成的命令

### 1. Commit 命令

**文件**: [`app/commands/commit.ts`](../app/commands/commit.ts)

**改进内容**:
- 使用 enquirer 的 Select 组件替代原生终端交互
- 提供更美观的提交信息选择界面
- 支持箭头键导航和 Enter 确认
- 自动处理用户取消操作 (Ctrl+C)

**重构前**:
```typescript
// 使用原生 process.stdin 手动处理键盘事件
async function selectCommitMessage(messages: string[]): Promise<number> {
  // 70+ 行复杂的键盘事件处理代码
}
```

**重构后**:
```typescript
// 使用 enquirer 简化为 10 行代码
async function selectCommitMessage(messages: string[]): Promise<number> {
  try {
    return await selectFromList(
      t('commit.selectPrompt'),
      messages,
      formatCommitMessage,
      0
    );
  } catch (error) {
    console.log('\n' + t('commit.cancelled'));
    process.exit(0);
  }
}
```

### 2. Config 命令

**文件**: [`app/commands/config.ts`](../app/commands/config.ts)

**改进内容**:

#### 语言选择 (`selectLanguage`)
- 使用 enquirer Select 组件
- 支持上下箭头导航
- 显示当前选中的语言
- 用户体验更直观

#### 平台选择 (`selectPlatform`)
- GitHub / GitLab 平台选择
- 使用 Select 组件
- 支持 ESC 取消操作

#### 文本输入 (`askQuestion`)
- API Key、Base URL、Model 等配置输入
- 使用 enquirer Input 组件
- 支持默认值显示
- 优雅的错误处理

## 使用示例

### 基本选择

```typescript
import { select } from '../../utils/enquirer';

const choices = [
  { name: 'option1', value: 'opt1', message: '选项 1' },
  { name: 'option2', value: 'opt2', message: '选项 2' },
  { name: 'option3', value: 'opt3', message: '选项 3' },
];

const selected = await select('请选择一个选项:', choices, 0);
console.log('您选择了:', selected);
```

### 文本输入

```typescript
import { input } from '../../utils/enquirer';

const apiKey = await input(
  '请输入 API Key:',
  'sk-default-key',
  (value) => value.length > 0 || '不能为空'
);
```

### 列表选择（带格式化）

```typescript
import { selectFromList, formatCommitMessage } from '../../utils/enquirer';

const messages = [
  'feat: add new feature',
  'fix: bug fix\n\nThis fixes issue #123',
  'docs: update README'
];

const index = await selectFromList(
  '选择一个提交信息:',
  messages,
  formatCommitMessage,
  0
);
```

## 优势

### 1. 代码简化
- 原生实现需要 70+ 行代码处理键盘事件
- enquirer 实现仅需 10 行代码
- 减少了约 85% 的代码量

### 2. 更好的用户体验
- ✨ 现代化的交互界面
- 🎨 优雅的视觉反馈
- ⌨️ 标准的快捷键支持
- 🚫 统一的取消操作处理

### 3. 易于维护
- 📦 集中的工具函数
- 🔧 统一的 API 设计
- 🐛 更少的 bug 风险
- 📝 清晰的代码结构

### 4. 功能扩展性
- 🔌 易于添加新的交互类型
- 🎯 支持自定义验证
- 🌐 国际化友好
- 🎨 可自定义样式

## 测试

运行以下命令测试 enquirer 集成：

```bash
# 测试 commit 命令的交互
bun run app/index.ts commit

# 测试 config 初始化向导
bun run app/index.ts config init

# 查看配置列表
bun run app/index.ts config list
```

## 注意事项

1. **终端兼容性**: enquirer 在大多数现代终端中工作良好，但某些旧版终端可能不支持所有功能。

2. **错误处理**: 所有 enquirer 调用都应该包裹在 try-catch 中，以处理用户取消操作（Ctrl+C）。

3. **国际化**: 确保所有提示文本都使用 i18n 系统进行翻译。

4. **无头模式**: 在 CI/CD 环境中，确保提供非交互式的备选方案。

## 未来改进

1. 添加更多交互类型（如进度条、确认对话框）
2. 支持主题自定义
3. 添加更多验证器
4. 改进错误消息显示
5. 添加交互式测试

## 参考资源

- [Enquirer 官方文档](https://github.com/enquirer/enquirer)
- [Enquirer API 文档](https://github.com/enquirer/enquirer#-usage)
- [项目 i18n 系统](../i18n/README.md)

## 贡献

如果你想添加新的 enquirer 功能或改进现有实现，请：

1. 在 [`utils/enquirer.ts`](../utils/enquirer.ts) 中添加新函数
2. 更新相关命令文件
3. 添加适当的错误处理
4. 更新此文档
5. 添加测试用例

---

**最后更新**: 2025-10-28  
**维护者**: Quartz CLI Team