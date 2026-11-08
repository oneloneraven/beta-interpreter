import { describe, expect, it } from "vitest";
import pkg from "../package.json" with { type: "json" };
import { version } from "../src/index.js";

describe("version", () => {
  it("is the package's own version", () => {
    expect(version).toBe(pkg.version);
  });
});
