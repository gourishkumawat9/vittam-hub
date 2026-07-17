"use client";

import { FUTURE_MODULES, type FutureModuleSlug } from "@vittamhub/types";
import { Badge, Button, EmptyState } from "@vittamhub/ui";
import { useParams, useRouter } from "next/navigation";

import { FUTURE_MODULE_ICONS } from "@/data/future-modules";

/**
 * One dynamic route serves every not-yet-built module (see
 * packages/types/src/domain/future-modules.ts) — a future prompt implements
 * a module by deleting its entry from FUTURE_MODULES and adding a real page,
 * not by touching this file.
 */
export default function FutureModulePage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const futureModule = FUTURE_MODULES.find((m) => m.slug === params.slug);

  if (!futureModule) {
    return (
      <EmptyState
        icon={FUTURE_MODULE_ICONS["ai-assistant"]!}
        title="Module not found"
        description="This isn't one of VittamHub's planned modules."
        action={
          <Button variant="secondary" onClick={() => router.back()}>
            Go back
          </Button>
        }
      />
    );
  }

  const Icon = FUTURE_MODULE_ICONS[futureModule.slug as FutureModuleSlug]!;

  return (
    <div className="mx-auto max-w-lg py-12">
      <EmptyState
        icon={Icon}
        title={futureModule.label}
        description={futureModule.description}
        action={
          <div className="flex flex-col items-center gap-3">
            <Badge variant="brand">Coming soon</Badge>
            <Button variant="secondary" onClick={() => router.back()}>
              Go back
            </Button>
          </div>
        }
      />
    </div>
  );
}
