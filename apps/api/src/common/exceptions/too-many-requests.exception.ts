import { HttpException, HttpStatus } from "@nestjs/common";

/** NestJS's built-in exception set stops at 4xx staples (Bad Request, Conflict, ...) — it has no 429. */
export class TooManyRequestsException extends HttpException {
  constructor(message = "Too many requests") {
    super(message, HttpStatus.TOO_MANY_REQUESTS);
  }
}
