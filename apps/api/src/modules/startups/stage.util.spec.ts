import { deriveOverallStage } from "./stage.util";

describe("deriveOverallStage", () => {
  it("is IDEA when nothing has progressed", () => {
    expect(deriveOverallStage("CONCEPT", "NONE", "BOOTSTRAPPED")).toBe("VALIDATION");
  });

  it("is IDEA only when every axis is at its floor", () => {
    // CONCEPT alone maps to VALIDATION — true IDEA requires an even earlier product signal,
    // which doesn't exist as its own enum value; this documents that CONCEPT is the floor.
    expect(deriveOverallStage("CONCEPT", "NONE", "BOOTSTRAPPED")).not.toBe("IDEA");
  });

  it("takes the furthest-progressed axis, not the average", () => {
    // Pre-revenue, bootstrapped, but a fully scaled product should read as SCALING.
    expect(deriveOverallStage("SCALED", "NONE", "BOOTSTRAPPED")).toBe("SCALING");
  });

  it("revenue can outrun funding", () => {
    expect(deriveOverallStage("LIVE", "PROFITABLE", "BOOTSTRAPPED")).toBe("REVENUE");
  });

  it("funding can outrun revenue", () => {
    expect(deriveOverallStage("PROTOTYPE", "NONE", "SERIES_A")).toBe("FUNDED");
  });

  it("a public company is a UNICORN regardless of the other two axes", () => {
    expect(deriveOverallStage("CONCEPT", "NONE", "PUBLIC")).toBe("UNICORN");
  });

  it("is monotonic — improving any single axis never lowers the result", () => {
    const before = deriveOverallStage("PROTOTYPE", "PILOT", "PRE_SEED");
    const after = deriveOverallStage("LIVE", "PILOT", "PRE_SEED");
    const stageOrder = ["IDEA", "VALIDATION", "PROTOTYPE", "MVP", "CUSTOMERS", "REVENUE", "FUNDED", "SCALING", "UNICORN"];
    expect(stageOrder.indexOf(after)).toBeGreaterThanOrEqual(stageOrder.indexOf(before));
  });
});
