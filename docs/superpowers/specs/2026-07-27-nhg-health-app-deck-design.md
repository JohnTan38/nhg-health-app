# NHG Health App — Digital Education Deck

**Design spec — 2026-07-27**

Status: approved, ready for implementation planning.

---

## 1. Purpose

Turn the approved `nhg-health-digital-education` slide deck into a web and mobile
optimised application, deployed to Vercel, that Care Corner staff and volunteers
can run in a group session **and** that a senior can open alone on their own phone
afterwards.

The audience is elderly seniors in a Singapore social service setting. Every
design trade-off in this document resolves in favour of legibility and calm
pacing over visual density.

### Success criteria

1. A senior can read every slide on a 375 px-wide phone without pinching or zooming.
2. The deck advances on its own, at a pace slow enough to read, with no input.
3. The narration can be switched on and off, and the deck stays usable with it off.
4. The reference PDF can be downloaded from any slide.
5. `npm run verify` passes: lint, TypeScript, unit tests, and production build.
6. The e2e suite passes on both a mobile and a desktop viewport, including an
   automated accessibility pass.

### Non-goals

- No multi-language UI. The deck *depicts* the NHG app's language picker as
  content, but this application ships in English only.
- No accounts, no persistence, no backend. The application is entirely static.
- No content management. Slides are compiled-in typed data, not editable at runtime.
- No re-hosting of the NHG Health App itself. This teaches the app; it is not the app.

---

## 2. Source material and why it cannot be reused directly

The supplied `nhg-health-digital-education.html` is a Claude Design
self-extracting bundle. Its real markup is a JSON payload inside a
`<script type="__bundler/template">` tag, extracted at 62,703 characters.

That markup cannot ship as-is for three reasons:

1. **Proprietary runtime.** It depends on `<x-import>`, `<deck-stage>` and
   `<image-slot>` custom elements that exist only inside the Claude Design host.
2. **Fixed canvas.** Every slide is a 1920×1080 `<section>` with hard-coded pixel
   type — 132 px H1, 76 px H2, 34 px body, 27 px captions.
3. **The canvas is unusable on a phone.** Scaling 1920 px down to a 375 px
   viewport is a factor of 0.195. The 34 px body copy renders at **6.6 px**. For
   this audience that is not a compromise, it is a failure.

The bundle is therefore treated as a **content and visual-design source**, not as
code. Its text, structure, speaker notes and colour palette are extracted and
re-expressed; its layout mechanism is replaced.

---

## 3. Architecture

### 3.1 Stack

| Concern | Choice | Rationale |
|---|---|---|
| Framework | Next.js, App Router | Vercel-native, zero-config deploy, statically prerendered |
| Language | TypeScript, `strict: true` | Content model correctness is the whole design |
| Styling | CSS Modules over a token layer | Deck already has a named palette; keeps tokens first-class |
| Fonts | `next/font` (Barlow, Barlow Condensed) | Self-hosted, no external request, no layout shift |
| Unit tests | Vitest | Fast, ESM-native |
| E2E tests | Playwright | Multi-viewport plus accessibility assertions |

There is no server-side work. Every route is static.

### 3.2 Directory layout

```
app/
  layout.tsx            fonts, metadata, token stylesheet
  page.tsx              deck shell
  globals.css           reset + design tokens
components/
  Deck.tsx              orchestrator: index state, keyboard, autoplay wiring
  Slide.tsx             dispatches on body.kind
  layouts/
    CoverSlide.tsx
    OverviewSlide.tsx
    StepsSlide.tsx
    VideoSlide.tsx
    PracticeSlide.tsx
  PhoneMock.tsx         renders MockLine[]
  Controls.tsx          play/pause, prev/next, voice, download
  ProgressBar.tsx
  SpeakerNotes.tsx      on-screen caption panel
  VideoFacade.tsx       click-to-load Facebook embed
  Quiz.tsx              interactive quiz
hooks/
  useAutoplay.ts
  useSpeech.ts
  usePrefersReducedMotion.ts
lib/
  timing.ts             pure reading-time calculation
  speech.ts             voice selection, cancel-safety, watchdog
content/
  slides.ts             the typed deck
public/
  docs/nhg-health-digital-education.pdf
  images/care-corner-logo.png     (supplied by John Tan; placeholder until then)
tests/
  unit/
  e2e/
```

### 3.3 Content model

Slides become typed data. This is the decision that makes the responsive
re-author tractable and the content independently testable.

```ts
export type Theme = 'dark' | 'light';

export interface Slide {
  id: string;               // 'cover', 'book-appointment', …
  number: string;           // '01' … '11', display only
  label: string;            // short name for progress dots and a11y announcements
  eyebrow?: string;         // 'Appointments · Guide page 16'
  title: string;
  lede?: string;
  theme: Theme;
  body: SlideBody;
  speakerNotes: string;     // narration script — also the caption text
}

export type SlideBody =
  | { kind: 'cover';    presentedBy: string[]; logoSlot: true }
  | { kind: 'overview'; cards: OverviewCard[] }
  | { kind: 'steps';    callout?: Callout; stat?: Stat; steps: Step[]; lettered?: boolean }
  | { kind: 'video';    embedUrl: string; posterTitle: string; posterBody: string }
  | { kind: 'practice'; tasks: string[]; quiz: Quiz; help: Callout };

export interface Step {
  marker: string;           // '1'…'5' or 'A'…'C'
  caption: string;          // instruction beneath the mock
  mock: MockLine[];
}
```

Five layouts cover eleven slides, and one of them carries seven. Slides 03–09 all
reduce to `steps`: they share eyebrow, title, lede, an optional callout, an
optional stat, and N numbered steps. Slide 09 sets `lettered: true` to render
A/B/C markers.

Supporting types — `OverviewCard`, `Callout`, `Stat`, `Quiz` — are declared
alongside `Slide` in `content/slides.ts`. Each is a flat record of display
strings; none carries behaviour.

The phone screenshots inside each step are data, not markup:

```ts
export type MockLine =
  | { kind: 'nav';       items: string[]; active?: string }
  | { kind: 'row';       label: string; sub?: string }
  | { kind: 'button';    label: string; primary?: boolean }
  | { kind: 'chips';     items: string[]; active?: string }
  | { kind: 'status';    label: string }
  | { kind: 'itinerary'; items: string[]; doneCount?: number }
  | { kind: 'checkbox';  label: string }
  | { kind: 'big';       label: string }   // queue number 'A 24'
  | { kind: 'qr' };
```

`PhoneMock` is one component with one switch. Adding a screen is adding data.

### 3.4 Slide inventory

| # | id | Layout | Guide ref | Source |
|---|---|---|---|---|
| 01 | `cover` | cover | — | bundle slide 01 |
| 02 | `overview` | overview | — | bundle slide 02 |
| 03 | `getting-started` | steps (5) | page 5 | bundle slide 03 |
| 04 | `book-appointment` | steps (4) | page 16 | bundle slide 04 |
| 05 | `register-queue` | steps (3) | page 18 | bundle slide 05 |
| 06 | `i-have-arrived` | steps (3) | page 19 | bundle slide 06 |
| 07 | `allergies` | steps (3) | page 43 | bundle slide 07 |
| 08 | `medications` | steps (3) | page 44 | bundle slide 08 |
| 09 | `medicine-refill` | steps (3, lettered) | pages 59–60 | bundle slide 09 |
| 10 | `watch-video` | video | — | **new** |
| 11 | `practice` | practice | — | bundle slide 10 |

Slide 10 is new. It sits before Practice because watching then doing is the
correct teaching order. Its narration is newly written; all other speaker notes
are carried over verbatim from the bundle's `data-speaker-notes` attributes.

### 3.5 Responsive strategy

Two real layouts, selected by viewport width. Not a scaled canvas.

**Phone (< 768 px)** — single column, one slide per screen, vertical rhythm
driven by content. Body type floors at **20 px**. All interactive controls are at
least **56 × 56 px**. Steps stack vertically; phone mocks render at natural width.

**Desktop (≥ 768 px)** — the approved 16:9 presentation composition. Type uses
`clamp()` so it fills any viewport fluidly rather than scaling a fixed stage.
Step grids run horizontally as in the source deck.

Type scale, both breakpoints, via tokens:

| Token | Phone | Desktop |
|---|---|---|
| `--type-title` | 34 px | `clamp(44px, 4vw, 76px)` |
| `--type-subtitle` | 26 px | `clamp(30px, 2.3vw, 44px)` |
| `--type-body` | 20 px | `clamp(20px, 1.8vw, 34px)` |
| `--type-small` | 18 px | `clamp(18px, 1.45vw, 28px)` |

18 px is the hard floor anywhere in the application.

### 3.6 Colour and contrast

Palette carried over from the bundle:

```
--care:     #E4572E   --steel:    #5980a6   --steel-mid: #416180
--steel-lt: #94bce3   --paper:    #f2f2f3   --ink:       #1d1f20
--steel900: #1d2d3d   --ink-soft: #424244
```

**Measured finding:** `#E4572E` on `#f2f2f3` is **3.29 : 1**. That satisfies
WCAG AA for large text (≥ 3:1) and for non-text UI components, but **fails for
body copy**, which requires 4.5:1.

Consequence, and it is binding: `--care` may be used for headings, large numerals,
rules, and control affordances only. A darkened `--care-text` token is introduced
for any small text that must carry the accent colour, and it must measure ≥ 4.5:1
against `--paper`.

Every foreground/background pair in the token set is verified by a unit test that
computes WCAG relative luminance. Contrast is a test, not a review comment.

---

## 4. Behaviour

### 4.1 Reading time

`lib/timing.ts` exports a pure function so that "sufficient reading time" — the
requirement most likely to be silently wrong — is directly testable.

```
readingSeconds(slide) =
    words(visibleText(slide)) / 130 wpm × 60
  + 2s per step
  clamped to [8s, 30s]
```

130 wpm is deliberately below conversational reading speed. The per-step addend
accounts for scanning the phone mocks, which carry meaning but few words.

### 4.2 Autoplay and narration

`useAutoplay` and `useSpeech` are independent hooks joined by one rule:

```
slideDuration = max(readingSeconds, speechEndedAt + 1200ms breath)
```

With narration off, the timer alone governs. With narration on, the deck never
advances mid-sentence, and never advances faster than a reader could follow.

The Web Speech `onend` event is unreliable across browsers and is known to drop
on long utterances. `useSpeech` therefore arms a watchdog at
`estimatedSpeechDuration × 1.5 + 5s`; if it fires, the hook resolves as if speech
ended and the deck falls back to timer pacing. Speech failure degrades pacing, it
never stalls the deck.

iOS Safari requires a user gesture before `speechSynthesis.speak` produces audio.
Narration therefore defaults to **off**, with a clearly labelled control to enable
it. This also means the deck never makes unexpected noise in a group room.

Autoplay pauses on: manual navigation, `document.hidden`, video playback, and
quiz interaction. It never resumes silently after a manual pause.

### 4.3 Transitions

Crossfade between two stacked layers, `opacity` 600 ms ease. The outgoing layer
gets `pointer-events: none` for the duration. Under
`prefers-reduced-motion: reduce`, the crossfade is replaced by an instant cut —
no fade, no movement.

### 4.4 Navigation

- Keyboard: `→` `Space` `PageDown` next; `←` `PageUp` previous; `Home` first;
  `End` last; `P` toggles play/pause; `V` toggles narration.
- Touch: horizontal swipe on phone, plus always-visible previous/next controls.
- A progress bar plus slide counter is visible at all times, so a senior always
  knows how far through they are and how much remains.

### 4.5 Video slide

The Facebook Reel is loaded behind a **click-to-load facade**. On slide entry the
application renders a branded poster card with a title, one line of context, and
a large play control. No Facebook iframe, script, or cookie is requested until the
user activates it.

This is deliberate: it prevents third-party tracking of users who never watch,
removes a render-blocking third-party request from every page load, and eliminates
the layout shift the embed would otherwise cause. Once activated, the iframe is
injected with the supplied embed URL and autoplay is suppressed.

The Reel is portrait (267 × 591). On desktop it renders as a centred portrait
column with supporting text beside it; on phone it fills the content width.

### 4.6 Quiz

Slide 11's quiz becomes interactive — this is the "fun learning" element. Tapping
an answer gives immediate, encouraging feedback: a correct answer confirms and
explains; an incorrect answer says so gently and invites another try rather than
locking out. Answer state resets when the slide is left, so the deck can be
re-run for the next group.

Quiz interaction pauses autoplay, so nobody is hurried through it.

### 4.7 PDF download

`nhg-health-digital-education.pdf` is served from `public/docs/`. A download
control is present in the persistent control bar on every slide, using a plain
`<a download>` — no JavaScript, works with the network flaky, works if the user
long-presses to save instead.

---

## 5. Accessibility

Non-negotiable for this audience and this deployment context.

- Minimum 18 px type anywhere; 20 px body on phone.
- Minimum 56 × 56 px interactive targets.
- All text pairs meet WCAG AA, enforced by unit test (§ 3.6).
- Full keyboard operability; visible focus rings that meet 3:1 against both themes.
- Slide changes announced via a polite `aria-live` region carrying the slide label.
- Speaker notes are present in the DOM as text, so screen readers reach the same
  narration content that the speech synthesiser reads aloud.
- `prefers-reduced-motion` honoured.
- Semantic headings; the deck is a landmark region with an accessible name.
- Playwright e2e runs an automated accessibility scan on every slide, in both
  themes and both viewports.

---

## 6. Testing

**Unit (Vitest)**

- `lib/timing.ts` — word counting, per-step addend, clamping at both bounds.
- Token contrast — every foreground/background pair computes ≥ 4.5:1 for body
  text and ≥ 3:1 for large text and UI.
- Content integrity — every slide has non-empty `speakerNotes`; ids are unique;
  `number` values are sequential; every `steps` body has ≥ 1 step; every
  `MockLine` discriminant is renderable.
- `lib/speech.ts` — watchdog fires on missing `onend`; cancel is idempotent;
  unsupported environment degrades rather than throws.
- `Quiz` logic — correct/incorrect feedback, retry, reset on slide exit.

**E2E (Playwright)** — at 375 × 812 and 1280 × 800:

- Keyboard and control navigation reaches all 11 slides in order.
- Autoplay advances, and does so no faster than the computed reading time.
- Autoplay pauses on manual navigation and on tab hide.
- Narration toggle changes state without throwing in a headless browser.
- The PDF link resolves 200 and carries a PDF content type.
- The video facade issues **no** `facebook.com` request before activation, and
  does issue one after.
- Quiz answers give feedback.
- Accessibility scan passes on every slide.

**Scripts**

```
npm run dev        next dev
npm run build      next build
npm run start      next start
npm run lint       eslint, zero warnings tolerated
npm run typecheck  tsc --noEmit
npm run test       vitest run
npm run test:e2e   playwright test
npm run verify     lint && typecheck && test && build
```

`verify` is the gate. Nothing is described as done until it passes.

---

## 7. Assets and open items

| Item | Status | Owner |
|---|---|---|
| Care Corner logo | **Required.** Drop the official file at `public/images/care-corner-logo.png` (or `.svg`). A typographic placeholder ships until then. | John Tan |
| Reference PDF | Available at `C:\Users\admin\Downloads\nhg-health digital-education.pdf`; copied into `public/docs/` during implementation. | — |
| Facebook embed URL | Supplied in the brief. | — |
| Slide 10 narration | Newly written during implementation; all other notes carried over verbatim. | — |

The logo slot renders the placeholder when the file is absent and the real asset
when present, so a missing logo never blocks build, test, or deploy.

---

## 8. Deployment

1. Local: `npm run verify` must pass.
2. Git: repository at `C:\Users\admin\nhg-health-app`, branch `main`, remote
   `https://github.com/JohnTan38/nhg-health-app`. **First push requires explicit
   confirmation.**
3. Vercel: new project `nhg-health-app`, distinct from the existing
   `ntuc-health-activity-registration` project. Preview deploy first.
4. Production promotion to `nhg-health-app.vercel.app` **requires explicit
   confirmation.**

Note: `C:\Users\admin\kwsc-registration` is a different application and is not
touched by this work.
