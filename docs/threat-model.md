# Threat model

What Beta interpreter protects, from whom, and how. Update it in the same PR as any
change that adds or moves a trust boundary ([coding standards](coding-standards.md#security)).

## The system

- **The package** (`src/`, `vocabulary/`): pure functions that read beta text
  into a structured record. It does no I/O, keeps no state between calls and
  makes no network requests. Climbing Logbook will install it as a versioned
  package.
- **The release job** (`.github/workflows/release.yml`): on a merged,
  labelled PR it tests, packs and tags the package, creates a GitHub Release
  with the tarball attached, and publishes it to GitHub Packages.
- **The workbench** (`workbench/`, `pnpm workbench`): a Vite dev server on
  `localhost:5174` for trying beta and teaching vocabulary. Its API writes
  `vocabulary/*.json` and runs `git diff` on them.
- **The corpus report** (`scripts/corpus-report.mjs`): reads the beta
  samples export from the maintainer's machine and can save a baseline next
  to it.

## Trust boundaries

| Boundary | Between | What crosses it | Controls |
|---|---|---|---|
| Caller → package | Climbing Logbook and `parse` | Beta text typed by Climbing Logbook's users | Words are looked up in `Map`s, so object property names read as unknown (`test/parse.test.js`); no I/O or evaluation of input |
| Release job → GitHub | `release.yml` and the GitHub API and Packages | The default `GITHUB_TOKEN` with `contents: write` and `packages: write` | Granted to the release job only, with read-only defaults for the workflow; actions pinned by SHA; runs only on a merged PR or a manual dispatch |
| Browser → workbench API | Any page open in the maintainer's browser and `localhost:5174` | Requests to the vocabulary endpoints | Bound to `localhost`; POSTs refused unless the origin is the workbench and the body is JSON (`isLocalJson`, `workbench/api.js`) |
| Climbing Logbook → maintainer's machine | The `beta_samples` export and the corpus report | Beta sample text | Saved outside any repository with mode 0600; never committed |

## Assets

| Asset | Why it matters |
|---|---|
| The published package | Climbing Logbook runs whatever version it installs; a tampered release changes every reading |
| The vocabulary | It decides every reading; unreviewed changes would alter them silently |
| The beta samples export and baseline | Real users' beta text |

## Actors

| Actor | Capability | Motivation |
|---|---|---|
| Climbing Logbook user | Any beta text, through Climbing Logbook | Curiosity, abuse |
| Malicious web page | Requests from the maintainer's browser to `localhost` | Altering the vocabulary |
| Compromised dependency | Code execution at install, test or release time | Credential theft, a tampered release |
| Maintainer account takeover | Repository and package access | Anything |

## Threats (STRIDE)

| Threat | Category | Mitigation | Status |
|---|---|---|---|
| A published version not built from `main` | Spoofing | Only the release job publishes, from the merged commit, after the tests pass | Mitigated |
| A web page posts to the workbench API and rewrites the vocabulary | Tampering | POSTs need the workbench's own origin and a JSON body; vocabulary changes still reach `main` only through a reviewed PR | Mitigated |
| A compromised dependency alters the release | Tampering | Lockfile, three-day `minimumReleaseAge`, all install scripts denied, Dependabot and dependency review, actions pinned by SHA | Mitigated |
| A release with no record of which PR caused it | Repudiation | Tags are cut only from merged PRs; GitHub Releases have generated notes | Mitigated |
| Beta samples leak from the maintainer's machine or into the repository | Information disclosure | Saved outside any repository with mode 0600 | Mitigated, see [data protection](data-protection.md) for retention gaps |
| Crafted beta text makes `parse` slow or crash in Climbing Logbook | Denial of service | Limited by the field length Climbing Logbook allows; no fuzzing yet (#21) | Open |
| A leaked `GITHUB_TOKEN` used to publish or tag | Elevation of privilege | Token lasts only for the job; write scopes only on the release job | Accepted |

## Known gaps

- `parse` hasn't been fuzzed with hostile or very long input (#21).
