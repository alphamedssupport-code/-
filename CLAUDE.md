# CLAUDE.md

This file provides guidance to AI assistants (Claude and others) working in this repository.

## Repository Status

This is a freshly initialized repository. No project files exist yet. This CLAUDE.md establishes foundational conventions and workflows to follow as the codebase evolves.

- **Remote**: `alphamedssupport-code/-`
- **Default development branch**: `claude/add-claude-documentation-sE1y4`

---

## General Principles

- Make minimal, targeted changes. Do not refactor or "clean up" code beyond what was requested.
- Do not add features, error handling, or abstractions for scenarios not explicitly asked for.
- Do not create files unless absolutely necessary. Prefer editing existing files.
- Do not add comments, docstrings, or type annotations to code you did not change.
- Never introduce security vulnerabilities (SQL injection, XSS, command injection, etc.).
- When uncertain about intent, ask before acting — especially for destructive or hard-to-reverse operations.

---

## Git Workflow

### Branch Naming

- Feature branches: `feature/<short-description>`
- Bug fixes: `fix/<short-description>`
- Claude-generated work: `claude/<task-description>`

### Commit Messages

Write concise, imperative-mood commit messages:

```
Add user authentication endpoint
Fix null pointer in order processing
Refactor database connection pooling
```

Avoid vague messages like "fix bug", "update code", or "changes".

### Push Protocol

Always push with upstream tracking:

```bash
git push -u origin <branch-name>
```

Retry on network failure with exponential backoff (2s, 4s, 8s, 16s). Do not force-push to shared branches without explicit user approval.

### Pull Requests

Do **not** create a pull request unless the user explicitly requests one.

---

## Development Workflow

> This section should be updated once a technology stack is chosen.

### Getting Started

```bash
# Clone the repository
git clone <repo-url>
cd -

# Install dependencies (update command once stack is defined)
# npm install | pip install -r requirements.txt | go mod download | etc.

# Run the development server (update once defined)
# npm run dev | python manage.py runserver | etc.
```

### Running Tests

> Update this section once a test framework is in place.

```bash
# Run all tests
# npm test | pytest | go test ./... | etc.
```

### Building

> Update this section once a build process is defined.

```bash
# Build for production
# npm run build | make build | etc.
```

---

## File Structure Conventions

> Update this section as the project grows.

```
/
├── CLAUDE.md          # This file — AI assistant guidance
├── README.md          # Human-facing project documentation
├── src/               # Primary source code (if applicable)
├── tests/             # Test files mirroring src/ structure
├── docs/              # Extended documentation
└── scripts/           # Utility/automation scripts
```

---

## Code Conventions

> Update these once a language/framework is chosen.

- Prefer clarity over cleverness.
- Keep functions small and single-purpose.
- Avoid deeply nested logic — extract early returns or helper functions.
- Group related logic; keep unrelated concerns separate.

---

## Security Guidelines

- Never commit secrets, API keys, tokens, or passwords. Use environment variables or a secrets manager.
- Add `.env` to `.gitignore` before creating it.
- Validate all inputs at system boundaries (user input, external APIs).
- Do not trust data from external sources without sanitization.

---

## Environment Variables

> Document required environment variables here as they are added.

```
# Example format:
# VAR_NAME=description_of_what_it_does (required|optional, default: value)
```

---

## Common Pitfalls

- Do not delete or overwrite files with uncommitted changes without confirming with the user.
- Do not run `rm -rf`, `git reset --hard`, or `git push --force` without explicit user approval.
- Do not skip pre-commit hooks (`--no-verify`) unless the user explicitly requests it.

---

## Updating This File

When the project gains a defined stack, tooling, or conventions, update the relevant sections above. Keep this file accurate and concise — it is the primary reference for AI assistants working in this codebase.
