# 13 — Search engine optimisation

Goal: someone who searches **VittamHub** or **Vittam Hub** finds vittamhub.com first.

Code alone can't guarantee a ranking. Google first has to know the site exists, then trust that it is the official home of the brand. The code below makes the site easy to read; the off-site steps make Google aware of it.

## What the code does

| Piece | Where | Why |
|---|---|---|
| Brand name, tagline, description, alternate spellings | `apps/web/src/lib/site.ts` | One source of truth for every tag below |
| Per-page title, description, canonical, link preview | `apps/web/src/lib/seo.ts` → `pageMetadata()` | Each public page declares its own URL. The old site-wide canonical told Google every page was a copy of the home page |
| Organization + WebSite structured data | `apps/web/src/app/json-ld.tsx` | `name` + `alternateName` is what Google uses for the site name shown above results, and ties "Vittam Hub" to this site |
| Link-preview image | `apps/web/src/lib/og-card.tsx` | Uses the official logo file as-is (CLAUDE.md §1) |
| `noindex` on the logged-in app, onboarding, and one-off auth pages | `(dashboard)`, `(onboarding)`, `(auth)` layouts | Keeps empty, personal or API-dependent pages out of results. `/login` and `/register` stay indexable |
| Sitemap and robots | `apps/web/src/app/sitemap.ts`, `robots.ts` | Lists only public pages that render without the API |
| Search Console / Bing ownership tags | `GOOGLE_SITE_VERIFICATION`, `BING_SITE_VERIFICATION` env vars | Optional; set in Vercel, then redeploy. Declared in `turbo.json` so Turborepo passes them to the build |

## Off-site steps (owner, one-time)

1. **Google Search Console**: add a *Domain* property for `vittamhub.com` and verify it with the DNS TXT record it gives you (or paste the meta-tag code into `GOOGLE_SITE_VERIFICATION` in Vercel and redeploy). Then submit `https://vittamhub.com/sitemap.xml` and use *URL inspection → Request indexing* on the home page.
2. **Bing Webmaster Tools**: import the site from Search Console (one click). Bing also feeds DuckDuckGo and Yahoo.
3. **Official profiles**: create or claim LinkedIn company page, Instagram, X and YouTube under the VittamHub name, each linking to vittamhub.com. Add their URLs to `SOCIAL_PROFILES` in `site.ts` so they appear as `sameAs` in the structured data.
4. **Links from elsewhere**: the founder's LinkedIn, Startup India profile, college/incubator pages, Product Hunt, and press mentions should link to vittamhub.com with the name "VittamHub". These are what make Google confident the site is the brand's official home.

## When adding a public page

- Export `metadata = pageMetadata({ title, description, path })`.
- Add it to `ROUTES` in `sitemap.ts`.
- If it needs the API to show anything, render the content on the server first; a crawler that sees only a loading screen indexes nothing.
