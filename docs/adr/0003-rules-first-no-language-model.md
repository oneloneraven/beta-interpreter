# 3. Rules first, no language model

## Status

Accepted

## Context

Beta interpreter reads climbing beta written as free text. The vocabulary of
climbing movement is finite: terrain, features, holds, orientations,
positions and transitions. Climbing Logbook's users are often at the crag,
on slow connections.

A language model could read looser text, but it needs a download or a
network call, it is slower, and its readings can't be explained term by
term.

## Decision

Interpret beta with rules over a finite vocabulary, with no language model.
Phrases are matched by longest match against the vocabulary, with
inflections and clear typos handled by rule.

A small model may be added later as a fallback, but only where real beta
shows the rules falling short.

## Consequences

- Readings are instant, work offline, need no download and can be explained
  word by word.
- Every word the rules don't know is surfaced as unknown or ambiguous, so
  gaps are visible and fixable rather than guessed at.
- Coverage grows only as fast as the vocabulary is taught, so real beta is
  needed to find the gaps.
