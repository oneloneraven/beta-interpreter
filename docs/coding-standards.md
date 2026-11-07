# Coding standards

The standard this project's code, and every code review, is held to. Part 1
is how to review. Part 2 is the decisions already made here, so they aren't
silently reversed.

## Part 1: Review framework

### Personas

Adopt all of them at once; each surfaces issues in its own domain.

- **Platform specialist**: whether the code is idiomatic for the platform
  it runs on, its runtime limits, and its failure modes. Each stack section
  in Part 2 says what this persona checks.
- **Architecture generalist**: structure, data flow, the client-server
  boundary, API design (semantics, status codes, error shapes,
  idempotency), coupling between modules, and whether it will scale as
  features are added.
- **Software engineering principles**: single responsibility, unnecessary
  abstraction or premature generalisation, duplication that should be
  extracted (or extraction that's over-engineered for one caller),
  speculative code for requirements that don't exist, and cleverness where
  a simpler solution was available. SOLID, KISS, DRY, YAGNI,
  Tell-Don't-Ask, high cohesion and low coupling.
- **Quality and operations**: test coverage of what's actually risky,
  error handling (network failures, malformed input, races), validation at
  trust boundaries, secrets and whether anything sensitive could leak into
  a bundle or git history, deploy and rollback safety, and observability.
- **UI and UX**, where there's a UI: accessibility, responsive behaviour,
  loading, empty and error states, feedback for async actions, and visual
  consistency.

### Process

- Read the actual code. Don't infer from file names or assume best practice
  was followed.
- For each finding, cite the file and line, explain why it's a problem, and
  state the concrete risk if it's left.
- Severity:
  - **Blocking**: will break in production, or is insecure.
  - **Should-fix**: a real problem, not urgent.
  - **Worth considering**: opinion, lower confidence.
- Don't pad. If a persona has nothing significant, say so briefly.
- Where a fix isn't obvious, propose one concretely.
- Verify platform behaviour empirically where practical rather than trusting
  documentation alone.

### Output

Group findings by severity, then by persona. End with the top five things
to fix first and a short paragraph on what's done well.

## Part 2: Project standards

### Engineering

- Hold work to real rigour: the principles above applied while building,
  not just while reviewing. When the honest scope is bigger than the
  cheapest version, say so and let the owner choose.
- Beta text is untrusted input: it comes from Climbing Logbook's users. Look
  words up in a `Map` or a prototype-free object, never a plain object
  literal, so a word like `constructor` reads as unknown.
- The package does no I/O and doesn't log. Problems are part of the result
  (unknown words, ambiguities, a step's issues), for the caller to show.
- Let errors reach the boundary. Don't catch an error just to tidy it up.
  The workbench API answers a failed request with a 400 and the error's
  message.

### Testing

- Test at the right layer: unit tests for logic, and regression tests built
  from real beta (paraphrased, or the maintainer's own) for readings. Mock
  only states the real code can't produce.
- A failing test is a bad test or a real bug. Never dismiss one as flaky.
- For workbench changes, verify in a real browser, not just by reading the
  code.

### Workbench

The workbench is a local development tool, served on `localhost` only. It
isn't held to WCAG 2.2 AA or a theme and width matrix; check a change in a
browser at desktop width.

### Comments and docs

- Code documents itself. The default is no comment.
- A comment is one line, for a "why" the code can't express: a platform
  workaround, a subtle invariant, a surprising behaviour. Never what the code
  does, and never how it got here.
- JSDoc type annotations aren't comments in this sense: they're the types.
- Anything longer goes in `docs/` or an ADR; history goes in commits and PRs.
- No sidecar notes files.
- A comment that no longer matches the code is a bug: fix or delete it in
  the same change. Cut any narrative comment you touch.
- Docs describe the current state and link to ADRs for the reasons. Update
  them in the same PR as the change that makes them wrong.

### Security

- Keep [the threat model](threat-model.md) current. A change that adds or
  moves a trust boundary updates it in the same PR: a new data source, a
  new workbench endpoint, a new processor, a new secret or CI permission.
- Secrets never enter git. Local secrets files are gitignored and treated
  as real.
- CI workflows declare least-privilege permissions and pin actions by commit
  SHA.
- Every job's `runs-on` is an exact image (`ubuntu-26.04`, `macos-26`), never
  a `-latest` label. Dependabot doesn't move it: when GitHub moves a
  `-latest` label to a new image, move every pin to that image by hand in
  one PR.

### JavaScript toolchain

Platform persona for this stack: runtime differences between Node and
wherever Climbing Logbook will run the package, module boundaries, async
error handling, and the supply-chain exposure of every dependency.

- **pnpm only.** `pnpm install`, `pnpm exec`, lockfile committed.
  `pnpm-workspace.yaml` holds new releases for three days
  (`minimumReleaseAge`) and denies install scripts unless a package is
  listed in `allowBuilds` with a reason. Don't approve a build script
  without knowing why it's needed. Transitive security fixes go in
  `overrides`, scoped to the major line they fix.
- **Lint and format with Biome.** Warnings fail CI. A deliberate exception
  gets a `biome-ignore` comment saying why.
- **Type-check with `tsc`** over JavaScript with JSDoc types, in `strict`
  mode. Types live in JSDoc, not TypeScript files. The published `.d.ts`
  files are generated (`pnpm build:types`) and never committed.
- **Unit tests with Vitest**, against real code; mock only what the
  runtime can't produce.
