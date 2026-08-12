import { preferencesStepPublishSchema, teamStepPublishSchema } from "@vittamhub/types";

/**
 * Core Rule 3: every profile section is optional — skipping one lowers the
 * Trust Score, it must never block the profile from going live.
 *
 * Team and Preferences previously hard-blocked publishing, so a founder had
 * to reach step 9 before they could have a profile at all, and an untouched
 * step produced an "incomplete" error naming a section they had deliberately
 * skipped. These tests pin the publish-time leniency in place.
 */
describe("publish-time leniency for optional steps", () => {
  describe("team", () => {
    it("accepts a completely untouched step", () => {
      const result = teamStepPublishSchema.safeParse({});

      expect(result.success).toBe(true);
      // A startup has at least its founder — factual, not invented data.
      expect(result.data?.teamSize).toBe(1);
      expect(result.data?.hiringStatus).toBe("NOT_HIRING");
      expect(result.data?.members).toEqual([]);
    });

    it("accepts a missing section entirely", () => {
      expect(teamStepPublishSchema.safeParse(undefined ?? {}).success).toBe(true);
    });

    it("keeps what the founder actually filled in", () => {
      const result = teamStepPublishSchema.safeParse({ teamSize: 7, hiringStatus: "HIRING" });

      expect(result.data?.teamSize).toBe(7);
      expect(result.data?.hiringStatus).toBe("HIRING");
    });
  });

  describe("preferences", () => {
    it("accepts an untouched step rather than demanding a selection", () => {
      const result = preferencesStepPublishSchema.safeParse({});

      expect(result.success).toBe(true);
      expect(result.data?.lookingFor).toEqual([]);
    });

    it("keeps a real selection", () => {
      const result = preferencesStepPublishSchema.safeParse({ lookingFor: ["INVESTORS", "MENTORS"] });

      expect(result.data?.lookingFor).toEqual(["INVESTORS", "MENTORS"]);
    });
  });
});
