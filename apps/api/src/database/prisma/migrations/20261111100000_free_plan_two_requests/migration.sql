-- Lower the Free plan's monthly connect request limit from 5 to 2 (owner decision, Nov 2026).
-- Only touches the row if it still holds the old default, so a value an admin
-- has already changed by hand is left alone. Admins can still edit it at runtime.
UPDATE "plan_limits" SET "monthlyConnectRequestLimit" = 2, "updatedAt" = NOW()
WHERE "plan" = 'FREE' AND "monthlyConnectRequestLimit" = 5;
