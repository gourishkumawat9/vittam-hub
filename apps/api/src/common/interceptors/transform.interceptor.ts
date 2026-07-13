import { randomUUID } from "node:crypto";

import { CallHandler, ExecutionContext, NestInterceptor , Injectable } from "@nestjs/common";
import { Observable , map } from "rxjs";

/** Wraps every successful response as `{ data, requestId }` — the mirror image of HttpExceptionFilter's error shape. */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, { data: T; requestId: string }> {
  intercept(_context: ExecutionContext, next: CallHandler<T>): Observable<{ data: T; requestId: string }> {
    const requestId = randomUUID();
    return next.handle().pipe(map((data) => ({ data, requestId })));
  }
}
