import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadSamples } from "../scripts/samples-file.mjs";

const dir = mkdtempSync(join(tmpdir(), "samples-"));
/** @param {string} name @param {unknown} data */
function saved(name, data) {
  const file = join(dir, name);
  writeFileSync(file, typeof data === "string" ? data : JSON.stringify(data));
  return file;
}

describe("loading pulled samples", () => {
  it("reads each sample's text, interpreter version and saved date", () => {
    const sample = { text: "Heel hook the lip", interpreter_version: "0.14.0", created_at: "2026-11-09 10:00:00" };
    expect(loadSamples(saved("ok.json", [sample]))).toEqual([sample]);
  });

  it("explains how to pull samples when there are none saved", () => {
    expect(() => loadSamples(join(dir, "missing.json"))).toThrow(
      "No samples have been pulled. Run scripts/pull-beta-samples.mjs in Climbing Logbook.",
    );
  });

  it.each([
    ["not a list", { text: "x" }],
    ["an entry with no text", [{ created_at: "2026-11-09" }]],
    ["an entry that is not an object", ["Heel hook"]],
  ])("refuses a file that is %s", (_, data) => {
    expect(() => loadSamples(saved("bad.json", data))).toThrow("The samples file isn't a list of samples with text.");
  });
});
