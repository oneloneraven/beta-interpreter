# Data protection: record of processing

What personal data Beta interpreter processes, why, where it goes and how long it's
kept. Keep this current: a change that collects new data or adds a processor
updates it in the same PR.

Beta text can identify a climber, so it's treated as personal data here even
when it carries no user or entry link.

## Processors

None. The package runs inside the caller and sends nothing anywhere. GitHub
hosts the repository, CI and the published package, and receives no
personal data from this project.

## Processing activities

| Data | Purpose | Lawful basis | Retention | Who can see it |
|---|---|---|---|---|
| Beta text passed to the package by Climbing Logbook | Read it into a structured record | Recorded in Climbing Logbook's record of processing | Not kept: the package holds it in memory for the call only | The caller |
| Beta samples export: hardest-move text, interpreter version and saved date, with no user or entry link, saved by Climbing Logbook's `pull-beta-samples` script to `~/.local/share/beta-interpreter/samples.json` (mode 0600) | Vocabulary work: find unknown and ambiguous words in real beta (`scripts/corpus-report.mjs`) | Legitimate interests, as recorded by Climbing Logbook for `beta_samples` | Each pull replaces the last, so the copy ages out with the table's 90 days | The maintainer, on their own machine |
| Corpus report baseline: each sample's text and its reading, saved by `corpus-report.mjs --save-baseline` to `~/.local/share/beta-interpreter/baseline.json` (mode 0600) | Show readings that changed since the baseline | Legitimate interests, as for the export | Until the next `--save-baseline` | The maintainer, on their own machine |

## Gaps to settle

- The baseline is keyed by sample text and is only replaced when a new
  baseline is saved, so it can keep text past the 90 days the samples table
  allows.
- The export only ages out when it's pulled again. A copy that's never
  re-pulled keeps rows past 90 days.

## Security measures

See the [threat model](threat-model.md) and [privacy rules](privacy.md).
