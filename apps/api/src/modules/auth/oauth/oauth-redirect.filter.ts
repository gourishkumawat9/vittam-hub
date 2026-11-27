import { ArgumentsHost, Catch, ExceptionFilter, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Response } from "express";

import { OAuthSignInException } from "./oauth.guard";

/**
 * OAuth routes are opened by the browser itself, not by fetch, so an error
 * answered as JSON leaves the person looking at raw text on the API's
 * address. Whatever goes wrong on these routes sends them back to the login
 * page instead, with a short reason code it turns into a sentence.
 */
@Catch()
@Injectable()
export class OAuthRedirectFilter implements ExceptionFilter {
  private readonly logger = new Logger(OAuthRedirectFilter.name);

  constructor(private readonly configService: ConfigService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    if (response.headersSent) return;

    const reason = exception instanceof OAuthSignInException ? exception.reason : "oauth_failed";
    if (!(exception instanceof OAuthSignInException)) {
      this.logger.warn(`OAuth sign-in failed: ${exception instanceof Error ? exception.message : String(exception)}`);
    }

    // A new person who pressed Google on the login page goes to sign-up to pick their account type first.
    const page = reason === "oauth_no_account" ? "register" : "login";
    response.redirect(`${this.configService.getOrThrow<string>("APP_URL")}/${page}?error=${reason}`);
  }
}
