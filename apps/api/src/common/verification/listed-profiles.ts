/**
 * Which profiles a directory lists, and in what order. One file, so the
 * startup, mentor, incubator and university lists, the search box and the
 * recommendations all follow the same rule.
 *
 * Everyone who has published a profile is listed. "Verified" is a badge a
 * profile earns, not the price of being found. When the lists showed verified
 * profiles only, a real mentor, incubator or university could never appear
 * (none of them had a way to add the document the badge asks for), and neither
 * could an idea-stage startup with no company yet: only the demo accounts,
 * which are created verified, ever showed up.
 *
 * REJECTED is the one status kept out. No person sets it (CLAUDE.md §6); it is
 * reserved for an automated fraud or mismatch signal.
 */
export const LISTED_VERIFICATION = { not: "REJECTED" } as const;

/**
 * Verified profiles first, then pending, then the rest. The enum is declared
 * UNVERIFIED, PENDING, VERIFIED, REJECTED and Postgres sorts an enum in that
 * order, so with REJECTED never listed, descending puts VERIFIED on top.
 */
export const VERIFIED_FIRST = { verificationStatus: "desc" } as const;
