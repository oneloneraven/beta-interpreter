# Beta interpreter

Rule-based interpreter that turns free-text climbing beta into a structured record.

This file is an index. Each line is a rule; the linked doc has the detail.
Read a doc when the work touches it, not up front.

Outstanding work, open questions and decisions live in the GitHub issues, not in a plan file. The design decisions are in the [ADRs](docs/adr/README.md).

## Where this came from

This project branched off from a Climbing Logbook (CL) session on 2026-10-23. CL is at `/home/raven/git/ravendarque/climbing-logbook`. CL's own `CLAUDE.md`, `docs/coding-standards.md` and memory don't load here. Read them only when working on CL integration.

## Working rules carried over from CL

- **Decision IDs:** give every question or decision for Raven a numbered ID. Start at 1 in each new session, and never reset or reuse an ID within a session.
- **Spelling:** British English in copy, docs and replies. Code identifiers stay as they are.
- **Comments:** none in code by default. Allow one line only for a rare "why".
- **Scope:** change only what Raven asks. Ask before widening the scope or rewording approved text.
- **Verification:** verify before claiming something works, and report failures and skipped steps plainly. Never call a failing test "flaky".
- **Claude-written docs:** treat their claims as unverified, including this file.
- **Public or irreversible actions:** ask before anything public, costly or irreversible.
- **Git:** never force-push without asking. Use issues and PRs, with no direct commits to `main`.
- **Dependencies:** latest stable by default. New releases are only usable after three days.
- **Data:** never scrape sites that block bots.
- **Brands:** never name or recommend BDS-listed brands.

## Process

- Every change starts as a GitHub issue, then a branch, then a PR: [workflow](docs/workflow.md).
- Branches are named by what the change does for users: `feature/`, `fix/`, `chore/`, `ci/`, `spike/`, `docs/`: [workflow](docs/workflow.md#branches).
- Open every PR as a draft with its `release:` label set at creation, then mark it ready: [versioning](docs/versioning.md).
- Work through the definition of done before marking a PR ready: [definition of done](docs/definition-of-done.md).
- Update a pushed branch by merging `main`, not rebasing: [workflow](docs/workflow.md#git).
- Pace GitHub API mutations and never retry into a rate limit: [workflow](docs/workflow.md#github-api).
- Propose before building when there's an open design question; concrete fixes with clear direction go straight ahead: [workflow](docs/workflow.md#ways-of-working).

## Standards

- Code is reviewed against [coding standards](docs/coding-standards.md); hold it to the [engineering standards](.claude/skills/engineering-standards/SKILL.md).
- Privacy and data rules: [privacy](docs/privacy.md), [record of processing](docs/data-protection.md).
- Keep the [threat model](docs/threat-model.md) current whenever a trust boundary moves.
- Screen new dependencies and vendors: [ADR-0002](docs/adr/0002-screen-dependencies-against-bds-boycott-lists.md).
- Significant decisions get an [ADR](docs/adr/README.md).
- When a release is wrong: [incident response](docs/runbooks/incident-response.md).

## Working with Claude

- An Opus-class main session plans, decides and verifies; at most one Sonnet-class subagent does all delegated work, one at a time: [working with Claude](docs/working-with-claude.md).
- Memory is one fact per file with `MEMORY.md` as the index: [working with Claude](docs/working-with-claude.md#memory).

## Stack

- JavaScript with pnpm, Biome, `tsc` over JSDoc and Vitest: [coding standards](docs/coding-standards.md#javascript-toolchain). Run `pnpm lint && pnpm typecheck && pnpm test` before pushing.
