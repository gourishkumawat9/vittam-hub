import { ExecutionContext, Injectable, Logger, mixin, Type, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AuthGuard, IAuthGuard } from "@nestjs/passport";

import { isOAuthProviderConfigured, type OAuthProvider } from "./oauth-providers";

/** Carries a short reason code to the login page (see OAuthRedirectFilter). */
export class OAuthSignInException extends UnauthorizedException {
  constructor(
    readonly reason: "oauth_unavailable" | "oauth_email" | "oauth_failed" | "oauth_closed",
    message: string,
  ) {
    super(message);
  }
}

/**
 * Passport's OAuth guard, plus one check first: is this provider set up at
 * all? Each strategy is built with a placeholder client id when its keys are
 * missing (passport refuses to construct without one), so an unconfigured
 * provider used to send people to Google/GitHub/LinkedIn's own error page.
 */
export function OAuthGuard(provider: OAuthProvider): Type<IAuthGuard> {
  @Injectable()
  class OAuthProviderGuard extends AuthGuard(provider) {
    private readonly logger = new Logger(`OAuthGuard(${provider})`);

    constructor(private readonly configService: ConfigService) {
      super();
    }

    override canActivate(context: ExecutionContext) {
      if (!isOAuthProviderConfigured(this.configService, provider)) {
        throw new OAuthSignInException("oauth_unavailable", `Sign-in with ${provider} isn't available`);
      }
      return super.canActivate(context);
    }

    override handleRequest<TUser = unknown>(err: unknown, user: TUser, info: unknown): TUser {
      if (err || !user) {
        const cause = err instanceof Error ? err.message : (info as { message?: string } | undefined)?.message;
        this.logger.warn(`Sign-in with ${provider} did not complete${cause ? `: ${cause}` : ""}`);
        throw new OAuthSignInException("oauth_failed", "That sign-in didn't complete");
      }
      return user;
    }
  }

  return mixin(OAuthProviderGuard);
}
