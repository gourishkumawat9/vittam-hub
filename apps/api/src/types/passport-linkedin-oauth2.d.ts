// No official @types package exists for passport-linkedin-oauth2 — minimal
// ambient declaration covering the surface this app actually uses.
declare module "passport-linkedin-oauth2" {
  import type { Request } from "express";

  export interface Profile {
    id: string;
    displayName: string;
    name?: { givenName?: string; familyName?: string };
    emails?: Array<{ value: string }>;
    photos?: Array<{ value: string }>;
  }

  export type VerifyCallback = (error: unknown, user?: unknown, info?: unknown) => void;

  export interface StrategyOptions {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
    scope?: string[];
    state?: boolean;
    passReqToCallback?: false;
  }

  export type VerifyFunction = (
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ) => void;

  export class Strategy {
    name: string;
    constructor(options: StrategyOptions, verify: VerifyFunction);
    authenticate(req: Request, options?: Record<string, unknown>): void;
  }
}
