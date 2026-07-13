import { CallHandler, ExecutionContext, NestInterceptor , Injectable, Logger } from "@nestjs/common";
import { Request } from "express";
import { tap } from "rxjs";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger("HTTP");

  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, originalUrl } = request;
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        this.logger.log(`${method} ${originalUrl} — ${Date.now() - start}ms`);
      }),
    );
  }
}
