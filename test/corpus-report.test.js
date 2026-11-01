import { describe, expect, it } from "vitest";
import { buildReport } from "../scripts/corpus-report.mjs";

describe("corpus report", () => {
  it("ranks unknown words across samples and lists text it read nothing from", () => {
    const report = buildReport(["Heel hook to the zorp", "Cross to the zorp", "zorp"]);
    expect(report.samples).toBe(3);
    expect(report.unknown[0]).toEqual(["zorp", 3]);
    expect(report.nothingRead).toContain("zorp");
  });

  it("lists only readings that differ from the baseline", () => {
    const same = "Heel hook on the lip";
    const moved = "Cross to the crimp";
    const { readings } = buildReport([same, moved]);
    const baseline = { [same]: readings[same], [moved]: { ...readings[moved], steps: ["old"] } };
    expect(buildReport([same, moved, "new text"], baseline).changed).toEqual([moved]);
  });
});
