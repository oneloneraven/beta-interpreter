import { describe, expect, it } from "vitest";
import { parsePulls, planFromRepo, planReleases } from "../scripts/plan-releases.mjs";

/** @type {Record<string, { number: number, labels: string[] }>} */
const PRS = {
  a: { number: 1, labels: ["release: patch"] },
  b: { number: 2, labels: ["release: minor", "enhancement"] },
  c: { number: 3, labels: ["release: none"] },
  d: { number: 4, labels: [] },
};
/** @param {string} sha */
const prFor = sha => PRS[sha] ?? null;

/** @param {string[]} commits @param {{ tagged?: string[] }} [options] */
const plan = (commits, { tagged = [] } = {}) =>
  planReleases({ commits, latest: "v0.3.3", isTagged: sha => tagged.includes(sha), prFor });

describe("planning releases", () => {
  it("releases every labelled PR since the latest tag, oldest first, each with its own bump", () => {
    expect(plan(["a", "b"])).toEqual([
      { sha: "a", version: "v0.3.4", pr: 1 },
      { sha: "b", version: "v0.4.0", pr: 2 },
    ]);
  });

  it("skips release: none, unlabelled PRs, commits without a PR, and commits already tagged", () => {
    expect(plan(["a", "c", "d", "x", "b"], { tagged: ["a"] })).toEqual([{ sha: "b", version: "v0.4.0", pr: 2 }]);
  });

  it("plans nothing when nothing since the latest tag makes a release", () => {
    expect(plan(["c", "d"])).toEqual([]);
  });
});

describe("planning from the repository", () => {
  /** @param {{ ancestor?: boolean, tags?: string }} [options] */
  function fakeGit({ ancestor = true, tags = "v0.3.3\nv0.3.2\nnightly" } = {}) {
    /** @type {string[]} */
    const calls = [];
    /** @param {string[]} args */
    const git = args => {
      calls.push(args.join(" "));
      if (args[0] === "tag" && args[1] === "--list") return tags;
      if (args[0] === "merge-base") {
        if (!ancestor) throw new Error("not an ancestor");
        return "";
      }
      if (args[0] === "rev-list") return "a\nb";
      if (args[0] === "rev-parse") return "tip";
      if (args[0] === "tag" && args[1] === "--points-at") return "";
      throw new Error(`unexpected git ${args.join(" ")}`);
    };
    return { git, calls };
  }

  it("walks first-parent history from the latest tag to the merge commit, oldest first", () => {
    const { git, calls } = fakeGit();
    expect(planFromRepo({ git, prFor, mergeSha: "b" }).map(r => r.version)).toEqual(["v0.3.4", "v0.4.0"]);
    expect(calls).toContain("rev-list --reverse --first-parent v0.3.3..b");
  });

  it("refuses to plan when the latest tag isn't in the merge commit's history", () => {
    const { git } = fakeGit({ ancestor: false });
    expect(() => planFromRepo({ git, prFor, mergeSha: "b" })).toThrow(/no safe range/);
  });

  it("walks the whole history when nothing has been released", () => {
    const { git, calls } = fakeGit({ tags: "" });
    expect(planFromRepo({ git, prFor, mergeSha: "b" }).map(r => r.version)).toEqual(["v0.0.1", "v0.1.0"]);
    expect(calls).toContain("rev-list --reverse --first-parent b");
  });

  it("releases the checked-out commit with the given bump on a manual run", () => {
    const { git } = fakeGit();
    expect(planFromRepo({ git, prFor, bump: "minor" })).toEqual([{ sha: "tip", version: "v0.4.0", pr: null }]);
  });

  it("refuses to plan a PR run without a merge commit", () => {
    const { git } = fakeGit();
    expect(() => planFromRepo({ git, prFor })).toThrow("No merge commit to release from.");
  });
});

describe("reading the pull requests for a commit", () => {
  it("returns the pull request list", () => {
    expect(parsePulls('[{"number":1}]', "abc")).toEqual([{ number: 1 }]);
  });

  it.each(["", "not json", '{"message":"Not Found"}'])("names the commit and shows the raw output for %j", output => {
    expect(() => parsePulls(output, "abc")).toThrow(
      `gh api returned no usable pull request list for abc: ${JSON.stringify(output)}`,
    );
  });

  it("shortens long output in the error", () => {
    expect(() => parsePulls("x".repeat(600), "abc")).toThrow(`${"x".repeat(500)}...`);
  });
});
