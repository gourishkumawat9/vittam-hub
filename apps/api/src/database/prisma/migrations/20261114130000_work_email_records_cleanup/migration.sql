-- Work-email verification records that were never earned (November 2026).
--
-- The check behind them looked only at the domain of an address, and it ran
-- (a) on whatever address a caller posted to /v1/verification/checks, under
-- any field name they chose, and (b) automatically on the sign-up address
-- before its owner had confirmed it. Either way a profile could show a
-- "verified work email" for an address its owner does not control.
--
-- The check now runs only on the account's own confirmed address. This
-- removes the records written the old way; the automatic check writes a
-- fresh one the next time the profile is saved or the address is confirmed.
DELETE FROM "verification_records"
WHERE "method" = 'DOMAIN_EMAIL_HEURISTIC'
  AND (
    "verifiedBy" IS DISTINCT FROM 'system:auto-check'
    OR "entityType" <> 'User'
    OR "field" <> 'workEmail'
    OR "entityId" IN (SELECT "id" FROM "users" WHERE "emailVerifiedAt" IS NULL)
  );
