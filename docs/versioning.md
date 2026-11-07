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

When a labelled PR merges, `release.yml`:

1. reads the label (`none` stops here);
2. finds the latest `vX.Y.Z` tag and computes the next version
   (`scripts/next-version.mjs`);
3. runs the tests, builds the types and packs the package with that version;
4. tags the PR's merge commit and pushes only the tag;
5. creates a GitHub Release with generated notes and the packed package
   attached;
6. publishes the package to GitHub Packages.

The job uses the default `GITHUB_TOKEN`, with `contents: write` and
`packages: write`. Nothing else is triggered by the tag. The workflow never
pushes to `main`, so branch protection is unaffected. `workflow_dispatch`
remains as a manual override.
