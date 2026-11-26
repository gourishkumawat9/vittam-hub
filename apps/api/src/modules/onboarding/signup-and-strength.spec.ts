import { mentorFeeLabel, profileStrength, registerInputSchema, startupDocumentPlan } from "@vittamhub/types";

/**
 * The BHASKAR-style sign-up and the profile strength meter (November 2026):
 * the short sign-up leaves a profile at 20%, and every other question shares
 * the remaining 80%.
 */
describe("BHASKAR-style sign-up", () => {
  const account = {
    email: "Asha@Example.com ",
    password: "Str0ngPassword",
    fullName: "Asha Rao",
    role: "FOUNDER",
    acceptedTerms: true,
  };

  it("takes who you are, a mobile number as people type it, and nationality", () => {
    const result = registerInputSchema.safeParse({ ...account, persona: "STUDENT", mobileNumber: "+91 98765-43210", nationality: "Indian" });

    expect(result.success).toBe(true);
    expect(result.data?.mobileNumber).toBe("+919876543210");
    expect(result.data?.email).toBe("asha@example.com");
  });

  it("still lets an older client sign up without them", () => {
    expect(registerInputSchema.safeParse(account).success).toBe(true);
  });

  it("refuses a persona that belongs to another role", () => {
    const result = registerInputSchema.safeParse({ ...account, persona: "INVESTMENT_FIRM" });
    expect(result.success).toBe(false);
  });

  it("refuses a mobile number that isn't one", () => {
    expect(registerInputSchema.safeParse({ ...account, mobileNumber: "call me" }).success).toBe(false);
  });
});

describe("profile strength", () => {
  const signUp = { fullName: "Asha Rao", mobileNumber: "+919876543210", nationality: "Indian" };

  it("is 20% right after sign-up, for every role", () => {
    for (const [role, persona] of [
      ["FOUNDER", "STARTUP_FOUNDER"],
      ["MENTOR", "MENTOR"],
      ["INVESTOR", "INDIVIDUAL_INVESTOR"],
      ["INVESTOR", "INVESTMENT_FIRM"],
      ["INCUBATOR", "ACCELERATOR"],
      ["UNIVERSITY", "INSTITUTION"],
    ] as const) {
      // What a new account's wizard opens on, including the prefilled investor type and incubator kind.
      // (draftFromSignUp: an individual investor is an angel; a firm picks its type on the next step.)
      const investorInfo = persona === "INDIVIDUAL_INVESTOR" ? { investorType: "ANGEL" } : {};
      const draft = { personalDetails: signUp, investorInfo, incubatorInfo: { kind: "ACCELERATOR" } };
      const strength = profileStrength({ role, persona, email: "asha@example.com", draft });
      expect({ role, persona, percent: strength.percent }).toEqual({ role, persona, percent: 20 });
      expect(strength.next.length).toBeGreaterThan(0);
    }
  });

  it("rises as questions are answered, and reaches 100% when all are", () => {
    const partial = profileStrength({
      role: "MENTOR",
      persona: "MENTOR",
      email: "asha@example.com",
      draft: { personalDetails: { ...signUp, city: "Jaipur" }, mentorInfo: { headline: "Pricing", feeType: "FREE" } },
    });
    expect(partial.percent).toBeGreaterThan(20);
    expect(partial.percent).toBeLessThan(100);

    const full = profileStrength({
      role: "MENTOR",
      persona: "MENTOR",
      email: "asha@example.com",
      draft: {
        personalDetails: { ...signUp, city: "Jaipur", avatarUrl: "https://x.test/a.jpg", linkedinUrl: "https://linkedin.com/in/a", bio: "Hi" },
        mentorInfo: {
          headline: "Pricing",
          mentorType: "FOUNDER_OPERATOR",
          expertise: ["Pricing"],
          stagesHelped: ["IDEA"],
          sessionTypes: ["ONE_ON_ONE"],
          meetingMode: "ONLINE",
          feeType: "PAID",
          sessionFeeAmount: 1500,
          sessionLengthMinutes: 45,
          availability: "Evenings",
          industries: ["SAAS"],
          yearsExperience: 9,
          languages: ["Hindi"],
          pastStartups: ["Acme"],
        },
      },
    });
    expect(full.percent).toBe(100);
    expect(full.next).toEqual([]);
  });

  it("asks a student for their college, and a registered founder for the incorporation certificate", () => {
    const student = profileStrength({ role: "FOUNDER", persona: "STUDENT", email: "a@b.co", draft: { personalDetails: signUp } });
    expect(student.questions.some((question) => question.key === "studentInstitution")).toBe(true);

    const registered = profileStrength({
      role: "FOUNDER",
      persona: "STARTUP_FOUNDER",
      email: "a@b.co",
      draft: { personalDetails: signUp, startupInfo: { registrationStatus: "REGISTERED" } },
      documentTypes: ["INCORPORATION_CERTIFICATE"],
    });
    expect(registered.questions.find((question) => question.key === "incorporation")?.done).toBe(true);
    expect(registered.questions.find((question) => question.key === "registration")?.done).toBe(false);
  });
});

describe("mentor fee label", () => {
  it("reads the same way on every profile", () => {
    expect(mentorFeeLabel({ feeType: "FREE" })).toBe("Free");
    expect(mentorFeeLabel({ feeType: "PAID", sessionFeeAmount: 2000, sessionLengthMinutes: 60, firstSessionFree: true })).toBe(
      "₹2,000 per 60-min session · first session free",
    );
    expect(mentorFeeLabel({ feeType: null })).toBeNull();
  });

  it("adds the group price per founder and free sessions for idea-stage founders", () => {
    expect(
      mentorFeeLabel({ feeType: "PAID", sessionFeeAmount: 20000, sessionLengthMinutes: 60, groupFeePerFounder: 2000, freeForIdeaStage: true }),
    ).toBe("₹20,000 per 60-min session · group sessions ₹2,000 per founder · free for idea-stage founders");
  });
});

describe("documents by kind of startup", () => {
  it("asks an unregistered founder for a deck and their own ID, not company papers", () => {
    const plan = startupDocumentPlan({ registrationStatus: "NOT_REGISTERED" });
    expect(plan.tier).toBe("NOT_REGISTERED");
    expect(plan.key).toEqual(["PITCH_DECK", "GOVERNMENT_ID"]);
    expect([...plan.key, ...plan.more]).not.toContain("INCORPORATION_CERTIFICATE");
  });

  it("adds a student ID up front for a student who hasn't registered", () => {
    expect(startupDocumentPlan({ registrationStatus: "NOT_REGISTERED", persona: "STUDENT" }).key).toContain("STUDENT_ID");
    expect(startupDocumentPlan({ registrationStatus: "REGISTERED", persona: "STUDENT" }).more).toContain("STUDENT_ID");
  });

  it("asks a registered company for its papers, and one with revenue or a round for its financials", () => {
    expect(startupDocumentPlan({ registrationStatus: "IN_PROGRESS" }).tier).toBe("REGISTERING");
    expect(startupDocumentPlan({ registrationStatus: "REGISTERED", revenueStatus: "NONE", fundingStatus: "BOOTSTRAPPED" }).key).toEqual([
      "PITCH_DECK",
      "INCORPORATION_CERTIFICATE",
      "DPIIT_RECOGNITION",
    ]);
    const growth = startupDocumentPlan({ registrationStatus: "REGISTERED", revenueStatus: "FIRST_REVENUE", fundingStatus: "SERIES_A" });
    expect(growth.tier).toBe("GROWTH");
    expect(growth.key).toContain("FINANCIAL_STATEMENT");
  });

  it("counts the documents that fit the startup towards profile strength", () => {
    const idea = profileStrength({
      role: "FOUNDER",
      persona: "EXPLORER",
      email: "a@b.co",
      draft: { startupInfo: { registrationStatus: "NOT_REGISTERED" } },
      documentTypes: ["GOVERNMENT_ID"],
    });
    expect(idea.questions.find((question) => question.key === "founderId")?.done).toBe(true);
    expect(idea.questions.some((question) => question.key === "incorporation")).toBe(false);
  });
});
