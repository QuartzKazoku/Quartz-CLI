# 构建指南

本项目使用 Bun 的 `--compile` 功能来构建独立的可执行文件。

## 前置要求

- [Bun](https://bun.sh) >= 1.0.0

## 快速开始

### 构建当前平台

```bash
bun run build
```

这将为您当前的操作系统和架构构建可执行文件，输出到 `dist/quartz`。

### 构建特定平台

```bash
# Linux x64
bun run build:linux

# Linux ARM64
bun run build:linux-arm

# macOS ARM64 (Apple Silicon)
bun run build:darwin

# macOS x64 (Intel)
bun run build:darwin-x64

# Windows x64
bun run build:windows
```

### 构建所有平台

```bash
bun run build:all
```

这将为所有支持的平台构建可执行文件。

## 构建输出

构建的可执行文件将输出到 `dist/` 目录：

- `dist/quartz` - 当前平台的可执行文件
- `dist/quartz-linux-x64` - Linux x64
- `dist/quartz-linux-arm64` - Linux ARM64
- `dist/quartz-darwin-arm64` - macOS ARM64
- `dist/quartz-darwin-x64` - macOS x64
- `dist/quartz-windows-x64.exe` - Windows x64

## 构建选项

构建配置在 [`build.config.ts`](./build.config.ts) 中定义：

```typescript
export const BUILD_CONFIG = {
  entry: './app/index.ts',        // 入口文件
  outDir: 'dist',                 // 输出目录
  name: 'quartz',                 // 可执行文件名称
  options: {
    minify: true,                 // 代码压缩
    sourcemap: true,              // 生成 sourcemap
    // bytecode: true,            // 字节码编译（实验性）
  },
  // ... 其他配置
};
```

### 启用字节码编译

要启用实验性的字节码编译以提高启动速度，可以在 `build.config.ts` 中取消注释：

```typescript
options: {
  minify: true,
  sourcemap: true,
  bytecode: true,  // 启用字节码编译
}
```

然后运行构建命令。

### 添加构建时常量

在 `build.config.ts` 中定义构建时常量：

```typescript
define: {
  BUILD_VERSION: '"1.0.0"',
  BUILD_TIME: '"2024-01-15T10:30:00Z"',
}
```

这些常量将在编译时嵌入到可执行文件中。

## 高级用法

### 使用构建脚本

您也可以直接使用构建脚本：

```bash
# 构建当前平台
bun run scripts/build.ts

# 构建特定平台
bun run scripts/build.ts linux-x64
bun run scripts/build.ts darwin-arm64
bun run scripts/build.ts windows-x64

# 构建所有平台
bun run scripts/build.ts all
```

### 交叉编译

Bun 支持从任何平台交叉编译到其他平台。例如，在 macOS 上可以构建 Linux 或 Windows 的可执行文件。

### macOS 代码签名

在 macOS 上，构建后的可执行文件可能需要代码签名以避免 Gatekeeper 警告：

```bash
# 基本签名
codesign --deep --force -vvvv --sign "XXXXXXXXXX" ./dist/quartz

# 带 JIT 权限的签名（推荐）
codesign --deep --force -vvvv --sign "XXXXXXXXXX" --entitlements entitlements.plist ./dist/quartz
```

创建 `entitlements.plist` 文件：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.cs.allow-jit</key>
    <true/>
    <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
    <true/>
    <key>com.apple.security.cs.disable-executable-page-protection</key>
    <true/>
</dict>
</plist>
```

### Windows 图标和控制台

为 Windows 可执行文件添加自定义图标：

```bash
bun build ./app/index.ts --compile --windows-icon=path/to/icon.ico --outfile dist/quartz
```

隐藏控制台窗口（适用于 GUI 应用）：

```bash
bun build ./app/index.ts --compile --windows-hide-console --outfile dist/quartz
```

## 运行可执行文件

构建完成后，可以直接运行：

```bash
# macOS/Linux
./dist/quartz --help

# Windows
.\dist\quartz-windows-x64.exe --help
```

## 与 npm 构建的区别

### 旧方式（npm + bunup）

```bash
npm run build  # 输出 JS 文件到 dist/
```

### 新方式（Bun compile）

```bash
bun run build  # 输出独立可执行文件到 dist/
```

### 优势

1. **单文件部署**：所有依赖和运行时都打包在一个可执行文件中
2. **无需安装运行时**：不需要安装 Node.js 或 Bun
3. **更快的启动速度**：代码已预编译
4. **更小的内存占用**：优化的二进制文件
5. **跨平台构建**：可以从任何平台构建到其他平台

## 故障排除

### "Illegal instruction" 错误

在某些旧 CPU 上，可能会遇到此错误。使用 baseline 版本：

```bash
bun build ./app/index.ts --compile --target=bun-linux-x64-baseline --outfile dist/quartz
```

### 权限问题

在 Linux/macOS 上，确保可执行文件有执行权限：

```bash
chmod +x dist/quartz
```

### 文件大小

编译后的可执行文件包含完整的 Bun 运行时，因此会比较大（通常 40-80 MB）。可以使用以下方法优化：

1. 启用 `--minify` 压缩代码
2. 移除未使用的依赖
3. 使用 `strip` 命令移除调试符号（Linux/macOS）

```bash
strip dist/quartz
```

## 参考资源

- [Bun 编译文档](https://bun.sh/docs/bundler/executables)
- [构建配置文件](./build.config.ts)
- [构建脚本](./scripts/build.ts)