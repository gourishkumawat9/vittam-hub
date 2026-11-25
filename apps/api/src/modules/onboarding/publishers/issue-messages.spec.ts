import { createMentorInputSchema } from "@vittamhub/types";

import { issueMessages } from "./issue-messages";

describe("issueMessages", () => {
  it("names the fields that were left out, instead of 'Required, Required'", () => {
    // Headline and availability are two of the four things a mentor is asked for at sign-up.
    const parsed = createMentorInputSchema.safeParse({
      expertise: ["Pricing"],
      industries: ["SAAS"],
      yearsExperience: 6,
      sessionTypes: ["ONE_ON_ONE"],
      languages: ["English"],
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) expect(issueMessages(parsed.error)).toBe("Headline is required, Availability is required");
  });

  it("keeps a message the form wrote itself", () => {
    const parsed = createMentorInputSchema.safeParse({ headline: "", expertise: [], industries: ["SAAS"], yearsExperience: 1, availability: "x", sessionTypes: ["ONE_ON_ONE"], pricingModel: "Free", languages: ["English"] });

    expect(parsed.success).toBe(false);
    if (!parsed.success) expect(issueMessages(parsed.error)).toBe("Add a short headline, Add at least one area you can help with");
  });
});
