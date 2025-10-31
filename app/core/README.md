# Quartz CLI - 新命令架构设计

## 📋 概述

本文档介绍了为 Quartz CLI 设计的新命令解析系统，采用 `quartz <动词> <对象> [参数]` 的自然语言式命令结构。

## 🏗️ 架构设计

### 核心组件

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   命令解析器     │───▶│   动词分发器     │───▶│   对象路由器     │
│  CommandParser  │    │  VerbDispatcher │    │  ObjectRouter   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   命令执行器     │◀───│   参数解析器     │◀───│   命令验证器     │
│  CommandExecutor│    │  ParameterParser│    │  CommandValidator│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 设计原则

1. **类型安全**: 使用 TypeScript 枚举和接口确保类型安全
2. **模块化**: 每个组件职责单一，易于测试和维护
3. **可扩展**: 支持插件化命令和中间件
4. **用户友好**: 提供智能提示、自动补全和错误建议

## 🎯 命令结构

### 基本格式
```bash
quartz <动词> <对象> [参数]
```

### 支持的动词
- `init` - 初始化
- `create` - 创建
- `delete` - 删除
- `list` - 列出
- `show` - 显示
- `set` - 设置
- `get` - 获取
- `update` - 更新
- `generate` - 生成
- `review` - 审查
- `commit` - 提交
- `switch` - 切换
- `save` - 保存
- `load` - 加载
- `manage` - 管理

### 支持的对象
- `project` - 项目
- `config` - 配置
- `profile` - 配置档
- `branch` - 分支
- `commit` - 提交
- `pr` - Pull Request
- `review` - 代码审查
- `changelog` - 变更日志
- `token` - 令牌
- `language` - 语言
- `platform` - 平台

## 📝 命令示例

### 初始化类命令
```bash
# 初始化项目
quartz init project
quartz init project --global
quartz init project --template typescript

# 初始化配置
quartz init config
quartz init config --global
quartz init config --profile work
```

### 配置管理命令
```bash
# 列出配置
quartz list config
quartz list config --global
quartz list config --profile work

# 设置配置
quartz set config --key openai.apiKey --value sk-xxx
quartz set config --key openai.model --value gpt-4 --global
quartz set config --key language.ui --value zh-CN --profile work

# 获取配置
quartz get config --key openai.apiKey
quartz get config --key openai.model --global
```

### Git 工作流命令
```bash
# 分支管理
quartz create branch --name feature/new-feature
quartz create branch --name hotfix/bug-123 --from main
quartz create branch --issue 456
quartz delete branch --name feature/old-feature --force
quartz list branch --remote
quartz switch branch --name main --create
```

### AI 功能命令
```bash
# 生成提交信息
quartz generate commit
quartz generate commit --edit
quartz generate commit --count 5 --model gpt-4

# 生成 PR 描述
quartz generate pr
quartz generate pr --base main --auto
quartz generate pr --base develop --draft

# 生成代码审查
quartz generate review
quartz generate review --files src/app.ts src/utils.ts
quartz generate review --output review.json --severity error

# 生成变更日志
quartz generate changelog
quartz generate changelog --from v1.0.0 --to v2.0.0
quartz generate changelog --format json --template conventional
```

## 🔧 核心组件详解

### 1. 命令注册中心 (CommandRegistry)
- **功能**: 管理所有命令定义
- **特性**: 
  - 支持命令注册/注销
  - 按动词、对象、分类索引
  - 提供统计信息
  - 支持自动补全

### 2. 动词分发器 (VerbDispatcher)
- **功能**: 处理动词级别的路由和验证
- **特性**:
  - 动词有效性验证
  - 智能建议生成
  - 帮助信息生成
  - 动词-对象组合验证

### 3. 对象路由器 (ObjectRouter)
- **功能**: 处理对象级别的路由和验证
- **特性**:
  - 对象有效性验证
  - 相关对象发现
  - 上下文验证（如 Git 仓库检查）
  - 对象统计信息

### 4. 参数解析器 (ParameterParser)
- **功能**: 解析和验证命令参数
- **特性**:
  - 支持多种数据类型（string, number, boolean, array, object）
  - 参数别名支持
  - 默认值处理
  - 自定义验证函数
  - 类型转换和验证

### 5. 命令执行器 (CommandExecutor)
- **功能**: 执行命令并处理结果
- **特性**:
  - 中间件支持
  - 错误处理
  - 性能监控
  - 执行统计
  - 内置中间件（日志、验证、配置检查等）

### 6. 主命令解析器 (CommandParser)
- **功能**: 整合所有组件，提供统一接口
- **特性**:
  - 一步式解析和验证
  - 帮助信息生成
  - 自动补全建议
  - 错误处理和用户友好提示

## 🎨 中间件系统

### 内置中间件
1. **验证中间件**: 验证执行上下文
2. **配置验证中间件**: 检查必需的配置项
3. **Git 验证中间件**: 确保在 Git 仓库中执行
4. **确认中间件**: 对破坏性操作要求用户确认
5. **干运行中间件**: 支持模拟执行模式
6. **错误处理中间件**: 提供一致的错误处理
7. **日志中间件**: 记录命令执行过程
8. **性能监控中间件**: 跟踪执行时间

### 自定义中间件
```typescript
// 示例：自定义中间件
commandDispatcher.use(async (context, next) => {
  console.log('执行前处理');
  const startTime = Date.now();
  
  await next();
  
  const duration = Date.now() - startTime;
  console.log(`执行完成，耗时: ${duration}ms`);
});
```

## 📊 优势对比

### 新系统 vs 旧系统

| 特性 | 新系统 | 旧系统 |
|------|--------|--------|
| 类型安全 | ✅ TypeScript 枚举 | ❌ 字符串匹配 |
| 模块化 | ✅ 组件分离 | ❌ 逻辑分散 |
| 可扩展 | ✅ 插件化架构 | ❌ 硬编码 |
| 错误处理 | ✅ 统一错误处理 | ❌ 各自处理 |
| 自动补全 | ✅ 智能建议 | ❌ 无 |
| 帮助系统 | ✅ 结构化帮助 | ❌ 手动维护 |
| 参数验证 | ✅ 类型验证 | ❌ 手动解析 |
| 中间件支持 | ✅ 可插拔 | ❌ 无 |
| 测试友好 | ✅ 依赖注入 | ❌ 紧耦合 |

## 🚀 使用指南

### 1. 基本使用
```typescript
import { commandDispatcher } from './core';

// 执行命令
await commandDispatcher.parseAndDispatch(['list', 'config'], context);
```

### 2. 注册新命令
```typescript
import { commandRegistry, CommandVerb, CommandObject } from './core';

const newCommand = {
  verb: CommandVerb.CREATE,
  object: CommandObject.BRANCH,
  description: 'Create a new branch',
  parameters: [/* 参数定义 */],
  examples: [/* 示例 */],
  category: 'git-workflow',
  handler: async (context) => {
    // 命令实现
  },
};

commandRegistry.register(newCommand);
```

### 3. 添加中间件
```typescript
import { commandDispatcher } from './core';

commandDispatcher.use(async (context, next) => {
  // 前置处理
  await next();
  // 后置处理
});
```

## 🧪 测试策略

### 单元测试
- 每个组件独立测试
- Mock 依赖注入
- 覆盖边界情况

### 集成测试
- 端到端命令执行测试
- 中间件执行顺序测试
- 错误处理流程测试

### 示例测试
```typescript
// 测试命令解析
const result = commandDispatcher.parseAndDispatch(['init', 'project'], mockContext);
expect(result).resolves.not.toThrow();

// 测试验证
const validation = commandDispatcher.validateCommand(['invalid', 'command']);
expect(validation.valid).toBe(false);
```

## 📈 迁移路径

### 阶段 1: 并行运行
- 新旧系统并存
- 逐步迁移命令
- 保持向后兼容

### 阶段 2: 逐步替换
- 用新系统替换旧命令
- 更新文档和示例
- 收集用户反馈

### 阶段 3: 完全切换
- 移除旧系统
- 清理冗余代码
- 性能优化

## 🔮 未来扩展

### 可能的增强
1. **插件系统**: 支持外部插件
2. **配置文件**: 命令配置文件支持
3. **脚本支持**: 支持命令脚本和别名
4. **远程命令**: 支持远程命令执行
5. **可视化**: 命令执行可视化界面
6. **国际化**: 完整的多语言支持

### 架构演进
- 微服务化命令执行
- 分布式命令注册
- 云端命令同步
- AI 辅助命令推荐

---

## 📝 总结

新的命令架构通过以下方式解决了现有问题：

1. **消除字符串匹配混乱**: 使用枚举和类型系统
2. **统一参数解析**: 标准化的参数处理流程
3. **提高维护性**: 模块化和插件化设计
4. **增强用户体验**: 智能提示和自动补全
5. **保证类型安全**: TypeScript 类型系统保护
6. **支持扩展性**: 中间件和插件架构

这个设计为 Quartz CLI 提供了一个可扩展、类型安全、用户友好的命令系统，为未来的功能扩展奠定了坚实的基础。