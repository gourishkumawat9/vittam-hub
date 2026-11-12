# Demo accounts

One login per stakeholder, so the owner (or anyone they share the password
with) can click through every dashboard on the live site without signing up
six times. Code: `apps/api/src/modules/demo` and `apps/api/src/common/demo`.

## The logins

All share one password, which lives only in Render (never in the repo).

| Email | Role | Lands on | Profile |
|---|---|---|---|
| founder@demo.vittamhub.com | Founder | /founder | Demo Startup · EdTech · MVP · raising |
| founder2@demo.vittamhub.com | Founder | /founder | Demo Fintech Startup · FinTech · Idea |
| investor@demo.vittamhub.com | Investor | /investor | Demo Angel Fund · Angel · ₹5L–₹25L |
| mentor@demo.vittamhub.com | Mentor | /mentors/bookings | Demo mentor · Product and pricing |
| incubator@demo.vittamhub.com | Incubator | /community | Demo Incubator + one demo programme |
| university@demo.vittamhub.com | University | /community | Demo University |

There is deliberately **no demo admin**: an admin login behind a shared
password would be a real security hole. Service-provider and job-seeker
logins were dropped when those roles were paused (CLAUDE.md "Current scope");
a login dropped from the list stops working on the next start.

## Turning them on and off (Render dashboard, no terminal)

1. Render → **vittamhub-api** → **Environment** → **Add Environment Variable**.
2. Key `DEMO_ACCOUNTS_PASSWORD`, value: a password of **12 or more characters**
   that you don't use anywhere else. Save. Render redeploys.
3. After about two minutes, sign in at https://vittamhub.com/login with any
   email above and that password.

On every start the API creates or refreshes the six accounts, resets
their names and profiles, and marks their setup as finished, so each login
opens its dashboard rather than the setup wizard. Anything a visitor changed
is undone on the next deploy or wake-up.

- **Change the password:** edit the variable. The old one stops working on the
  next start.
- **Switch them off:** delete the variable. On the next start every demo login
  stops working (their passwords are cleared). The accounts stay, so turning
  them back on is instant.
- A password shorter than 12 characters is refused and the logins stay off;
  the Render log says why.

## The demo sandbox

Every demo account has `User.isDemo = true`, and the sandbox is sealed both ways:

- **Real visitors never see demo profiles.** Startup and investor discovery,
  the mentor, incubator and university directories, global search,
  recommendations, mandate matches, syndicate partners and the community feed all filter on the viewer's side (`sameSandbox`).
  Anonymous visitors count as real.
- **Demo accounts only see each other**, so the demo investor's discovery shows
  the two demo startups and nothing else.
- **Demo and real accounts can't contact each other**: connect requests, mentor
  bookings and follows across the line answer "not found"
  (`inSameSandbox`).
- **Admin numbers ignore demo accounts**: totals, sign-ups over time, connect
  acceptance rate and the verification counts.
- **Shared-login protection**: demo accounts can't change the password, turn on
  two-step login, or delete the account (`NotDemoGuard`), so one visitor can't
  lock the next one out. Each start also clears two-step login just in case.

Demo profiles are marked verified so they appear in verified-only lists inside
the sandbox. That never reaches a real user, per CLAUDE.md §2.

Connect requests from the demo founder count against the Free plan like any
founder's: 2 a month.

## Adding a new listing or contact feature

If a new query lists other people's profiles, add
`...sameSandbox(await isDemoViewer(this.prisma, callerId))` to its `where`.
If a new action lets one user reach another, check
`inSameSandbox(this.prisma, fromUserId, toUserId)` first and answer "not
found" when it fails.
