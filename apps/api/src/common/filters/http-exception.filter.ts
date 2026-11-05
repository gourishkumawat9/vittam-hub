import { randomUUID } from "node:crypto";

import { ArgumentsHost, ExceptionFilter , Catch, HttpException, HttpStatus, Logger } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { Response } from "express";

/**
 * Prisma errors that mean "no such record" rather than a server fault:
 * P2023 is a malformed id (e.g. `/v1/mentors/abc` against a uuid column),
 * P2025 is an update/delete/findUniqueOrThrow that matched nothing.
 * Reporting them as 500s made every bad link look like an outage.
 */
const PRISMA_NOT_FOUND_CODES = new Set(["P2023", "P2025"]);

/**
 * Every error response — thrown HttpException or unhandled — comes out
 * shaped as `{ error: { code, message, details?, requestId } }` so
 * @vittamhub/api-client's ApiClientError never has to branch on shape.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const requestId = randomUUID();

    if (exception instanceof Prisma.PrismaClientKnownRequestError && PRISMA_NOT_FOUND_CODES.has(exception.code)) {
      response.status(HttpStatus.NOT_FOUND).json({
        error: { code: "NOT_FOUND", message: "Not found", requestId },
      });
      return;
    }

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse = isHttpException ? exception.getResponse() : null;

    const code = isHttpException ? HttpStatus[status] ?? "HTTP_ERROR" : "INTERNAL_SERVER_ERROR";
    const message =
      typeof exceptionResponse === "object" && exceptionResponse && "message" in exceptionResponse
        ? Array.isArray((exceptionResponse as { message: unknown }).message)
          ? (exceptionResponse as { message: string[] }).message.join(", ")
          : String((exceptionResponse as { message: unknown }).message)
        : isHttpException
          ? exception.message
          : "An unexpected error occurred";

    if (!isHttpException) {
      this.logger.error(exception instanceof Error ? exception.stack : exception, { requestId });
    }

    response.status(status).json({
      error: { code, message, requestId },
    });
  }
}
