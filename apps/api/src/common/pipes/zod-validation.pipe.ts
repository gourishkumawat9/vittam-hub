import { ArgumentMetadata, PipeTransform , BadRequestException } from "@nestjs/common";
import { z, ZodSchema, type ZodTypeAny } from "zod";

/**
 * Validates request bodies against the same Zod schemas exported from
 * @vittamhub/types that react-hook-form uses on the client — one schema,
 * enforced on both sides of the API boundary.
 *
 * Method-level @UsePipes applies a pipe to EVERY route parameter — including
 * custom param decorators like @CurrentUser() (the JWT payload) and @Param()
 * route segments (plain strings). Validating those against a body/query object
 * schema either 400s ("Expected object, received string" / "field: Required")
 * or, with all-optional schemas, silently strips the user object to {}. Every
 * schema passed to this pipe describes a body or query object, so only those
 * two argument types are validated.
 */
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown, metadata: ArgumentMetadata) {
    if (metadata.type !== "body" && metadata.type !== "query") return value;
    const input = metadata.type === "query" ? normalizeQuery(this.schema, value) : value;
    const result = this.schema.safeParse(input);
    if (!result.success) {
      throw new BadRequestException({
        message: result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`),
      });
    }
    return result.data;
  }
}

/** Strips optional/default/nullable/effects wrappers to reach the field's real type. */
function unwrap(schema: ZodTypeAny): ZodTypeAny {
  let current = schema;
  for (;;) {
    if (current instanceof z.ZodOptional || current instanceof z.ZodNullable) current = current.unwrap();
    else if (current instanceof z.ZodDefault) current = current.removeDefault();
    else if (current instanceof z.ZodEffects) current = current.innerType();
    else return current;
  }
}

/**
 * A query string only carries strings, and Express parses `?stage=SEED` as
 * the string "SEED" — it becomes an array only when the key repeats. Without
 * this, every list filter sent with a single value (one stage, one status)
 * 400s with "Expected array, received string", and a boolean filter like
 * `isFundraising=true` can never validate. `z.coerce.boolean()` also reads
 * the string "false" as true, so "true"/"false" are turned into real
 * booleans first.
 */
export function normalizeQuery(schema: ZodSchema, value: unknown): unknown {
  const objectSchema = unwrap(schema as ZodTypeAny);
  if (!(objectSchema instanceof z.ZodObject) || !value || typeof value !== "object") return value;

  const shape = objectSchema.shape as Record<string, ZodTypeAny>;
  const normalized: Record<string, unknown> = { ...(value as Record<string, unknown>) };
  for (const [key, raw] of Object.entries(normalized)) {
    const field = shape[key];
    if (!field) continue;
    const fieldType = unwrap(field);
    if (fieldType instanceof z.ZodArray && typeof raw === "string") {
      normalized[key] = [raw];
    } else if (fieldType instanceof z.ZodBoolean && (raw === "true" || raw === "false")) {
      normalized[key] = raw === "true";
    }
  }
  return normalized;
}
