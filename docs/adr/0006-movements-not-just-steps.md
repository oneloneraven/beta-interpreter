# 6. Movements, not just steps

## Status

Accepted. Its partial states are amended by [ADR-0008](0008-carry-unmentioned-limbs-over.md).

## Context

The first parser produced a flat list of steps. Climbing Logbook wants to
analyse movement trends, which needs to know what a climber's limbs were
doing before and after each move, not just the words in each step. Real beta
names only one or two limbs at a time.

## Decision

Build the record as movements. Each movement has a start state, a
transition and an end state. Each limb's side and hold is marked as stated,
implied or inferred.

## Consequences

- States are always partial, so analysis has to work on whatever facets are
  present.
- Marking how each limb's hold is known keeps what the beta said separate
  from what the interpreter filled in.
- Carrying unmentioned limbs over from the previous movement is a later step
  (#24).
