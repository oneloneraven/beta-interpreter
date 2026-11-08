# 8. Carry unmentioned limbs over between movements

## Status

Accepted

## Context

ADR-0006 left each movement's states partial: a state held only the limbs
its own steps mentioned. Real beta names one or two limbs at a time, so
after "both hands on the jug, then right foot to the edge", the movement
record didn't say the hands were still on the jug. Climbing Logbook's
analysis would have had to rebuild that itself, before readings are stored
there (#23).

## Decision

Each movement's start carries over every placed limb from the state the
previous movement left, unless the movement states that limb itself. Its
end is that start with the moving limbs updated, so both states are
complete. A carried limb keeps its hold and techniques, and its contact is
marked `carried: true` while keeping its original side and hold
provenance. Unplaced limbs and full-body techniques aren't carried, and no
limb is carried into a state that has an unplaced limb of the same part,
since that limb may be the one carried.

## Consequences

- States are complete as far as the beta places limbs, so analysis can read
  a movement on its own.
- `carried` keeps what each movement said apart from what it inherited.
- The workbench's confidence score ignores carried contacts, so it still
  measures what was read.
- A stated limb always wins over a carried one, so a misread earlier
  movement can only leak into later movements through limbs the beta never
  mentions again.
