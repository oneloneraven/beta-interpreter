import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export const DATA_DIR = join(homedir(), ".local/share/beta-interpreter");
export const SAMPLES_FILE = join(DATA_DIR, "samples.json");

/** @typedef {{ text: string, interpreter_version?: string, created_at?: string }} Sample */

/** @param {string} [file] @returns {Sample[]} */
export function loadSamples(file = SAMPLES_FILE) {
  let raw;
  try {
    raw = readFileSync(file, "utf8");
  } catch (e) {
    if (/** @type {NodeJS.ErrnoException} */ (e).code === "ENOENT")
      throw new Error("No samples have been pulled. Run scripts/pull-beta-samples.mjs in Climbing Logbook.");
    throw e;
  }
  const samples = JSON.parse(raw);
  const valid =
    Array.isArray(samples) && samples.every(s => typeof s === "object" && s !== null && typeof s.text === "string");
  if (!valid) throw new Error("The samples file isn't a list of samples with text.");
  return samples;
}
