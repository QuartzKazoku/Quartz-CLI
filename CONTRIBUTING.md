# Contributing Guide

Thank you for your interest in contributing to the Quartz project! We welcome all forms of contributions, including but not limited to code submissions, bug reports, documentation improvements, and feature suggestions.

## Table of Contents

- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Commit Guidelines](#commit-guidelines)
- [Testing](#testing)
- [Documentation](#documentation)
- [Release Process](#release-process)

## Development Setup

### Prerequisites

- Node.js >= 18.0.0
- Bun >= 1.0.0
- Git

### Installation Steps

1. Fork and clone the repository:
   ```bash
   git clone https://github.com/your-username/quartz.git
   cd quartz
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Copy environment variables file:
   ```bash
   cp .env.example .env
   ```

4. Configure environment variables:
   Edit the `.env` file and set necessary API keys and configuration:
   ```
   OPENAI_API_KEY=your-openai-api-key
   OPENAI_BASE_URL=https://api.openai.com/v1
   OPENAI_MODEL=gpt-4-turbo-preview
   GITHUB_TOKEN=your-github-token
   QUARTZ_LANG=en
   ```

5. Run in development mode:
   ```bash
   bun run dev
   ```

## Project Structure

```
quartz/
├── cli/                    # CLI command implementations
│   ├── commands/          # Various command implementations
│   │   ├── commit.ts      # Commit message generation
│   │   ├── review.ts      # Code review
│   │   ├── pr.ts          # PR description generation
│   │   └── config.ts      # Configuration management
│   ├── i18n/              # Internationalization
│   └── utils/             # Utility functions
├── docs/                  # Documentation
├── scripts/               # Build scripts
├── .env.example          # Environment variables example
├── package.json          # Project configuration
├── tsconfig.json         # TypeScript configuration
└── README.md             # Project description
```

## Development Workflow

1. Create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Develop and test your changes

3. Commit your code (following [Commit Guidelines](#commit-guidelines))

4. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

5. Create a Pull Request

## Commit Guidelines

We use the Conventional Commits specification. Commit message format:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Allowed type values:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation updates
- `style`: Code formatting (no functional changes)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Testing related
- `chore`: Build process or auxiliary tool changes
- `revert`: Revert previous changes
- `build`: Build system or external dependency changes
- `ci`: CI configuration files and scripts changes

### Examples:

```bash
feat(commit): add auto-commit option
fix(review): resolve file parsing error
docs(readme): update installation instructions
```

### Commit Message Guidelines:

- Commit messages should be concise and clearly describe the changes made
- Use English for commit messages
- Reference related issues or tasks in commit messages when applicable

## Testing

### Running Tests

```bash
# Run all tests
bun test

# Run specific test file
bun test path/to/test.test.ts
```

### Test Coverage

```bash
bun test --coverage
```

### Manual Testing

You can manually test the CLI tool:

```bash
# Test configuration command
bun run cli/index.ts config list

# Test commit message generation
bun run cli/index.ts commit

# Test code review
bun run cli/index.ts review

# Test PR description generation
bun run cli/index.ts pr
```

## Documentation

### Documentation Structure

- `README.md`: Project overview and quick start guide
- `CONTRIBUTING.md`: Contributing guidelines (this file)
- `docs/`: Detailed documentation built with VitePress

### Documentation Development

```bash
# Start documentation development server
bun run docs:dev

# Build documentation
bun run docs:build

# Preview built documentation
bun run docs:preview
```

## Code Style

### TypeScript

- Use strict TypeScript configuration
- All functions and variables must have type annotations
- Comments should be in English

### Code Formatting

- Use consistent indentation and spacing
- Maintain appropriate blank lines between functions and classes
- Follow the existing code style in the project

## Release Process

### Version Management

The project uses Semantic Versioning (SemVer).

### Release Steps

1. Update version number:
   ```bash
   # Update version number in package.json
   ```

2. Generate changelog:
   ```bash
   # Automatically generate changelog
   ```

3. Build the project:
   ```bash
   bun run build
   ```

4. Publish to npm:
   ```bash
   bun run release
   ```

## Bug Reports

If you find a bug or have a feature suggestion, please:

1. Check if there's already an existing issue
2. Create a new issue using the appropriate template
3. Provide detailed information, including:
   - Problem description
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Environment information

## Community Guidelines

- Respect all participants
- Maintain friendly and professional communication
- Accept constructive feedback
- Focus on what's best for the community

## Getting Help

If you have any questions or need help:

1. Check documentation and FAQ
2. Search existing issues
3. Create a new issue or discussion
4. Contact maintainers

---

Thank you again for your contribution! 🎉