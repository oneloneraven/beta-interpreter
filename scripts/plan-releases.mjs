import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { bumpFromLabels, latestVersion, nextVersion } from "./next-version.mjs";

/** @typedef {{ number: number, labels: string[] }} Pull */
/** @typedef {{ sha: string, version: string, pr: number | null }} Release */
/** @typedef {(args: string[]) => string} Git */

/**
 * Oldest first, so a run whose waiting predecessor was cancelled still releases that predecessor's PR, in order.
 * @param {{ commits: string[], latest: string | null, isTagged: (sha: string) => boolean, prFor: (sha: string) => Pull | null }} input
 * @returns {Release[]}
 */
export function planReleases({ commits, latest, isTagged, prFor }) {
  /** @type {Release[]} */
  const plan = [];
  let version = latest;
  for (const sha of commits) {
    if (isTagged(sha)) continue;
    const pr = prFor(sha);
    const bump = pr && bumpFromLabels(pr.labels);
    if (!pr || !bump) continue;
    version = nextVersion(version, bump);
    plan.push({ sha, version, pr: pr.number });
  }
  return plan;
}

/**
 * @param {Git} git
 * @param {string | null} ancestor
 * @param {string} descendant
 */
function isAncestor(git, ancestor, descendant) {
  try {
    git(["merge-base", "--is-ancestor", String(ancestor), descendant]);
    return true;
  } catch {
    return false;
  }
}

/**
 * @param {{ git: Git, prFor: (sha: string) => Pull | null, mergeSha?: string, bump?: string }} input
 * @returns {Release[]}
 */
export function planFromRepo({ git, prFor, mergeSha, bump }) {
  const latest = latestVersion(git(["tag", "--list", "v*"]).split("\n").filter(Boolean));
  if (bump) return [{ sha: git(["rev-parse", "HEAD"]), version: nextVersion(latest, bump), pr: null }];
  if (!mergeSha) throw new Error("No merge commit to release from.");
  if (latest && !isAncestor(git, latest, mergeSha))
    throw new Error(`${latest} isn't in ${mergeSha}'s history, so there's no safe range to release from.`);
  const range = latest ? `${latest}..${mergeSha}` : mergeSha;
  const commits = git(["rev-list", "--reverse", "--first-parent", range]).split("\n").filter(Boolean);
  return planReleases({ commits, latest, isTagged: sha => git(["tag", "--points-at", sha]) !== "", prFor });
}

/**
 * @param {string} output
 * @param {string} sha
 * @returns {{ number: number, merge_commit_sha: string, labels: { name: string }[] }[]}
 */
export function parsePulls(output, sha) {
  try {
    const pulls = JSON.parse(output);
    if (Array.isArray(pulls)) return pulls;
  } catch {}
  const shown = output.length > 500 ? `${output.slice(0, 500)}...` : output;
  throw new Error(`gh api returned no usable pull request list for ${sha}: ${JSON.stringify(shown)}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  /** @param {string} cmd @param {string[]} args */
  const run = (cmd, args) => execFileSync(cmd, args, { encoding: "utf8" }).trim();
  const { MERGE_SHA, GITHUB_REPOSITORY, BUMP } = process.env;
  const plan = planFromRepo({
    git: args => run("git", args),
    mergeSha: MERGE_SHA,
    bump: BUMP,
    prFor: sha => {
      const pulls = parsePulls(run("gh", ["api", `repos/${GITHUB_REPOSITORY}/commits/${sha}/pulls`]), sha);
      const pr = pulls.find(p => p.merge_commit_sha === sha);
      return pr ? { number: pr.number, labels: pr.labels.map(l => l.name) } : null;
    },
  });
  process.stdout.write(`${JSON.stringify(plan)}\n`);
}
