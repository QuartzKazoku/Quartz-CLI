// Bun test configuration
export default {
  // Test files to include
  testMatch: [
    '**/*.test.ts',
    '**/*.spec.ts'
  ],
  
  // Files to ignore
  testIgnore: [
    'node_modules/**',
    'dist/**',
    '.git/**'
  ],
  
  // Setup file to run before tests
  setupFiles: [
    'tests/setup.ts'
  ],
  
  // Coverage configuration
  coverage: {
    // Files to include in coverage
    include: [
      'cli/**/*.ts'
    ],
    
    // Files to exclude from coverage
    exclude: [
      'cli/**/*.test.ts',
      'cli/**/*.spec.ts'
    ],
    
    // Coverage reporters
    reporters: [
      'text',
      'html'
    ],
    
    // Coverage thresholds
    thresholds: {
      global: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80
      }
    }
  },
  
  // Timeout for each test in milliseconds
  timeout: 5000,
  
  // Run tests in parallel
  concurrent: true,
  
  // Maximum number of concurrent tests
  maxConcurrency: 4
};