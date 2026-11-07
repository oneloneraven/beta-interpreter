# 4. The vocabulary is data, not code

## Status

Accepted

## Context

Most of the interpreter's improvement comes from teaching it words:
synonyms, new terms and the limb, move and filler words around them. If the
vocabulary lived in code, every word would be a code change.

## Decision

Keep the vocabulary in data files under `vocabulary/`. Teaching the
interpreter means reviewed changes to those files.

## Consequences

- Vocabulary can be taught without touching the parser, including from the
  workbench, which writes the files directly.
- Every vocabulary change is a reviewed PR with a visible diff, and goes in
  its own PR, separate from workbench code.
- The vocabulary ships in the package, so callers get new words with each
  release.
