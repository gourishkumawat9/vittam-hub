import { GOOGLE_CLIENT_ID_PATTERN, validateEnv } from "./env.validation";

const BASE = {
  APP_URL: "http://localhost:3000",
  API_URL: "http://localhost:4000",
  DATABASE_URL: "postgresql://localhost/test",
  REDIS_URL: "redis://localhost:6379",
  JWT_ACCESS_SECRET: "a".repeat(32),
  JWT_REFRESH_SECRET: "b".repeat(32),
};

const CLIENT_ID = "123456789012-abcdefghijklmnopqrstuvwxyz012345.apps.googleusercontent.com";

describe("validateEnv: OAuth credentials", () => {
  let warn: jest.SpyInstance;
  beforeEach(() => {
    warn = jest.spyOn(console, "warn").mockImplementation(() => undefined);
  });
  afterEach(() => warn.mockRestore());

  it("drops spaces, line breaks and quotes pasted along with a client id and secret", () => {
    const env = validateEnv({ ...BASE, GOOGLE_CLIENT_ID: `  "${CLIENT_ID}"\n`, GOOGLE_CLIENT_SECRET: "'GOCSPX-secret' " });
    expect(env.GOOGLE_CLIENT_ID).toBe(CLIENT_ID);
    expect(env.GOOGLE_CLIENT_SECRET).toBe("GOCSPX-secret");
    expect(warn).not.toHaveBeenCalled();
  });

  it("keeps an all-blank value blank, so the provider counts as not configured", () => {
    const env = validateEnv({ ...BASE, GITHUB_CLIENT_ID: "   " });
    expect(env.GITHUB_CLIENT_ID).toBe("");
  });

  it("leaves an unset credential unset", () => {
    expect(validateEnv(BASE).GOOGLE_CLIENT_ID).toBeUndefined();
  });

  it("warns at boot when GOOGLE_CLIENT_ID isn't shaped like a Google client id", () => {
    validateEnv({ ...BASE, GOOGLE_CLIENT_ID: "123456789012-abc" });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("GOOGLE_CLIENT_ID"));
  });

  it("recognises a real-shaped client id", () => {
    expect(GOOGLE_CLIENT_ID_PATTERN.test(CLIENT_ID)).toBe(true);
    expect(GOOGLE_CLIENT_ID_PATTERN.test(`${CLIENT_ID} `)).toBe(false);
  });
});
