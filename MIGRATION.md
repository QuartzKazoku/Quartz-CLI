# 从 npm + bunup 迁移到 Bun Compile

本文档说明了项目构建系统的迁移过程和变化。

## 变化概览

### 之前（npm + bunup）

- 使用 `npm` 作为包管理器和脚本运行器
- 使用 `bunup` 打包工具构建 JavaScript 文件
- 输出 JavaScript 模块到 `dist/` 目录
- 需要 Node.js/Bun 运行时才能执行

### 现在（Bun Compile）

- 使用 `bun` 作为包管理器和脚本运行器
- 使用 `bun build --compile` 构建独立可执行文件
- 输出原生可执行文件到 `dist/` 目录
- 无需任何运行时，开箱即用

## 主要改动

### 1. package.json 脚本变化

```json
{
  "scripts": {
    // 开发命令
    "cli": "bun run app/index.ts",           // 之前: tsx app/index.ts
    "start": "bun run app/index.ts",         // 之前: tsx app/index.ts
    "dev": "bun --watch app/index.ts",       // 之前: tsx watch app/index.ts
    
    // 构建命令
    "build": "bun build ./app/index.ts --compile --minify --sourcemap --outfile dist/quartz",
    // 之前: "build": "bunup"
    
    // 新增：跨平台构建
    "build:linux": "bun build ./app/index.ts --compile --minify --sourcemap --target=bun-linux-x64 --outfile dist/quartz-linux-x64",
    "build:darwin": "bun build ./app/index.ts --compile --minify --sourcemap --target=bun-darwin-arm64 --outfile dist/quartz-darwin-arm64",
    "build:windows": "bun build ./app/index.ts --compile --minify --sourcemap --target=bun-windows-x64 --outfile dist/quartz-windows-x64",
    "build:all": "bun run build:linux && bun run build:linux-arm && bun run build:darwin && bun run build:darwin-x64 && bun run build:windows",
    
    // 其他工具命令
    "add-path-comments": "bun run scripts/add-path-comments.ts"  // 之前: tsx scripts/...
  }
}
```

### 2. 新增文件

- **`build.config.ts`** - 构建配置文件
  - 定义构建选项和目标平台
  - 集中管理构建时常量
  
- **`scripts/build.ts`** - 构建脚本（可选）
  - 提供更灵活的构建流程
  - 支持命令行参数

- **`BUILD.md`** - 构建文档
  - 详细的构建指南
  - 跨平台构建说明
  - 故障排除

### 3. 移除/弃用文件

- **`bunup.config.ts`** - 不再需要（保留供参考）

### 4. .gitignore 更新

新增以下忽略规则：

```gitignore
# Compiled executables
*.exe
*.app
*.dmg
quartz
quartz-*
!dist/.gitkeep
```

## 迁移步骤

### 第一步：更新依赖

项目现在主要使用 Bun，无需额外安装依赖：

```bash
# 安装 Bun（如果还没有）
curl -fsSL https://bun.sh/install | bash

# 安装项目依赖
bun install
```

### 第二步：验证构建

```bash
# 构建当前平台
bun run build

# 测试可执行文件
./dist/quartz --help
```

### 第三步：更新 CI/CD

如果您有 CI/CD 流程，需要更新构建步骤：

```yaml
# GitHub Actions 示例
- name: Setup Bun
  uses: oven-sh/setup-bun@v1
  with:
    bun-version: latest

- name: Install dependencies
  run: bun install

- name: Build
  run: bun run build:all  # 构建所有平台
```

## 命令对照表

| 操作 | 之前 (npm) | 现在 (bun) |
|------|-----------|-----------|
| 安装依赖 | `npm install` | `bun install` |
| 运行开发 | `npm run dev` | `bun run dev` |
| 构建项目 | `npm run build` | `bun run build` |
| 运行脚本 | `npm run cli` | `bun run cli` |
| 运行测试 | `npm test` | `bun test` |
| 发布包 | `npm publish` | `npm publish` (仍然使用 npm) |

## 优势

### 1. 性能提升

- **更快的启动速度**：代码已预编译
- **更低的内存占用**：优化的二进制文件
- **更快的安装**：Bun 的包管理器比 npm 快得多

### 2. 部署简化

- **单文件部署**：所有依赖都打包在一个可执行文件中
- **无需运行时**：不需要在目标机器上安装 Node.js 或 Bun
- **跨平台构建**：可以从任何平台构建到其他平台

### 3. 开发体验

- **更快的开发循环**：Bun 的热重载速度更快
- **更好的兼容性**：Bun 原生支持 TypeScript
- **统一工具链**：测试、构建、运行都用同一个工具

## 构建产物对比

### 之前（bunup）

```
dist/
├── index.js           # 打包的 JavaScript 文件
├── index.js.map       # Source map
└── index.d.ts         # TypeScript 类型定义
```

运行方式：`node dist/index.js` 或 `bun dist/index.js`

### 现在（Bun Compile）

```
dist/
├── quartz                    # macOS/Linux 可执行文件 (~59MB)
├── quartz-linux-x64         # Linux x64
├── quartz-linux-arm64       # Linux ARM64
├── quartz-darwin-arm64      # macOS ARM64
├── quartz-darwin-x64        # macOS x64
└── quartz-windows-x64.exe   # Windows x64
```

运行方式：`./dist/quartz` (直接执行，无需运行时)

## 常见问题

### Q: 为什么可执行文件这么大？

A: 可执行文件包含了完整的 Bun 运行时和所有依赖项，这是正常的。通常大小在 40-80MB 之间。

### Q: 可以继续使用 npm 吗？

A: 可以，但推荐使用 Bun 以获得更好的性能。大多数 npm 命令都有 Bun 的等价命令。

### Q: 发布到 npm 时还需要 JavaScript 文件吗？

A: 是的，如果要发布到 npm，您可能需要保留 JavaScript 构建。可以同时维护两种构建方式，或者只发布可执行文件作为独立工具。

### Q: 如何调试编译后的可执行文件？

A: 使用 `--sourcemap` 标志构建，错误堆栈会自动映射回原始 TypeScript 代码。

### Q: 支持哪些平台？

A: 支持 Linux (x64/ARM64)、macOS (x64/ARM64)、Windows (x64)。详见 [BUILD.md](./BUILD.md)。

## 回滚

如果需要回滚到之前的构建系统：

```bash
# 恢复 package.json 中的脚本
git checkout HEAD~1 package.json

# 使用 bunup 构建
npm install
npm run build
```

## 更多信息

- [BUILD.md](./BUILD.md) - 详细构建指南
- [Bun 文档](https://bun.sh/docs)
- [Bun Compile 文档](https://bun.sh/docs/bundler/executables)

## 反馈

如有问题或建议，请提交 [Issue](https://github.com/QuartzKazoku/Quartz-CLI/issues)。