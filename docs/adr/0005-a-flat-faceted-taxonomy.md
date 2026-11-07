# 5. A flat, faceted taxonomy

## Status

Accepted

## Context

The taxonomy started as a mind map grouped into terrain, features, holds,
hold orientation, positions and transitions. Real terms don't fit a tree:
sidepulls, underclings and gastons are both orientations and hand uses, a
crimp is both a hold and a grip, slots and pebbles are both features and
holds, compression and jams apply to hands and legs, and a chimney is
terrain, a feature and a move.

## Decision

Model the vocabulary as a flat set of terms that overlap rather than forming
a tree. Each term has facets, a body region and part, and the phrases it
matches.

## Consequences

- A term can belong to several facets without being duplicated.
- One word can match terms in different facets, so the parser has to choose
  between them, for example by the named limb, and ask when it can't.
- Questions about a facet (all holds, all positions) are filters over the
  set, not walks down a tree.
