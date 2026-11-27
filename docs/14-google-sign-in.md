# Sign in with Google

Google sign-in and sign-up run through the API (`/v1/auth/google` and
`/v1/auth/google/callback`, passport-google-oauth20). The web app never holds
Google keys: the "Continue with Google" button appears only once the API
reports Google as configured (`GET /v1/auth/providers`).

## How it behaves

- **Sign-up page.** The person picks who they're joining as first. The Google
  button then carries that choice (`/v1/auth/google?persona=STUDENT`), the API
  keeps it in a 10-minute `vh_oauth_signup` cookie through Google's round trip,
  and a new account gets that persona and its role. Google has already
  verified the email, so there is no verify-email step: the person lands in
  `/onboarding`, where the profile strength meter counts name, email and
  account type, and asks for mobile number and nationality next.
- **Login page.** An existing account (matched on the Google account, then on
  the Google-verified email) signs in. An address with no account is sent to
  `/register?error=oauth_no_account` to pick an account type and continue with
  Google again, so nobody is silently made a founder.
- Existing rules still apply: two-factor accounts still pass their second
  factor, demo accounts can't use Google, and an unconfirmed email/password
  account with the same address is taken over by the Google owner (see
  `AuthService.linkOAuthAccount`).

## Setting it up (owner)

1. Google Cloud Console → APIs & Services → **OAuth consent screen**: External,
   app name VittamHub, support email, authorised domain `vittamhub.com`,
   scopes `email`, `profile`, `openid`. Publish the app ("In production") so
   anyone can sign in, not only test users.
2. APIs & Services → **Credentials** → Create credentials → OAuth client ID →
   Web application.
   - Authorised JavaScript origins: `https://vittamhub.com`, `https://www.vittamhub.com`
   - Authorised redirect URI: `https://api.vittamhub.com/v1/auth/google/callback`
     (exactly `API_URL` + `/v1/auth/google/callback`)
3. Render → the API service → Environment: set `GOOGLE_CLIENT_ID` and
   `GOOGLE_CLIENT_SECRET`, check `API_URL=https://api.vittamhub.com` and
   `APP_URL=https://vittamhub.com`, then save (Render redeploys).
4. Nothing to set on Vercel.

Check: `https://api.vittamhub.com/v1/auth/providers` lists `"google"`.
