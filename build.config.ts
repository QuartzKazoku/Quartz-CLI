/**
 * Bun compile configuration for building standalone executables
 * 
 * Usage:
 * - Build for current platform: bun run build
 * - Build for specific platform: bun run build:linux | build:darwin | build:windows
 * - Build for all platforms: bun run build:all
 */

export const BUILD_CONFIG = {
  // Entry point for the application
  entry: './app/index.ts',
  
  // Output directory
  outDir: 'dist',
  
  // Base executable name
  name: 'quartz',
  
  // Build options
  options: {
    minify: true,
    sourcemap: true,
    // Enable bytecode compilation for faster startup (experimental)
    // bytecode: true,
  },
  
  // Platform-specific targets
  targets: {
    'linux-x64': 'bun-linux-x64',
    'linux-arm64': 'bun-linux-arm64',
    'darwin-arm64': 'bun-darwin-arm64',
    'darwin-x64': 'bun-darwin-x64',
    'windows-x64': 'bun-windows-x64',
  },
  
  // Build-time constants (optional)
  define: {
    // Example: BUILD_VERSION: '"1.0.0"',
    // Example: BUILD_TIME: '"2024-01-15T10:30:00Z"',
  },
} as const;

export type BuildTarget = keyof typeof BUILD_CONFIG.targets;