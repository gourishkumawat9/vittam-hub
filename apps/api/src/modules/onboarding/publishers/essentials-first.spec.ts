import { createMentorInputSchema, personalDetailsInputSchema } from "@vittamhub/types";

/**
 * Sign-up asks only for what a profile needs to go live (the owner's call,
 * November 2026, modelled on BHASKAR's short registration). These tests pin
 * the minimum in place, so a field can't quietly become required again and
 * stop people at the first step.
 */
describe("sign-up asks only for the essentials", () => {
  describe("personal details", () => {
    const essentials = { fullName: "Asha Rao", mobileNumber: "9876543210", city: "Jaipur" };

    it("accepts a name, a mobile number and a city alone", () => {
      const result = personalDetailsInputSchema.safeParse(essentials);

      expect(result.success).toBe(true);
    });

    it("treats empty optional fields as left out, not as invalid", () => {
      const result = personalDetailsInputSchema.safeParse({ ...essentials, dateOfBirth: "", gender: "", nationality: "", state: "", country: "" });

      expect(result.success).toBe(true);
      expect(result.data?.dateOfBirth).toBeUndefined();
      expect(result.data?.gender).toBeUndefined();
      expect(result.data?.country).toBeUndefined();
    });

    it("still checks a date of birth that is given", () => {
      expect(personalDetailsInputSchema.safeParse({ ...essentials, dateOfBirth: "not a date" }).success).toBe(false);
      expect(personalDetailsInputSchema.safeParse({ ...essentials, dateOfBirth: "1995-04-12" }).success).toBe(true);
    });

    it("still requires the three essentials", () => {
      expect(personalDetailsInputSchema.safeParse({ fullName: "Asha Rao", city: "Jaipur" }).success).toBe(false);
      expect(personalDetailsInputSchema.safeParse({ fullName: "Asha Rao", mobileNumber: "9876543210" }).success).toBe(false);
    });
  });

  describe("mentor profile", () => {
    const essentials = {
      headline: "Ex product lead. Pricing and go to market.",
      expertise: ["Pricing"],
      sessionTypes: ["ONE_ON_ONE"],
      availability: "Weekday evenings",
    };

    it("accepts a headline, expertise, session types and availability alone", () => {
      const result = createMentorInputSchema.safeParse(essentials);

      expect(result.success).toBe(true);
      expect(result.data?.industries).toEqual([]);
      expect(result.data?.languages).toEqual([]);
      // Left out is stored as empty, so clearing a field later sticks.
      expect(result.data?.yearsExperience).toBeNull();
      expect(result.data?.pricingModel).toBeNull();
    });

    it("keeps the optional answers that are given", () => {
      const result = createMentorInputSchema.safeParse({ ...essentials, yearsExperience: "8", pricingModel: "Free", languages: ["Hindi"] });

      expect(result.data?.yearsExperience).toBe(8);
      expect(result.data?.pricingModel).toBe("Free");
      expect(result.data?.languages).toEqual(["Hindi"]);
    });

    it("still requires something founders can choose on", () => {
      expect(createMentorInputSchema.safeParse({ ...essentials, expertise: [] }).success).toBe(false);
      expect(createMentorInputSchema.safeParse({ ...essentials, sessionTypes: [] }).success).toBe(false);
      expect(createMentorInputSchema.safeParse({ ...essentials, availability: "" }).success).toBe(false);
    });
  });
});
