import { PipeTransform , BadRequestException } from "@nestjs/common";
import { ZodSchema } from "zod";

/**
 * Validates request bodies against the same Zod schemas exported from
 * @vittamhub/types that react-hook-form uses on the client — one schema,
 * enforced on both sides of the API boundary.
 */
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown) {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        message: result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`),
      });
    }
    return result.data;
  }
}
