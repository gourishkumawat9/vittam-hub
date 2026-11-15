-- Sign-in hardening (November 2026).

-- 1. Refresh tokens remember whether they were exchanged for a successor
--    (rotatedAt) and which sign-in they descend from (familyId). Both are
--    nullable, so tokens issued before this migration keep working.
ALTER TABLE "refresh_tokens" ADD COLUMN "rotatedAt" TIMESTAMP(3);
ALTER TABLE "refresh_tokens" ADD COLUMN "familyId" UUID;
CREATE INDEX "refresh_tokens_familyId_idx" ON "refresh_tokens"("familyId");

-- 2. Email addresses are compared exactly, so "Asha@Example.com" and
--    "asha@example.com" were two different accounts and a capital letter at
--    sign-in meant "invalid email or password". Sign-up and sign-in now lower-
--    case the address; this brings the stored ones in line.
--    Where two accounts differ only by capitals, the one that is already
--    lower-case (or else the oldest) takes the lower-case address and the
--    others are left untouched, so the unique index is never violated.
UPDATE "users" u
SET "email" = lower(u."email")
WHERE u."email" <> lower(u."email")
  AND NOT EXISTS (
    SELECT 1
    FROM "users" o
    WHERE o."id" <> u."id"
      AND lower(o."email") = lower(u."email")
      AND (
        o."email" = lower(o."email")
        OR o."createdAt" < u."createdAt"
        OR (o."createdAt" = u."createdAt" AND o."id" < u."id")
      )
  );
