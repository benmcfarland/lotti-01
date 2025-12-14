# GitHub Copilot / AI Agent Instructions for lotti-01

This repository is currently minimal. These instructions describe how an AI coding agent should approach work here, and what to ask before making non-trivial changes.

1. Repo snapshot
- Branch: `main` (default).
- Current files: see [.gitignore](.gitignore). No src/ or manifest files detected.

2. Primary goals for an agent
- If the user asks for features, propose a minimal scaffold (language, package manifest, CI) before implementing.
- If asked to fix or extend code, first locate entrypoints (`src/`, `app/`, `package.json`, `pyproject.toml`, `go.mod`) and confirm language/runtime with the user.

3. How to get started (actions the agent should take)
- Run a quick repo scan: `ls -la`, `git status`, `tree -a` (or use workspace file listing).
- If no language manifests exist, ask: which language/framework should I scaffold? Suggest a minimal layout (e.g., `src/`, `tests/`, `README.md`).

4. Conventions & expectations for this repo
- Keep changes small and focused — create/modify only the files required for the task.
- Prefer creating a clear README and a minimal test harness when adding a new component.
- Use `main` as the default branch for PR targets; request user confirmation for branch naming.

5. Examples of targeted prompts to the user (ask before acting when uncertain)
- "Which runtime/language should I use (Node/Python/Go/Rust)?"
- "Do you want a minimal CI (GitHub Actions) and tests scaffold?"
- "Where should new services live — `src/` or a top-level `services/` folder?"

6. Integration points & environment notes
- Dev container: repository runs in an Ubuntu 24.04 devcontainer — prefer standard Linux-compatible tooling.
- If adding dependencies, update the appropriate manifest (`package.json`, `requirements.txt`, `pyproject.toml`) and include install/run instructions in the README.

7. When merging or opening PRs
- Provide a concise PR description and list of changed files; run a local smoke test if possible.
- If creating tests, include commands to run them in the PR description.

8. When unsure
- Ask the user a single clarifying question before making scaffolding-level changes.

If you want, I can scaffold a starter layout for a chosen language (Node/Python) now — tell me which one.
