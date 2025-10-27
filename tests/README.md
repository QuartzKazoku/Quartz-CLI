# Testing with Bun

This project uses Bun's built-in test runner for testing. The test runner is Jest-compatible and provides fast, native TypeScript support.

## Running Tests

### Run All Tests

```bash
# Run all tests
bun test

# Run tests with coverage
bun test --coverage

# Run tests in watch mode
bun test --watch
```

### Run Specific Test Files

```bash
# Run a specific test file
bun test tests/config.test.ts

# Run multiple test files
bun test tests/config.test.ts tests/commit.test.ts
```

### Filter Tests by Name

```bash
# Run tests matching a pattern
bun test --test-name-pattern "config"

# Run tests with specific text in the name
bun test -t "commit"
```

## Test Structure

- `tests/index.test.ts` - Tests for CLI entry point
- `tests/config.test.ts` - Tests for configuration commands
- `tests/commit.test.ts` - Tests for commit message generation
- `tests/pr.test.ts` - Tests for PR description generation
- `tests/review.test.ts` - Tests for code review functionality
- `tests/utils.test.ts` - Tests for utility functions
- `tests/i18n.test.ts` - Tests for internationalization

## Configuration

Test configuration is defined in `bun.test.config.ts`:

- **Test Files**: All `*.test.ts` and `*.spec.ts` files
- **Setup**: Runs `tests/setup.ts` before all tests
- **Coverage**: Generates coverage reports with thresholds
- **Timeout**: 5 seconds per test
- **Concurrency**: Runs tests in parallel (max 4 concurrent)

## Coverage

Coverage reports are generated when running with `--coverage` flag:

```bash
bun test --coverage
```

Coverage thresholds are set at 80% for:
- Branches
- Functions
- Lines
- Statements

Coverage reports are generated in:
- Text output in console
- HTML report in `coverage/` directory

## Mocking

Tests use Bun's built-in mocking capabilities:

```typescript
import { mock } from 'bun:test';

// Mock a module
mock.module('fs', () => ({
  readFileSync: mock(() => 'test content'),
}));

// Mock a function
const mockFn = mock(() => 'mocked value');
```

## Writing Tests

Tests use the standard Bun test syntax:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'bun:test';

describe('Feature', () => {
  beforeEach(() => {
    // Setup before each test
  });

  afterEach(() => {
    // Cleanup after each test
  });

  it('should work correctly', () => {
    // Test implementation
    expect(result).toBe(expected);
  });
});
```

## CI/CD Integration

The test runner automatically detects CI environments and provides appropriate output formatting.

### GitHub Actions

```yaml
- name: Run tests
  run: |
    bun install
    bun test --coverage
```

### JUnit XML Reports

For CI systems that require JUnit XML:

```bash
bun test --reporter=junit --reporter-outfile=test-results.xml