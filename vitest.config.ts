import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
  test: {
    // Test files to include
    include: ['**/*.test.ts', '**/*.spec.ts'],
    
    // Files to ignore
    exclude: [
      'node_modules/**',
      'dist/**',
      '.git/**'
    ],
    
    // Setup file to run before tests
    setupFiles: ['tests/setup.ts'],
    
    // Test environment
    environment: 'node',
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      include: ['app/**/*.ts'],
      exclude: [
        'app/**/*.test.ts',
        'app/**/*.spec.ts',
        'app/index.ts'
      ],
      thresholds: {
        branches: 45,
        functions: 60,
        lines: 58,
        statements: 57
      }
    },
    
    // Timeout for each test in milliseconds
    testTimeout: 5000,
    
    // Global test configuration
    globals: true,
    
    // Run tests in parallel
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 4,
        minThreads: 1
      }
    }
  }
});