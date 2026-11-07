# Versioning

## Releases are tags

The version lives in exactly one place: a `vX.Y.Z` git tag on the commit it
was cut from, with a GitHub Release on that tag. `package.json` keeps the
placeholder `0.0.0`; the release job writes the real version only into its
own checkout, for the packed artefact, and never commits it.

Merging to `main` integrates a change. Nothing is released until a tag is
cut, and tags are cut automatically from the PR's release label.

## Release labels

Every PR needs exactly one release label before it can merge. A required
check (`check-label`) enforces this.

- **`release: major`**: a breaking change to the API or the record. Before
  1.0, breaking changes go in a minor.
- **`release: minor`**: a new capability, or a parser change that alters
  readings.
- **`release: patch`**: vocabulary additions and bug fixes, and any other
  change to what the package ships.
- **`release: none`**: only for changes that never reach the package: the
  workbench, tests, scripts, docs, CI, and editor and repo config. CI rejects
  `release: none` when any changed file is outside the allowlist in
  `.github/workflows/require-release-label.yml`. Changes to `package.json`
  or `pnpm-lock.yaml` always need a real label.

The test is "would Climbing Logbook, or anyone else using the package,
notice or need to know?" Any yes is at least a patch.

## Cutting a release

`release.yml` runs when any PR merges, one run at a time. GitHub keeps only
the newest run waiting in that queue and cancels the one before it, so each
run releases every labelled PR merged since the latest tag, not just its
own. A cancelled run loses nothing.

1. `scripts/plan-releases.mjs` walks `main`'s first-parent history from the
   latest `vX.Y.Z` tag to this run's merge commit, oldest first. Each
   untagged commit whose PR has a `major`, `minor` or `patch` label gets the
   next version, from its own label. If the latest tag isn't in the merge
   commit's history, the run fails rather than re-releasing old versions.
2. For each planned version, oldest first, it checks out that PR's merge
   commit, runs the tests, builds the types, packs the package with that
   version, tags the commit and pushes only the tag, and publishes the
   package to GitHub Packages.
3. It then creates a GitHub Release with generated notes and the packed
   package attached. A Release that fails to create logs a warning and
   doesn't stop the remaining versions.

The job uses the default `GITHUB_TOKEN`, with `contents: write`,
`packages: write` and `pull-requests: read`. Nothing else is triggered by
the tag. The workflow never pushes to `main`, so branch protection is
unaffected. `workflow_dispatch` remains as a manual override: it releases
`main`'s tip with the chosen bump.
