import { randomUUID } from "node:crypto";

import { ArgumentsHost, ExceptionFilter , Catch, HttpException, HttpStatus, Logger } from "@nestjs/common";
import { Response } from "express";

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
