import { connectionListFiltersSchema, startupSearchFiltersSchema } from "@vittamhub/types";

import { ZodValidationPipe } from "./zod-validation.pipe";

const query = { type: "query" } as const;

describe("ZodValidationPipe query normalization", () => {
  it("accepts a single value for an array filter", () => {
    const pipe = new ZodValidationPipe(connectionListFiltersSchema);
    expect(pipe.transform({ status: "PENDING", page: "1" }, query)).toMatchObject({ status: ["PENDING"], page: 1 });
  });

  it("keeps repeated keys as they are", () => {
    const pipe = new ZodValidationPipe(startupSearchFiltersSchema);
    expect(pipe.transform({ stage: ["IDEA", "MVP"] }, query)).toMatchObject({ stage: ["IDEA", "MVP"] });
  });

  it("reads boolean filters from their string form, including false", () => {
    const pipe = new ZodValidationPipe(startupSearchFiltersSchema);
    expect(pipe.transform({ isFundraising: "true", hasRevenue: "false" }, query)).toMatchObject({
      isFundraising: true,
      hasRevenue: false,
    });
  });

  it("leaves bodies untouched", () => {
    const pipe = new ZodValidationPipe(connectionListFiltersSchema);
    expect(() => pipe.transform({ status: "PENDING" }, { type: "body" })).toThrow();
  });
});
