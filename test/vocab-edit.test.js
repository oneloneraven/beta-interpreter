import { describe, expect, it } from "vitest";
import { vocabulary } from "../src/index.js";
import {
  addPhrase,
  addTerm,
  addWord,
  addWords,
  movePhrase,
  owners,
  removePhrase,
  termId,
} from "../workbench/vocab-edit.js";

const fresh = () => structuredClone(vocabulary);
/** @param {import("../src/interpreter.js").Term[]} terms @param {string} id */
const matchOf = (terms, id) => terms.find(t => t.id === id)?.match;

describe("vocabulary edits", () => {
  it("adds a phrase to a term", () => {
    const { terms } = fresh();
    expect(matchOf(addPhrase(terms, "jug", "Thank God hold"), "jug")).toContain("thank god hold");
  });

  it("does not change the input", () => {
    const { terms } = fresh();
    addPhrase(terms, "jug", "thank god hold");
    expect(matchOf(terms, "jug")).not.toContain("thank god hold");
  });

  it("refuses a phrase the term already matches, however it is written", () => {
    expect(() => addPhrase(fresh().terms, "jug", "  JUG ")).toThrow("Jug already matches “jug”.");
  });

  it("refuses an unknown term or an empty phrase", () => {
    expect(() => addPhrase(fresh().terms, "nope", "x")).toThrow("No term has the id “nope”.");
    expect(() => addPhrase(fresh().terms, "jug", " ?! ")).toThrow("The phrase has no letters or numbers.");
  });

  it("removes a phrase by its normalised form", () => {
    expect(matchOf(removePhrase(fresh().terms, "jug", "Bucket"), "jug")).toEqual(["jug", "hero jug"]);
  });

  it("refuses to remove a phrase the term does not match", () => {
    expect(() => removePhrase(fresh().terms, "jug", "crimp")).toThrow("Jug does not match “crimp”.");
  });

  it("moves a phrase from one term to another", () => {
    const terms = movePhrase(fresh().terms, "dyno", "jump", "dynoed");
    expect([matchOf(terms, "dyno"), matchOf(terms, "jump")]).toEqual([
      ["dyno", "explode"],
      ["jump", "dynoed"],
    ]);
  });

  it("lists every term a phrase belongs to", () => {
    expect(owners(fresh().terms, "jam").map(t => t.id)).toEqual(["jam-hand", "jam-wedge"]);
  });

  it("adds a word to a grammar list", () => {
    expect(addWord(fresh().words, "filler", "Securely").filler).toContain("securely");
    expect(addWord(fresh().words, "qualifiers", "rough").qualifiers).toContain("rough");
    expect(addWord(fresh().words, "moves", "slap", [], "upper").moves.slap).toBe("upper");
    expect(addWord(fresh().words, "moves", "stamp", [], "lower").moves.stamp).toBe("lower");
  });

  it("refuses a word already in any grammar list, a term phrase, more than one word, or an unknown list", () => {
    expect(() => addWord(fresh().words, "filler", "the")).toThrow("“the” is already a filler word.");
    expect(() => addWord(fresh().words, "qualifiers", "the")).toThrow("“the” is already a filler word.");
    expect(() => addWord(fresh().words, "filler", "tiny")).toThrow("“tiny” is already a qualifier.");
    expect(() => addWord(fresh().words, "filler", "reach")).toThrow("“reach” is already a move word.");
    expect(() => addWord(fresh().words, "moves", "slap")).toThrow("A move word needs a region: upper, lower or full.");
    expect(() => addWord(fresh().words, "filler", "left")).toThrow("“left” is already a limb word.");
    expect(() => addWord(fresh().words, "filler", "very good")).toThrow("A word list takes single words.");
    expect(() => addWord(fresh().words, "filler", "jug", fresh().terms)).toThrow("“jug” is a vocabulary phrase (Jug).");
    expect(() => addWord(fresh().words, "limbs", "paw")).toThrow("No word list called “limbs” can be taught.");
  });

  it("adds several words at once and reports the ones it skipped", () => {
    const r = addWords(fresh().words, "filler", ["Think", "the", "jug", "think", "pretty"], fresh().terms);
    expect(r.added).toEqual(["think", "pretty"]);
    expect(r.skipped).toEqual([
      { word: "the", reason: "“the” is already a filler word." },
      { word: "jug", reason: "“jug” is a vocabulary phrase (Jug)." },
      { word: "think", reason: "“think” is already a filler word." },
    ]);
    expect(r.words.filler.slice(-2)).toEqual(["think", "pretty"]);
  });
});

describe("adding a term", () => {
  const add = (/** @type {object} */ draft) => {
    const { terms, words } = fresh();
    return addTerm(terms, words, { id: "nose-x", name: "Nose X", facets: ["feature"], match: ["nosex"], ...draft });
  };
  const idsOf = (/** @type {{ id: string }[]} */ terms) => terms.map(t => t.id);

  it("derives an id from the name", () => {
    expect(termId("Drop-Knee Élan (left)")).toBe("drop-knee-elan-left");
  });

  it("writes only the fields it was given, with normalised phrases", () => {
    const term = add({ match: [" NoseX ", "nosex", "Nose  Thing"] }).find(t => t.id === "nose-x");
    expect(term).toEqual({ id: "nose-x", name: "Nose X", facets: ["feature"], match: ["nosex", "nose thing"] });
  });

  it("does not change the input", () => {
    const { terms, words } = fresh();
    const before = terms.length;
    addTerm(terms, words, { id: "nose-x", name: "Nose X", facets: ["feature"], match: ["nosex"] });
    expect(terms).toHaveLength(before);
  });

  it("places the term after the last with the same first facet", () => {
    const { terms } = fresh();
    const lastFeature = terms.findLast(t => t.facets[0] === "feature")?.id;
    const next = idsOf(add({}));
    expect(next[next.indexOf("nose-x") - 1]).toBe(lastFeature);
  });

  it("never takes the default reading of a phrase from an existing term", () => {
    const next = add({ match: ["jam"] });
    const owners = next.filter(t => t.match.includes("jam"));
    expect(idsOf(owners)).toEqual(["jam-hand", "jam-wedge", "nose-x"]);
  });

  it("keeps a position's part and region", () => {
    const term = add({ facets: ["position"], part: "hand", region: "upper" }).find(t => t.id === "nose-x");
    expect(term).toMatchObject({ part: "hand", region: "upper" });
  });

  it.each([
    ["a duplicate id", { id: "jug" }, "The id “jug” is already used by Jug."],
    ["a malformed id", { id: "Nose X" }, "An id takes lowercase letters and numbers, joined by hyphens."],
    ["a missing name", { name: "  " }, "A term needs a name."],
    ["no facets", { facets: [] }, "A term needs at least one facet."],
    ["an invalid facet", { facets: ["crimp"] }, "“crimp” is not a facet."],
    ["a repeated facet", { facets: ["hold", "hold"] }, "“hold” is listed twice."],
    ["an invalid region", { region: "middle" }, "“middle” is not a region."],
    ["an invalid part", { part: "toe" }, "“toe” is not a part."],
    ["an unknown parent", { parent: "nope" }, "No term has the id “nope”."],
    ["a position with no part", { facets: ["position"], region: "upper" }, "A position needs a part and a region."],
    ["a position with no region", { facets: ["position"], part: "hand" }, "A position needs a part and a region."],
    ["a transition with no region", { facets: ["transition"] }, "A transition needs a region."],
    ["no phrases", { match: [" ?! "] }, "The phrase has no letters or numbers."],
    ["an empty phrase list", { match: [] }, "A term needs at least one phrase."],
  ])("refuses %s", (_, draft, message) => {
    expect(() => add(draft)).toThrow(message);
  });

  it("refuses a phrase that is already a grammar word", () => {
    const { words } = fresh();
    const [filler] = words.filler;
    expect(() => add({ match: [filler] })).toThrow(`“${filler}” is already a filler word.`);
    const split = [...words.splitAlways, ...words.splitBeforeMove].find(w => !words.filler.includes(w));
    expect(() => add({ match: [split] })).toThrow(`“${split}” is already a step break.`);
  });
});
