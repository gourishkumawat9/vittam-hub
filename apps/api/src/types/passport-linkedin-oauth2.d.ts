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

  /** passport-oauth2's state store: called with (req, callback) and (req, state, callback). */
  export interface StateStore {
    store(req: Request, callback: (err: Error | null, state?: string) => void): void;
    verify(
      req: Request,
      state: string,
      callback: (err: Error | null, ok: boolean, info?: { message: string }) => void,
    ): void;
  }

  export interface StrategyOptions {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
    scope?: string[];
    state?: boolean;
    store?: StateStore;
    passReqToCallback?: false;
  }

  // The profile type is the caller's: this app replaces the library's own profile request.
  export type VerifyFunction = (
    accessToken: string,
    refreshToken: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- shape comes from the overriding strategy
    profile: any,
    done: VerifyCallback,
  ) => void;

  export class Strategy {
    name: string;
    constructor(options: StrategyOptions, verify: VerifyFunction);
    authenticate(req: Request, options?: Record<string, unknown>): void;
  }
}
