// Runs this working copy over the pulled samples: node scripts/corpus-report.mjs [--save-baseline] [--samples file]
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { parse, say } from "../src/index.js";
import { DATA_DIR, loadSamples } from "./samples-file.mjs";

/** @param {string} text */
export function readSample(text) {
  const reading = parse(text);
  return {
    steps: reading.beats.map(beat => say(beat)),
    unknown: reading.unknown.map(u => u.raw.toLowerCase()),
    ambiguous: reading.amb.map(a => a.word.toLowerCase()),
  };
}

/** @param {string[]} words */
function ranked(words) {
  const counts = new Map();
  for (const word of words) counts.set(word, (counts.get(word) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

/**
 * @param {string[]} texts
 * @param {Record<string, unknown>} [baseline]
 */
export function buildReport(texts, baseline) {
  const readings = Object.fromEntries(texts.map(text => [text, readSample(text)]));
  const all = Object.values(readings);
  return {
    readings,
    samples: texts.length,
    unknown: ranked(all.flatMap(r => r.unknown)),
    ambiguous: ranked(all.flatMap(r => r.ambiguous)),
    nothingRead: texts.filter(text => readings[text].steps.every(step => !step)),
    changed: baseline
      ? texts.filter(text => text in baseline && JSON.stringify(baseline[text]) !== JSON.stringify(readings[text]))
      : [],
  };
}

function main() {
  const args = process.argv.slice(2);
  const samplesAt = args.indexOf("--samples");
  if (samplesAt !== -1 && !args[samplesAt + 1]) throw new Error("--samples needs a file.");
  const samples = loadSamples(samplesAt === -1 ? undefined : args[samplesAt + 1]);
  const baselineFile = join(DATA_DIR, "baseline.json");
  const baseline = existsSync(baselineFile) ? JSON.parse(readFileSync(baselineFile, "utf8")) : undefined;
  const report = buildReport(
    samples.map(s => s.text),
    baseline,
  );

  console.log(`${report.samples} samples`);
  console.log("\nUnknown words:");
  for (const [word, n] of report.unknown) console.log(`  ${n}  ${word}`);
  console.log("\nAmbiguous words:");
  for (const [word, n] of report.ambiguous) console.log(`  ${n}  ${word}`);
  console.log("\nNothing read:");
  for (const text of report.nothingRead) console.log(`  ${text}`);
  console.log(baseline ? "\nChanged since the baseline:" : "\nNo baseline saved yet.");
  for (const text of report.changed) {
    console.log(
      `  ${text}\n    was: ${baseline[text].steps.join(" ")}\n    now: ${report.readings[text].steps.join(" ")}`,
    );
  }

  if (args.includes("--save-baseline")) {
    mkdirSync(dirname(baselineFile), { recursive: true });
    writeFileSync(baselineFile, JSON.stringify(report.readings), { mode: 0o600 });
    console.log(`\nBaseline saved to ${baselineFile}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
