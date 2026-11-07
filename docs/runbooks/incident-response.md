# Incident response

What to do when a release is wrong, in order. Beta interpreter is a package,
not a service: an incident is a published version that misreads beta, breaks
its callers, or was built from something it shouldn't have been. After it's
over, write a review from the [post-incident review template](post-incident-review.md).

## Severity

| Severity | Examples | Respond |
|---|---|---|
| **P1: callers break** | A release throws on ordinary beta; the record's shape changed without a major label; a tampered or unexpected version is published | Within the hour |
| **P2: readings are wrong** | A release misreads beta that earlier versions read correctly | Same day |
| **P3: worth knowing** | A new unknown word or ambiguity that real beta keeps hitting | Weekly |

## The first 10 minutes

1. **Is it real?** Reproduce it with `parse` on the reported text, at the
   version the caller has installed.
2. **Which release?** Find the first tag that shows it: compare readings at
   the previous tag. The corpus report's baseline helps here.
3. **Stop the spread.** If Climbing Logbook has installed it, pin it to the
   last good version through Climbing Logbook's own process.
4. **Fix forward** through a normal PR. Its release label cuts the fixed
   version.
5. **If the release was tampered with**, treat it as an account or token
   compromise: rotate credentials before anything else.

## Levers

| Lever | What it does | How |
|---|---|---|
| Pin the caller | Keeps Climbing Logbook on a good version | A Climbing Logbook PR that pins the previous version |
| Fix forward | Releases a corrected version | A normal PR with the right release label |
| Rotate a secret | Replaces a leaked credential | Revoke it at the source, then set the new value everywhere it's used |

## When the release job fails

Each run releases every labelled PR since the latest tag, oldest first
([versioning](../versioning.md#cutting-a-release)), so a failure on one
version stops every version after it until it's cleared.

- **A commit's tests or build fail.** Re-run the job if the cause was
  transient. If that commit can never be released, tag it by hand with
  the version the run planned for it, without publishing. The next run
  then skips it, and its change ships in the next version.
- **A version is tagged but not published.** The next run won't retry it.
  Check out the tag, set that version in `package.json`, pack it, and
  publish the tarball to GitHub Packages by hand.
