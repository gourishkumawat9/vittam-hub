-- Demo sandbox accounts (see apps/api/src/modules/demo). Real accounts default to false.
ALTER TABLE "users" ADD COLUMN "isDemo" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "users_isDemo_idx" ON "users"("isDemo");
