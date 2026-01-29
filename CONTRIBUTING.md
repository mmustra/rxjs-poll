# Contributing to rxjs-poll

Thank you for your interest in contributing to rxjs-poll! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

## How to Contribute

### Reporting Bugs

Before creating a bug report, please check the [existing issues](https://github.com/mmustra/rxjs-poll/issues) to ensure it hasn't already been reported.

When creating a bug report, please include:

- A clear and descriptive title
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Environment details (Node.js version, RxJS version, etc.)
- Code examples or minimal reproduction case

Use the [bug report template](https://github.com/mmustra/rxjs-poll/issues/new?template=bug_report.yml) when creating an issue.

### Suggesting Features

Feature requests are welcome! Please use the [feature request template](https://github.com/mmustra/rxjs-poll/issues/new?template=feature_request.yml) and include:

- A clear description of the feature
- Use cases and examples
- Potential implementation considerations
- Any alternatives you've considered

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Make your changes** following the project's coding standards
3. **Add tests** for any new functionality or bug fixes
4. **Ensure all tests pass** by running `npm run test:all`
5. **Update documentation** if needed
6. **Follow the commit message convention** (see below)
7. **Create a pull request** with a clear description of your changes

#### Commit Message Convention

This project follows the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Example: `feat: add custom retry strategy support`

#### Development Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/mmustra/rxjs-poll.git
   cd rxjs-poll
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Run tests:

   ```bash
   npm run test:all
   ```

4. Run linting:

   ```bash
   npm run lint
   ```

5. Build the project:

   ```bash
   npm run build
   ```

#### Testing

- Write tests for all new features and bug fixes
- Ensure test coverage doesn't decrease
- Run `npm run test:coverage` to check coverage
- Tests should be clear, focused, and well-documented

#### Code Style

- Follow the existing code style
- Run `npm run lint:fix` to auto-fix linting issues
- TypeScript strict mode is enabled - ensure type safety
- Keep functions focused and maintainable

## Questions?

If you have questions about contributing or using rxjs-poll, please use [GitHub Discussions](https://github.com/mmustra/rxjs-poll/discussions) to ask your question. This helps keep the community engaged and makes answers discoverable for others. For private matters, you can reach out to the maintainer via their [GitHub profile](https://github.com/mmustra).

Thank you for contributing to rxjs-poll! 🎉
