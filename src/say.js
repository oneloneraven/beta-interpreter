/** @typedef {import("./interpreter.js").Beat} Beat @typedef {import("./interpreter.js").Hold} Hold */

/** @param {string} w */
const art = w => (/^[aeiou]/i.test(w) ? "an" : "a");
/** @type {Record<string, string>} */
const ROLE = { start: "from", target: "to", on: "on" };
/** @type {Record<string, string>} */
const PLURAL = { foot: "feet" };
/** @type {Record<string, string>} */
const MOVE_NAME = { upper: "hand move", lower: "foot move", full: "full-body move" };
/** @param {string} s */
const cap = s => s[0].toUpperCase() + s.slice(1);

/** @param {Beat} b */
export function who(b) {
  const part = b.part;
  if (b.side === "both") return part ? `Both ${PLURAL[part] ?? `${part}s`}` : "Both";
  if (b.side && part) return `${cap(b.side)} ${part}`;
  if (b.side) return cap(b.side);
  return "";
}

/** @param {string} w */
const pluralWord = w => (/(s|sh|ch|x|z)$/.test(w) ? `${w}es` : /[^aeiou]y$/.test(w) ? `${w.slice(0, -1)}ies` : `${w}s`);
/** @param {string} name */
const pluralName = name => {
  const at = name.lastIndexOf(" ") + 1;
  return name.slice(0, at) + pluralWord(name.slice(at));
};

/** @type {Set<string>} */
const BESIDE = new Set(["left", "right", "upper"]);
/** @type {Set<string>} */
const PART_OF = new Set(["top", "bottom", "back", "side", "front"]);

/** @param {Hold} h @returns {[string[], string[]]} */
function split(h) {
  if (h.of && h.where.every(w => BESIDE.has(w))) return [[], h.where];
  if (h.of) {
    const i = h.where.findIndex(w => !BESIDE.has(w));
    return [h.where.slice(0, i), h.where.slice(i)];
  }
  const withPart = h.where.map((w, i) => !BESIDE.has(w) || PART_OF.has(h.where[i + 1] ?? ""));
  return [h.where.filter((_, i) => !withPart[i]), h.where.filter((_, i) => withPart[i])];
}

/** @param {Hold} h */
export function holdName(h) {
  const kinds = h.kinds.map(k => (h.plural.includes(k.id) ? pluralName(k.name.toLowerCase()) : k.name.toLowerCase()));
  return [...h.qualifiers, ...split(h)[0], ...(h.ori ? [h.ori.name.toLowerCase()] : []), ...kinds].join(" ");
}

/** @param {Hold} h @param {string} name */
const counted = (h, name) => (h.plural.length ? name : `${art(name)} ${name}`);

/** @param {NonNullable<Hold["of"]>} of */
function anchorPhrase(of) {
  if (of.kind === "hold") return counted(of.hold, holdName(of.hold));
  if (of.kind === "terrain") return `the ${of.term.name.toLowerCase()}`;
  return ["the", of.side, of.part].filter(Boolean).join(" ");
}

/** @param {Hold} h */
function holdPhrase(h) {
  const name = holdName(h);
  const rest = split(h)[1];
  const role = h.role ? ROLE[h.role] : "";
  if (!rest.length) return name && role ? `${role} ${counted(h, name)}` : "";
  const where = rest.join(" ");
  if (!h.of && !rest.some(w => PART_OF.has(w)))
    return [name && role, name && counted(h, name), `(${where})`].filter(Boolean).join(" ");
  if (!h.of) return [role, `the ${where}`, name && `of ${counted(h, name)}`].filter(Boolean).join(" ");
  const located = PART_OF.has(rest[0])
    ? `at the ${where} of ${anchorPhrase(h.of)}`
    : `${where}${BESIDE.has(rest[rest.length - 1]) ? " of" : ""} ${anchorPhrase(h.of)}`;
  return [name && role, name && counted(h, name), located].filter(Boolean).join(" ");
}

/** @param {Beat} b */
export function say(b) {
  const names = [...b.moves, ...b.pos].map(x => x.name.toLowerCase());
  if (b.move !== undefined && !b.moves.length) names.unshift(MOVE_NAME[b.move ?? ""] ?? "move");
  const actions = names.join(", ");
  const body = [actions, ...b.holds.map(holdPhrase)].filter(Boolean).join(" ");
  const w = who(b);
  if (w) return `${w}: ${body}.`;
  return body ? `${cap(body)}.` : "";
}
