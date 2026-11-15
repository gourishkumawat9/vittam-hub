import { Injectable } from "@nestjs/common";

import {
  assertStartupViewable,
  projectStartup,
  type ProjectableStartup,
  type StartupViewerContext,
} from "../../common/startups/startup-visibility";

export { bandifyAmount, type StartupViewerContext } from "../../common/startups/startup-visibility";

/**
 * Injectable face of common/startups/startup-visibility.ts for this module's
 * controller. The rules themselves live there, as plain functions, so the
 * investor-side modules (pipeline, watchlist, portfolio, mandates,
 * recommendations, search) apply exactly the same ones.
 */
@Injectable()
export class StartupPublicProjectionService {
  assertViewable(startup: Pick<ProjectableStartup, "visibility" | "isPublic" | "deletedAt">, viewer: StartupViewerContext): void {
    assertStartupViewable(startup, viewer);
  }

  project<T extends ProjectableStartup>(startup: T, viewer: StartupViewerContext): T {
    return projectStartup(startup, viewer);
  }
}
