import { Injectable, NotFoundException } from "@nestjs/common";
import { FUTURE_MODULES, type FutureModuleStatus } from "@vittamhub/types";

/**
 * Deliberately the only thing this module does: report "not built yet" for a
 * known set of slugs. When a future prompt implements one of these, delete
 * its entry from FUTURE_MODULES and replace this stub with a real module —
 * do not add business logic here.
 */
@Injectable()
export class FutureModulesService {
  listAll(): FutureModuleStatus[] {
    return FUTURE_MODULES.map((module) => ({ ...module, available: false as const }));
  }

  getStatus(slug: string): FutureModuleStatus {
    const module = FUTURE_MODULES.find((m) => m.slug === slug);
    if (!module) throw new NotFoundException(`Unknown module "${slug}"`);
    return { ...module, available: false };
  }
}
