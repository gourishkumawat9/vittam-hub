import { Test } from "@nestjs/testing";

import { AppModule } from "../src/app.module";

/**
 * Compiles the entire module graph — every provider gets constructor-
 * injected without a real database or Redis connection (`.compile()` stops
 * short of lifecycle hooks like `onModuleInit`). This is the one test that
 * catches "Nest can't resolve dependencies" and eager-crash-on-missing-config
 * bugs (e.g. a `@typescript-eslint/consistent-type-imports` autofix silently
 * erasing a constructor-injected class import, or a provider that
 * unconditionally constructs a third-party SDK client at boot) — neither
 * typecheck nor lint can catch either class of bug; only actually
 * instantiating the graph does. Run this after any change to a module's
 * providers or constructors.
 */
describe("AppModule", () => {
  it("resolves the full dependency graph without errors", async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    expect(moduleRef).toBeDefined();
    await moduleRef.close();
  });
});
