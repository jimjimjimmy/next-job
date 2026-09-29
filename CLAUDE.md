# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Reference: Essential Commands

### Development Server / Running the App
**[TODO: Add command(s) to start the dev server or run the application]**
```bash
# Example: npm run dev, python -m flask run, etc.
```

### Testing
**[TODO: Add testing commands]**
```bash
# Run all tests
# Example: npm test, pytest, etc.

# Run a single test file
# Example: npm test -- path/to/test.js, pytest path/to/test.py, etc.

# Watch mode (if available)
# Example: npm test -- --watch
```

### Linting & Code Quality
**[TODO: Add linting commands]**
```bash
# Lint the codebase
# Example: npm run lint, pylint src/, etc.

# Auto-fix lint issues (if available)
# Example: npm run lint -- --fix
```

### Building (if applicable)
**[TODO: Add build commands]**
```bash
# Example: npm run build, cargo build, etc.
```

---

## Architecture Overview

**[TODO: Describe the high-level architecture]**

Key points to cover:
- **Main entry point(s)**: Where does execution start? (main file, server, CLI entrypoint)
- **Module organization**: How are responsibilities split across directories/files?
- **Key dependencies**: What libraries or frameworks are critical to understand?
- **Data flow**: How does data move through the system? (request → processing → response, etc.)
- **Persistence**: How is data stored? (database, file system, in-memory, etc.)
- **Key patterns**: Are there recurring architectural patterns? (MVC, event-driven, pub/sub, etc.)

Example structure:
```
- [Module A]: Handles X responsibility
  - [Submodule A1]: Specific detail
  - [Submodule A2]: Specific detail
- [Module B]: Handles Y responsibility
```

---

## Context Rules for Future Claude Sessions

### Memory Anchors
- **Before modifying any function**: Locate its references globally to prevent unintended side effects.
- **Before refactoring**: Check if the code is tested and what tests cover it.
- **Before merging changes**: Verify that related code in other files is compatible.

### Regression Shields
- **Do NOT remove error handling** unless explicitly ordered and you've verified it's truly redundant.
- **Do NOT strip validation checks** from data boundaries (user input, API responses, file I/O).
- **Do NOT delete tests** even if they seem outdated—they may be catching real edge cases.
- **Do NOT refactor existing working code** without running the full test suite first.

### Execution Discipline
- Prioritize architectural consistency over code brevity.
- Favor explicit error messages over silent failures.
- Keep changes focused and minimal—if a PR touches unrelated functionality, split it.
- Always run tests locally before pushing to avoid CI failures.

---

## Development Workflow

1. **Understand the task**: Ask clarifying questions before coding.
2. **Check existing tests**: Understand what behavior is already covered.
3. **Make minimal, focused changes**: One feature or bug fix per commit.
4. **Run tests locally**: Never push breaking changes.
5. **Commit with clear messages**: Include attribution (`Co-Authored-By: Claude Haiku 4.5`).
6. **Push to the development branch**: Typically `claude/[branch-name]` as specified in the session.

---

## Important Notes

- **[TODO: Add any project-specific gotchas, third-party integrations, or critical constraints]**
- Example: "Database schema changes require a migration script in `db/migrations/`"
- Example: "API endpoints are authenticated via JWT tokens in the `Authorization` header"
- Example: "This project uses feature flags in `config/features.yml`—always check before adding new functionality"

---

## Testing & Quality Gates

**Test Coverage Expectations**:
- [TODO: Specify minimum coverage percentage or which code MUST be tested]

**CI/CD Pipeline**:
- [TODO: List what runs on push (tests, linting, builds, deployments)]

**Code Review Checklist** (for PRs):
- [ ] Tests pass locally and in CI
- [ ] Linting passes (or auto-fix was applied)
- [ ] No unintended side effects or regressions
- [ ] Commit messages are clear
