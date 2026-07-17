import { ArgumentMetadata, PipeTransform , BadRequestException } from "@nestjs/common";
import { ZodSchema } from "zod";

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
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        message: result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`),
      });
    }
    return result.data;
  }
}
