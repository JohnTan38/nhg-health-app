# NHG Health App — Digital Education Deck

A web and mobile optimised teaching deck that shows Singapore seniors how to use
the NHG Health App: booking appointments, registering for the queue, checking in
on arrival, reading their care plan, and requesting medicine refills.

Built for Care Corner Singapore Active Ageing & Senior Services. Designed to be
run by a facilitator in a group session, and to be reopened by a senior alone on
their own phone afterwards.

## Design constraints

This deck is built for elderly users. These are requirements, not preferences:

- **No text below 18px anywhere**, 20px body on phones. Enforced by e2e test.
- **All tap targets at least 56×56px.**
- **WCAG AA contrast on every text pair.** Enforced by unit test in
  `tests/unit/tokens.test.ts`.
- **Starts paused and silent.** A deck that talks by itself is disruptive in a
  group room.
- **No third-party request before consent.** The Facebook video loads only after
  the user taps play.

`#E4572E` — the Care Corner orange — measures 3.29:1 on `#f2f2f3`. That fails AA
for body text, so it is restricted to headings, large numerals, rules and control
chrome. Use `--care-text` (`#BC421D`, 4.77:1) for small accent text.

## Commands

```bash
npm install
npm run dev        # http://localhost:3000
npm run verify     # lint + typecheck + unit tests + build — the gate
npm run test:e2e   # Playwright, desktop + mobile, incl. axe accessibility scan
```

Nothing is done until `npm run verify` passes.

## Version pins

Two dependencies are held below `latest`, both verified against the npm registry:

| Package | Pinned | `latest` | Why |
|---|---|---|---|
| `typescript` | 6.0.3 | 7.0.2 | `typescript-eslint@8` requires `typescript: >=4.8.4 <6.1.0` |
| `eslint` | 9.39.5 | 10.8.0 | `eslint-config-next`'s bundled plugins (`eslint-plugin-react`, `-import`, `-jsx-a11y`) only support ESLint `^9` |

Check `npm view <pkg> peerDependencies` before changing either.

## The Care Corner logo

Slide 01 expects the official logo at `public/images/care-corner-logo.png`
(332×212px, opaque dark background baked in — see `public/images/README.md` for
details on replacing it). Until that file exists, a typographic fallback renders
instead. The build, the tests and the deploy all succeed either way.

## Content

Slides live in `content/slides.ts` as typed data — there is no slide markup to
edit. The original approved visual design is preserved at
`docs/source/deck-template.html` for reference. Speaker notes double as the
narration script and the on-screen captions (toggle with the "CC" control).

## Deploy

```bash
vercel deploy         # preview
vercel deploy --prod  # nhg-health-app.vercel.app
```

This is a separate Vercel project from `ntuc-health-activity-registration` —
do not link this repo into that project.
