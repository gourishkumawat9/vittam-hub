import { rememberSignupPersona, signupPersonaFrom, takeSignupPersona } from "./oauth-signup.cookie";

describe("signupPersonaFrom", () => {
  it("accepts a persona whose role is open for sign-up", () => {
    expect(signupPersonaFrom("STUDENT")).toBe("STUDENT");
    expect(signupPersonaFrom("INVESTMENT_FIRM")).toBe("INVESTMENT_FIRM");
  });

  it("ignores anything else", () => {
    expect(signupPersonaFrom("ADMIN")).toBeUndefined();
    expect(signupPersonaFrom(["STUDENT"])).toBeUndefined();
    expect(signupPersonaFrom(undefined)).toBeUndefined();
  });
});

describe("remembering the account type across the provider's round trip", () => {
  const response = () => ({ cookie: jest.fn(), clearCookie: jest.fn() });

  it("keeps the persona from the sign-up button and hands it to the callback once", () => {
    const res = response();
    rememberSignupPersona({ query: { persona: "MENTOR" }, cookies: {} } as never, res as never, true);
    expect(res.cookie).toHaveBeenCalledWith("vh_oauth_signup", "MENTOR", expect.objectContaining({ httpOnly: true, secure: true, path: "/v1/auth" }));

    const callbackRes = response();
    expect(takeSignupPersona({ cookies: { vh_oauth_signup: "MENTOR" } } as never, callbackRes as never)).toBe("MENTOR");
    expect(callbackRes.clearCookie).toHaveBeenCalledWith("vh_oauth_signup", { path: "/v1/auth" });
  });

  it("forgets an earlier choice when a sign-in starts from the login page", () => {
    const res = response();
    rememberSignupPersona({ query: {}, cookies: { vh_oauth_signup: "MENTOR" } } as never, res as never, true);
    expect(res.cookie).not.toHaveBeenCalled();
    expect(res.clearCookie).toHaveBeenCalledWith("vh_oauth_signup", { path: "/v1/auth" });
  });
});
