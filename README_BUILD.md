# Quartz CLI - 构建说明

## 快速开始

### 安装依赖

```bash
bun install
```

### 开发

```bash
# 运行开发模式（带热重载）
bun run dev

# 或直接运行
bun run cli
```

### 构建

```bash
# 构建当前平台的独立可执行文件
bun run build

# 构建特定平台
bun run build:linux        # Linux x64
bun run build:linux-arm    # Linux ARM64
bun run build:darwin       # macOS ARM64
bun run build:darwin-x64   # macOS x64
bun run build:windows      # Windows x64

# 构建所有平台
bun run build:all
```

### 运行可执行文件

```bash
# macOS/Linux
./dist/quartz --help

# Windows
.\dist\quartz-windows-x64.exe --help
```

## 构建产物

构建后会在 `dist/` 目录生成以下文件：

- `quartz` - 当前平台的可执行文件 (~59MB)
- `quartz-linux-x64` - Linux x64 可执行文件 (~101MB)
- `quartz-linux-arm64` - Linux ARM64 可执行文件
- `quartz-darwin-arm64` - macOS ARM64 可执行文件
- `quartz-darwin-x64` - macOS x64 可执行文件
- `quartz-windows-x64.exe` - Windows x64 可执行文件

## 特点

✅ **单文件部署** - 所有依赖都打包在可执行文件中  
✅ **无需运行时** - 不需要安装 Node.js 或 Bun  
✅ **跨平台构建** - 可以从任何平台构建到其他平台  
✅ **更快的启动** - 代码已预编译，启动速度更快  
✅ **更小的内存** - 优化的二进制文件，内存占用更低  

## 更多信息

- 📖 [详细构建指南](./BUILD.md)
- 🔄 [迁移文档](./MIGRATION.md)
- ⚙️ [构建配置](./build.config.ts)

## 测试

```bash
# 运行测试
bun test

# 运行测试（监听模式）
bun run test:watch

# 生成覆盖率报告
bun run test:coverage
```

## 代码质量

```bash
# 检查代码格式
bun run check

# 自动修复代码问题
bun run check:fix
```

## 发布

```bash
# 构建并发布到 npm
bun run release

# 预览发布（不实际发布）
bun run release:dry
```

---

**注意**：项目现在使用 Bun 的 `--compile` 功能代替之前的 npm + bunup 构建方式。详见 [MIGRATION.md](./MIGRATION.md)。