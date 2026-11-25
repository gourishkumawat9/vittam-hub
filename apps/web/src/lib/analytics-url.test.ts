import { describe, expect, it } from "vitest";

import { analyticsUrl } from "./analytics-url";

describe("analyticsUrl", () => {
  it("drops a password-reset token", () => {
    expect(analyticsUrl("https://vittamhub.com/reset-password?token=abc123")).toBe("https://vittamhub.com/reset-password");
  });

  it("drops a two-factor challenge in the fragment", () => {
    expect(analyticsUrl("https://vittamhub.com/login#mfa=secret")).toBe("https://vittamhub.com/login");
  });

  it("drops search terms and redirect targets", () => {
    expect(analyticsUrl("https://vittamhub.com/login?redirectTo=%2Ffounder&query=fintech")).toBe("https://vittamhub.com/login");
  });

  it("keeps campaign tags and nothing else", () => {
    expect(analyticsUrl("https://vittamhub.com/?utm_source=linkedin&token=x&UTM_Campaign=launch#top")).toBe(
      "https://vittamhub.com/?utm_source=linkedin&UTM_Campaign=launch",
    );
  });

  it("leaves a plain address alone", () => {
    expect(analyticsUrl("https://vittamhub.com/startups/demo-startup")).toBe("https://vittamhub.com/startups/demo-startup");
  });

  it("sends nothing it can't parse", () => {
    expect(analyticsUrl("not a url")).toBe("");
  });
});
