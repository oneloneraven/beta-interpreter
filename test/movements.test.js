import { describe, expect, it } from "vitest";
import { parse, toMovements } from "../src/index.js";

/** @typedef {import("../src/movements.js").State} State @typedef {import("../src/movements.js").Contact} Contact */

/** @param {Contact} c */
const contact = c => ({
  side: c.side,
  hold: c.hold ? [c.hold.ori, ...c.hold.kinds].flatMap(t => (t ? [t.id] : [])) : [],
  holdSource: c.holdSource,
  techniques: c.techniques.map(t => t.id),
  ...(c.carried && { carried: true }),
});

/** @param {State} s */
const state = s => ({
  limbs: Object.fromEntries(Object.entries(s.limbs).map(([k, c]) => [k, contact(c)])),
  body: s.body.map(t => t.id),
  unplaced: s.unplaced.map(u => ({ part: u.part, ...contact(u) })),
});

/** @param {string} text */
const read = text =>
  toMovements(parse(text)).movements.map(m => ({
    start: state(m.start),
    transition: m.transition && {
      terms: m.transition.terms.map(t => t.id),
      limbs: m.transition.limbs,
      side: m.transition.side,
    },
    end: state(m.end),
    crux: m.crux,
  }));

const empty = { limbs: {}, body: [], unplaced: [] };

describe("toMovements", () => {
  it("moves the other hand after one hand establishes", () => {
    expect(read("get the left hand securely on the slopey crimp, then fire up for the hero jug")).toEqual([
      {
        start: {
          ...empty,
          limbs: { lh: { side: "stated", hold: ["sloper", "crimp"], holdSource: "stated", techniques: [] } },
        },
        transition: { terms: ["fire-up"], limbs: ["rh"], side: "inferred" },
        end: {
          ...empty,
          limbs: {
            lh: { side: "stated", hold: ["sloper", "crimp"], holdSource: "stated", techniques: [], carried: true },
            rh: { side: "inferred", hold: ["jug"], holdSource: "stated", techniques: [] },
          },
        },
        crux: true,
      },
    ]);
  });

  it("bumps with the same limb as the previous move", () => {
    expect(read("get the left hand securely on the slopey crimp, then big bump to the hero jug")).toEqual([
      {
        start: {
          ...empty,
          limbs: { lh: { side: "stated", hold: ["sloper", "crimp"], holdSource: "stated", techniques: [] } },
        },
        transition: { terms: ["bump"], limbs: ["lh"], side: "inferred" },
        end: { ...empty, limbs: { lh: { side: "inferred", hold: ["jug"], holdSource: "stated", techniques: [] } } },
        crux: true,
      },
    ]);
  });

  it("builds start states from set-up steps and carries the crux", () => {
    expect(
      read(
        "Steep cave. Both hands matched on the jug, right heel hook on the lip, cross left hand to a sidepull crimp, then deadpoint to the slopey pinch, crux! Match and rock over to finish.",
      ),
    ).toEqual([
      {
        start: {
          ...empty,
          limbs: {
            lh: { side: "stated", hold: ["jug"], holdSource: "stated", techniques: ["match"] },
            rh: { side: "stated", hold: ["jug"], holdSource: "stated", techniques: ["match"] },
            rf: { side: "stated", hold: ["lip"], holdSource: "stated", techniques: ["heel-hook"] },
          },
        },
        transition: { terms: ["crossover"], limbs: ["lh"], side: "stated" },
        end: {
          ...empty,
          limbs: {
            lh: { side: "stated", hold: ["sidepull", "crimp"], holdSource: "stated", techniques: [] },
            rh: { side: "stated", hold: ["jug"], holdSource: "stated", techniques: ["match"], carried: true },
            rf: { side: "stated", hold: ["lip"], holdSource: "stated", techniques: ["heel-hook"], carried: true },
          },
        },
        crux: false,
      },
      {
        start: {
          ...empty,
          limbs: {
            lh: { side: "stated", hold: ["sidepull", "crimp"], holdSource: "stated", techniques: [], carried: true },
            rh: { side: "stated", hold: ["jug"], holdSource: "stated", techniques: ["match"], carried: true },
            rf: { side: "stated", hold: ["lip"], holdSource: "stated", techniques: ["heel-hook"], carried: true },
          },
        },
        transition: { terms: ["deadpoint"], limbs: ["rh"], side: "inferred" },
        end: {
          ...empty,
          limbs: {
            lh: { side: "stated", hold: ["sidepull", "crimp"], holdSource: "stated", techniques: [], carried: true },
            rh: { side: "inferred", hold: ["sloper", "pinch"], holdSource: "stated", techniques: [] },
            rf: { side: "stated", hold: ["lip"], holdSource: "stated", techniques: ["heel-hook"], carried: true },
          },
        },
        crux: true,
      },
      {
        start: {
          ...empty,
          limbs: {
            lh: { side: "implied", hold: ["sloper", "pinch"], holdSource: "inferred", techniques: ["match"] },
            rh: { side: "implied", hold: ["sloper", "pinch"], holdSource: "inferred", techniques: ["match"] },
            rf: { side: "stated", hold: ["lip"], holdSource: "stated", techniques: ["heel-hook"], carried: true },
          },
        },
        transition: { terms: ["rockover"], limbs: [], side: null },
        end: {
          ...empty,
          limbs: {
            lh: {
              side: "implied",
              hold: ["sloper", "pinch"],
              holdSource: "inferred",
              techniques: ["match"],
              carried: true,
            },
            rh: {
              side: "implied",
              hold: ["sloper", "pinch"],
              holdSource: "inferred",
              techniques: ["match"],
              carried: true,
            },
            rf: { side: "stated", hold: ["lip"], holdSource: "stated", techniques: ["heel-hook"], carried: true },
          },
        },
        crux: false,
      },
    ]);
  });

  it("matches feet on the hold the last foot is on", () => {
    expect(read("right foot on the edge then match feet, then dyno to the jug")[0].start.limbs).toEqual({
      lf: { side: "stated", hold: ["edge"], holdSource: "inferred", techniques: ["match"] },
      rf: { side: "stated", hold: ["edge"], holdSource: "stated", techniques: ["match"] },
    });
  });

  it("puts a double knee bar on both legs", () => {
    expect(read("double knee bar then dyno to the jug")).toEqual([
      {
        start: {
          ...empty,
          limbs: {
            lf: { side: "stated", hold: [], holdSource: null, techniques: ["knee-bar"] },
            rf: { side: "stated", hold: [], holdSource: null, techniques: ["knee-bar"] },
          },
        },
        transition: { terms: ["dyno"], limbs: [], side: null },
        end: {
          ...empty,
          limbs: {
            lf: { side: "stated", hold: [], holdSource: null, techniques: ["knee-bar"], carried: true },
            rf: { side: "stated", hold: [], holdSource: null, techniques: ["knee-bar"], carried: true },
          },
          unplaced: [{ part: "hand", side: null, hold: ["jug"], holdSource: "stated", techniques: [] }],
        },
        crux: true,
      },
    ]);
  });

  it("puts compression on both hands, with its hold", () => {
    expect(read("compression on the arete then paddle up the rail")[0].start).toEqual({
      ...empty,
      limbs: {
        lh: { side: "implied", hold: ["arete"], holdSource: "stated", techniques: ["compression-hands"] },
        rh: { side: "implied", hold: ["arete"], holdSource: "stated", techniques: ["compression-hands"] },
      },
    });
  });

  it("records a movement to a target hold with no named transition", () => {
    expect(read("lock off to the crimp")).toEqual([
      {
        start: {
          ...empty,
          unplaced: [{ part: "hand", side: null, hold: [], holdSource: null, techniques: ["lock-off"] }],
        },
        transition: { terms: [], limbs: [], side: null },
        end: {
          ...empty,
          unplaced: [{ part: "hand", side: null, hold: ["crimp"], holdSource: "stated", techniques: [] }],
        },
        crux: true,
      },
    ]);
  });

  it("keeps body positions at body level and ends on a state with no transition", () => {
    expect(read("overhead press then body jam")).toEqual([
      { start: { ...empty, body: ["overhead-press", "body-jam"] }, transition: null, end: empty, crux: false },
    ]);
  });

  it("leaves a bump unplaced when nothing has moved before it", () => {
    expect(read("bump to the jug")[0].transition).toEqual({ terms: ["bump"], limbs: [], side: null });
  });

  it("keeps a stated crux stated, and infers none when there are several moves", () => {
    const stated = toMovements(parse("dyno to the jug, crux"));
    const several = toMovements(parse("dyno to the jug, then deadpoint to the crimp"));
    expect([stated.movements[0].cruxSource, several.movements.map(m => m.crux)]).toEqual(["stated", [false, false]]);
  });

  it("keeps terrain and features at climb level", () => {
    const r = toMovements(parse("Overhanging arête. Squeeze it with compression, flag and paddle up the rail."));
    expect([r.terrain.map(t => t.id), r.features.map(t => t.id)]).toEqual([["overhang"], ["arete"]]);
  });

  it("closes a movement on place, so it doesn't fold into the next one's start", () => {
    const r = toMovements(parse("Place right heel in the gully. Left hand to the jug"));
    expect(r.movements.map(m => m.steps)).toEqual([[0], [1]]);
  });

  it("carries limbs a movement doesn't mention over from the previous movement", () => {
    const [first, second] = read("Both hands on the jug, then right foot to the edge, then left foot to the smear");
    const jug = { side: "stated", hold: ["jug"], holdSource: "stated", techniques: [], carried: true };
    expect(Object.keys(first.end.limbs).sort()).toEqual(["lh", "rf", "rh"]);
    expect([first.end.limbs.lh, first.end.limbs.rh]).toEqual([jug, jug]);
    expect(second.start.limbs).toMatchObject({ lh: jug, rh: jug, rf: { hold: ["edge"], carried: true } });
    expect(Object.keys(second.end.limbs).sort()).toEqual(["lf", "lh", "rf", "rh"]);
  });

  it("doesn't carry a limb into the end when an unsettled limb of that part moved", () => {
    const [m] = read("Both hands on the jug, then dyno to the lip");
    expect([Object.keys(m.end.limbs), m.end.unplaced.map(u => u.part)]).toEqual([[], ["hand"]]);
  });

  it("records how far a move goes on its transition", () => {
    const r = toMovements(parse("Left hand to the jug. Bump right hand further up the rail"));
    expect(r.movements.map(m => m.transition?.extent)).toEqual([[], ["further"]]);
  });

  it("records each stated wall angle against its movement, and infers none", () => {
    const r = toMovements(
      parse("Left hand to the jug on the slab. Right hand to the crimp in the roof. Left hand to the rail"),
    );
    expect([r.terrain.map(t => t.id), r.movements.map(m => m.terrain.map(t => t.id))]).toEqual([
      ["slab", "roof"],
      [["slab"], ["roof"], []],
    ]);
  });
});
