# Claude Code Rust Rewrite (with PyPI wrapper)

This repository is a **research/engineering fork** focused on two goals:

- **Build a comprehensive, reality-based test baseline** for the current Claude Code CLI behavior.
- **Rewrite the implementation in Rust**, with a **Python package wrapper** suitable for publishing to **PyPI**, while preserving the baseline behavior.

The original code under `src/` is TypeScript and was designed to run on Bun. Our test harness in this fork currently runs under Node for portability.

---

## Project goals

- **Behavioral compatibility**: the Rust implementation should match observable behavior of the existing CLI (outputs, command availability, orchestration semantics).
- **Confidence through tests**: tests are the “spec” used to validate the rewrite and prevent regressions.
- **Mostly hermetic**: the suite should avoid network and OS-specific integrations by default; use mocks/fakes and temp dirs/repos where needed.

---

## What’s in this repo today

- **Upstream source snapshot**: `src/` (TypeScript CLI implementation).
- **Baseline test suite**: `test/` (unit + contract + golden tests).
- **CI**: `.github/workflows/test.yml` runs the baseline suite on pushes/PRs.

---

## Running the baseline tests

```bash
npm install
npm test
```

Notes:
- Tests mock `bun:bundle` feature flags to `false` by default.
- Some upstream-only/internal modules are stubbed to keep imports resolvable while we focus on behavior tests.

---

## Testing strategy (high-level)

- **Unit tests**: pure utilities/parsers/matchers where behavior should port 1:1.
- **Contract tests**: stable semantics of registries and core types (commands/tools) without booting the full TUI.
- **Golden tests**: snapshot highly visible CLI surfaces (fast paths and non-interactive behavior).

Over time we’ll expand into more “engine-level” contracts (query loop + tool orchestration) using fakes/mocks rather than live network calls.

---

## Roadmap (conceptual)

1. **Baseline tests** (this repo): expand coverage until the rewrite risk is manageable.
2. **Rust core**: implement the CLI engine and critical subsystems in Rust.
3. **Python wrapper**: expose a stable Python package interface and publish to PyPI.
4. **Parity validation**: run the same baseline suite (or an adapted harness) against the Rust implementation.

---

## Disclaimer / provenance

This repository contains and references source code that was leaked from Anthropic’s npm distribution on **2026-03-31**. All original source code is the property of **Anthropic**.

This fork’s purpose is to build a **testable behavioral baseline** and a **clean-room reimplementation** plan. If you are not authorized to use the leaked source, do not use this repository.
