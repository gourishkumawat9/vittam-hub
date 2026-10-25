#!/bin/sh
# Container start command for hosts without a separate pre-deploy step
# (Render's free plan, see render.yaml). Railway runs the same migration as a
# preDeployCommand instead and keeps using the Dockerfile CMD.
#
# `set -e` means a failed migration exits before the API boots, so the new
# deploy fails its health check and the host keeps the previous version up.
set -e
node_modules/.bin/prisma migrate deploy --schema=src/database/prisma/schema.prisma
exec node dist/src/main.js
