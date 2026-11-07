# 7. A package for Climbing Logbook

## Status

Accepted

## Context

Beta interpreter spun out of Climbing Logbook's movement taxonomy work and
is developed in its own repository. Climbing Logbook is its first caller.

## Decision

Climbing Logbook uses the interpreter as a versioned package, not a
submodule.

## Consequences

- Climbing Logbook chooses when to take a new version, and each version is
  a tagged, released and published artefact ([versioning](../versioning.md)).
- Release labels have to describe the change to callers accurately, because
  a reading change reaches Climbing Logbook only through a version bump.
- How Climbing Logbook installs the package from GitHub Packages is settled
  as part of the integration (#23).
