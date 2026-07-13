# Henderson Sans

Drop the licensed brand typeface files here as:

- `HendersonSans-Regular.woff2`
- `HendersonSans-Bold.woff2`

Then uncomment the `next/font/local` block in [`src/lib/fonts.ts`](../../src/lib/fonts.ts) and add `hendersonSans.variable` to the `<body>` class list in [`src/app/layout.tsx`](../../src/app/layout.tsx). Until then, the `fontFamily.brand` token falls back to Manrope — see [docs/02-design-system.md](../../../../docs/02-design-system.md).
