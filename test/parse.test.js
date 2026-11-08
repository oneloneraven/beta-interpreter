import { describe, expect, it } from "vitest";
import { createInterpreter, parse, say, vocabulary } from "../src/index.js";

describe("parse", () => {
  it("applies a resolution to an ambiguous word", () => {
    const r = parse("jam in the crack", { resolutions: new Map([["jam#0", 1]]) });
    expect(r.amb).toEqual([]);
    expect(r.beats[0].pos.map(t => t.id)).toEqual(["jam-wedge"]);
  });

  it("narrows an ambiguous word by the named limb", () => {
    const r = parse("left foot jam in the crack");
    expect(r.amb).toEqual([]);
    expect(r.beats[0].pos.map(t => t.id)).toEqual(["jam-wedge"]);
  });

  it("stops asking about an ignored word", () => {
    expect(parse("bump to the horn", { ignored: new Set(["bump"]) }).unknown).toEqual([]);
  });

  it("does not read object property names as vocabulary", () => {
    const r = parse("constructor toString hasOwnProperty");
    expect(r.unknown.map(u => u.raw)).toEqual(["constructor", "toString", "hasOwnProperty"]);
    expect(r.beats.map(b => b.unread)).toEqual([true]);
  });

  it("splits on 'and' before a transition", () => {
    expect(parse("match and rock over").beats.map(say)).toEqual(["Match.", "Rockover."]);
  });

  it("splits on 'then'", () => {
    expect(parse("heel hook then toe hook").beats.map(say)).toEqual(["Heel hook.", "Toe hook."]);
  });

  it("traces every token with how it was read", () => {
    expect(parse("lh on the sloppr jugg, then fire up").trace.map(t => [t.text, t.kind, t.key ?? null])).toEqual([
      ["lh", "limb", null],
      ["on", "prep", null],
      ["the", "filler", null],
      ["sloppr", "term", "sloper"],
      ["jugg", "unknown", null],
      [",", "split", null],
      ["then", "split", null],
      ["fire up", "term", "fire up"],
    ]);
  });

  it("tags tokens and steps with their clause", () => {
    const r = parse("lh on the jug, then fire up");
    expect(r.trace.map(t => t.clause)).toEqual([0, 0, 0, 0, 1, 2, 2]);
    expect(r.beats.map(b => b.clause)).toEqual([0, 2]);
  });

  it("keeps a word with a curly apostrophe together", () => {
    expect(parse("I don’t think it’s hard").unknown.map(u => u.raw)).toEqual(["don’t", "think"]);
  });

  it("only suggests a correction that is plausibly a typo", () => {
    const guesses = parse("did hok sloppers").unknown.map(u => [u.raw, u.guess]);
    expect(guesses).toEqual([
      ["did", undefined],
      ["hok", "hook"],
    ]);
  });

  it("marks the crux only when the beta says crux", () => {
    expect(parse("heel hook, crux! then dyno to the jug!").beats.map(b => b.crux)).toEqual([true, false]);
  });

  it("reads plural limbs as both sides", () => {
    expect(parse("hands on the jug, feet on the edge, knees on the rail").beats.map(b => b.side)).toEqual([
      "both",
      "both",
      "both",
    ]);
  });

  it("reads reach, catch and grab as an unnamed hand move", () => {
    const r = parse("reach the jug, catch the sloper, grab the crimp");
    expect(r.beats.map(b => [b.part, b.move, b.holds[0].role, say(b)])).toEqual([
      ["hand", "upper", "target", "Hand move to a jug."],
      ["hand", "upper", "target", "Hand move to a sloper."],
      ["hand", "upper", "target", "Hand move to a crimp."],
    ]);
  });

  it("reads taught move words for the foot and the full body", () => {
    const { parse: read } = createInterpreter({
      ...vocabulary,
      words: { ...vocabulary.words, moves: { ...vocabulary.words.moves, stamp: "lower", launch: "full" } },
    });
    const r = read("stamp the edge, then launch up");
    expect(r.beats.map(b => [b.part, b.move, say(b)])).toEqual([
      ["foot", "lower", "Foot move to an edge."],
      ["body", "full", "Full-body move."],
    ]);
  });

  it("starts a new step at 'and' when a hand move follows a named foot", () => {
    expect(parse("stomp the left foot on the rail and push hard to reach the lip").beats.length).toBe(2);
  });

  it("reads stand as a transition and sit as a position", () => {
    const r = parse("sit on the ledge, then stand up");
    expect(r.beats.map(b => [...b.pos, ...b.moves].map(t => t.id))).toEqual([["sit"], ["stand-up"]]);
  });

  it("attaches qualifiers to the hold that follows them", () => {
    const r = parse("feet on the small dishes, then reach the sharp shallow crimp");
    expect(r.beats.map(b => b.holds.map(h => h.qualifiers))).toEqual([[["small"]], [["sharp", "shallow"]]]);
    expect(r.beats.map(say)).toEqual(["Both feet: on small dishes.", "Hand move to a sharp shallow crimp."]);
  });

  it("keeps a qualifier on the step when a role word or move comes before the hold", () => {
    const { parse: read } = createInterpreter({
      ...vocabulary,
      words: { ...vocabulary.words, qualifiers: [...vocabulary.words.qualifiers, "hard"] },
    });
    const [b] = read("push hard to reach the lip").beats;
    expect([b.qualifiers, b.holds[0].qualifiers, say(b)]).toEqual([["hard"], [], "Hand move to a lip."]);
  });

  it("keeps a qualifier with no hold after it on the step", () => {
    expect(parse("massive dyno").beats[0].qualifiers).toEqual(["massive"]);
  });

  it("keeps plural holds plural", () => {
    const r = parse(
      "feet on the small dishes, hands on the crimps, left hand on the jug, then reach the two finger pockets",
    );
    expect(r.beats.map(b => b.holds.map(h => h.plural))).toEqual([
      [["dish"]],
      [["crimp"]],
      [[]],
      [["two-finger-pocket"]],
    ]);
    expect(r.beats.map(say)).toEqual([
      "Both feet: on small dishes.",
      "Both hands: on crimps.",
      "Left hand: on a jug.",
      "Hand move to two finger pockets.",
    ]);
  });

  it("keeps a plural hold plural when it merges with a singular one", () => {
    const [b] = parse("hands on the crimps at the back of the slopey rail").beats;
    expect([b.holds[0].plural, say(b)]).toEqual([["crimp"], "Both hands: on crimps at the back of a sloper rail."]);
  });

  it("returns nothing for empty text", () => {
    expect(parse("")).toMatchObject({ beats: [], unknown: [], amb: [] });
  });
});

describe("the limb of a step", () => {
  /** @param {string} text */
  const limb = text => {
    const b = parse(text).beats[0];
    return [b.side, b.part];
  };

  it("comes from the first limb named, not a later hand that names a hold", () => {
    expect(limb("Step through left foot to press on vertical edge between starting hand holds")).toEqual([
      "left",
      "foot",
    ]);
  });

  it("is not changed by a side and hand named later as a location", () => {
    expect(limb("Move left hand to left crimp above left of the right hand")).toEqual(["left", "hand"]);
  });

  it("is not changed by a side that says where the hold is", () => {
    expect(limb("Move left hand to the crimp on the right")).toEqual(["left", "hand"]);
  });

  it("is not taken from a side that says which way to move", () => {
    expect(limb("Go right with left hand to the jug")).toEqual(["left", "hand"]);
    expect(limb("Reach up and right with your left hand to the crimp")).toEqual(["left", "hand"]);
  });

  it("keeps a side named on its own when no limb is named", () => {
    expect(limb("Go right to the jug")).toEqual(["right", null]);
  });
});

describe("where a hold is", () => {
  /** @param {string} text */
  const holds = text => parse(text).beats.flatMap(b => b.holds);
  /** @param {import("../src/index.js").Hold} h */
  const ids = h => h.kinds.map(k => k.id);

  it("places a hold at a part of another hold", () => {
    const r = parse("Left hand to the crimps at the back of the slopey rail");
    const [crimps] = r.beats[0].holds;
    expect(r.beats[0].holds).toHaveLength(1);
    expect([ids(crimps), crimps.where, crimps.qualifiers]).toEqual([["crimp"], ["back"], []]);
    expect(crimps.of?.kind === "hold" && ids(crimps.of.hold)).toEqual(["sloper", "rail"]);
  });

  it("names a part of the hold itself when nothing comes before it", () => {
    for (const [text, kind, where] of [
      ["Match on the top of the jug", "jug", "top"],
      ["Right foot on the bottom of the flake", "flake", "bottom"],
      ["Left hand to the side of the arete", "arete", "side"],
      ["Left hand to the upper crimp", "crimp", "upper"],
    ]) {
      const [h] = holds(text);
      expect([ids(h), h.where, h.of]).toEqual([[kind], [where], null]);
    }
  });

  it("places a hold relative to terrain", () => {
    const r = parse("Right foot on the edge under the roof");
    const [edge] = r.beats[0].holds;
    expect([ids(edge), edge.where, edge.of?.kind === "terrain" && edge.of.term.id]).toEqual([
      ["edge"],
      ["under"],
      "roof",
    ]);
    expect(r.unknown).toEqual([]);
  });

  it("places a hold relative to another hold", () => {
    const [pinch] = holds("Left hand to the pinch between the two crimps");
    expect([ids(pinch), pinch.where, pinch.of?.kind === "hold" && ids(pinch.of.hold)]).toEqual([
      ["pinch"],
      ["between"],
      ["crimp"],
    ]);
  });

  it("reads a side that describes a hold as where it is, not as the limb", () => {
    const rail = parse("Right hand to the rail on the left").beats[0];
    expect([rail.side, rail.part, rail.holds[0].where]).toEqual(["right", "hand", ["left"]]);
  });

  it("traces a side that describes a hold as a location", () => {
    const r = parse("Right hand to the rail on the left");
    expect(r.trace.filter(t => t.text === "left").map(t => t.kind)).toEqual(["location"]);
  });

  it("places a hold relative to a limb", () => {
    const b = parse("Move left hand to left crimp above left of the right hand").beats[0];
    const [crimp] = b.holds;
    expect([b.side, b.part, ids(crimp), crimp.where]).toEqual(["left", "hand", ["crimp"], ["left", "above", "left"]]);
    expect(crimp.of).toEqual({ kind: "limb", side: "right", part: "hand" });
  });

  it("places a hold to one side of another", () => {
    const [crimp] = holds("Left hand to the crimp left of the jug");
    expect([ids(crimp), crimp.where, crimp.of?.kind === "hold" && ids(crimp.of.hold)]).toEqual([
      ["crimp"],
      ["left"],
      ["jug"],
    ]);
  });

  it("keeps a side with the part of the hold it names", () => {
    /** @param {string} text */
    const said = text => say(parse(text).beats[0]);
    expect(said("Right hand to the left side of the jug")).toBe("Right hand: to the left side of a jug.");
    expect(said("Move left foot to bottom of rail on the left")).toBe("Left foot: to the bottom of a left rail.");
  });

  it("reads a vocabulary with no location words", () => {
    const { locations, ...words } = vocabulary.words;
    const r = createInterpreter({ terms: vocabulary.terms, words }).parse("Left hand to the crimp under the roof");
    expect(r.unknown.map(u => u.raw)).toEqual(["under"]);
  });

  it("doesn't read a side that says which way to move as where a hold is", () => {
    expect(holds("Go right with left hand to the jug")[0].where).toEqual([]);
  });

  it("says where each hold is", () => {
    /** @param {string} text */
    const said = text => say(parse(text).beats[0]);
    expect(said("Left hand to the crimps at the back of the slopey rail")).toBe(
      "Left hand: to crimps at the back of a sloper rail.",
    );
    expect(said("Right foot on the edge under the roof")).toBe("Right foot: on an edge under the roof.");
    expect(said("Right foot on the bottom of the flake")).toBe("Right foot: on the bottom of a flake.");
    expect(said("Move left hand to left crimp above left of the right hand")).toContain(
      "to a left crimp above left of the right hand.",
    );
  });

  it.each(["under", "below", "above", "behind", "between", "upper", "bottom", "top", "back", "side", "front"])(
    "reads %s as where a hold is, not as unknown or a qualifier",
    word => {
      const r = parse(`Left hand to the crimp ${word} the jug`);
      expect([r.unknown, r.beats[0].holds[0].qualifiers, r.beats[0].holds[0].where]).toEqual([[], [], [word]]);
    },
  );
});

describe("a toe on a hold", () => {
  /** @param {string} text */
  const step = text => {
    const b = parse(text).beats[0];
    return { pos: b.pos.map(t => t.id), holds: b.holds.map(h => h.kinds.map(k => k.id)), said: say(b) };
  };

  it("reads a bare toe as a toe on the hold, not a toe hook", () => {
    expect(step("Left toe on jib")).toMatchObject({
      pos: ["toe"],
      holds: [["pebble"]],
      said: "Left foot: toe on a pebble.",
    });
    expect(step("Move right foot to press toe on horn")).toMatchObject({ pos: ["toe"], holds: [["horn"]] });
  });

  it("reads bare toes as a toe on the hold", () => {
    expect(step("Toes on the edge").pos).toEqual(["toe"]);
  });

  it("still reads a toe hook as a toe hook", () => {
    expect(step("Right toe hook on the horn").pos).toEqual(["toe-hook"]);
    expect(step("Right toehook on the horn").pos).toEqual(["toe-hook"]);
  });

  it("reads a heel and a toe joined by cam as one cam", () => {
    expect(step("Right heel on horn and cam the toe")).toMatchObject({ pos: ["cam"], holds: [["horn"]] });
    expect(step("Place right heel in gulley behind the flake and cam the toe").pos).toEqual(["cam"]);
  });

  it("keeps a heel hook and a toe hook named in full", () => {
    expect(step("Right heel hook and toe hook on the horn").pos).toEqual(["heel-hook", "toe-hook"]);
  });
});

describe("wall angles", () => {
  /** @param {import("../src/interpreter.js").Term[]} ts */
  const ids = ts => ts.map(t => t.id);

  it("reads a direction word before a hold as describing the hold, not the wall", () => {
    const r = parse("Left foot press on vertical edge");
    expect([ids(r.terrain), ids(r.beats[0].terrain), r.beats[0].holds[0].qualifiers]).toEqual([[], [], ["vertical"]]);
    expect(say(r.beats[0])).toBe("Left foot: on a vertical edge.");
  });

  it("reads a direction word as describing the hold across a qualifier", () => {
    const r = parse("Left hand on the vertical sharp edge");
    expect([ids(r.terrain), r.beats[0].holds[0].qualifiers]).toEqual([[], ["vertical", "sharp"]]);
  });

  it("keeps the typo notice when a corrected direction word describes a hold", () => {
    expect(parse("Left foot on verticle edge").fuzzy).toEqual([{ from: "verticle", to: "vertical" }]);
  });

  it("still reads a direction word on its own as a wall angle", () => {
    expect(ids(parse("Left hand up the vertical wall to the jug").terrain)).toEqual(["vert"]);
  });

  it("still reads an angle word before a feature as a wall angle", () => {
    expect(ids(parse("Left hand up the overhanging arête to the jug").beats[0].terrain)).toEqual(["overhang"]);
  });

  it("records a stated wall angle against its step only", () => {
    const r = parse("Left hand to the jug. Right hand to the crimp in the upper roof");
    expect(r.beats.map(b => ids(b.terrain))).toEqual([[], ["roof"]]);
    expect(ids(r.terrain)).toEqual(["roof"]);
  });

  it("keeps a scene-setting wall angle at climb level only", () => {
    const r = parse("Overhanging arête. Left hand to the jug");
    expect([ids(r.terrain), r.beats.map(b => ids(b.terrain))]).toEqual([["overhang"], [[]]]);
  });
});
