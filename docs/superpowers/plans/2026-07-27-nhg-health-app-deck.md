# NHG Health App Deck — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a web and mobile optimised, self-advancing, narrated 11-slide teaching deck for the NHG Health App, readable by elderly seniors on a phone, deployed to Vercel.

**Architecture:** The approved Claude Design bundle is treated as a content source, not code. Slide content becomes typed data (`content/slides.ts`) rendered by five layout components; a `PhoneMock` component renders in-app screenshots from a `MockLine[]` union. Autoplay is paced by a pure reading-time function coupled to a Web Speech wrapper. Everything is statically prerendered — no backend.

**Tech Stack:** Next.js 16.2.12 (App Router), React 19.2.8, TypeScript 6.0.3, CSS Modules, Vitest 4, Playwright 1.62 + axe-core.

**Spec:** `docs/superpowers/specs/2026-07-27-nhg-health-app-deck-design.md`
**Content source:** `docs/source/deck-template.html` — the extracted bundle markup. Slides appear as `<section data-label=… data-screen-label=… data-speaker-notes=…>`. This is the authoritative text for every slide.

**Version pin — do not "upgrade" this:** TypeScript is pinned to **6.0.3**, not the `latest` 7.0.2. `typescript-eslint@8.65.0` declares `typescript: >=4.8.4 <6.1.0`; TypeScript 7 breaks linting. Verify with `npm view typescript-eslint peerDependencies` before ever changing it.

---

## File Structure

| File | Responsibility |
|---|---|
| `app/layout.tsx` | Fonts, metadata, html shell |
| `app/page.tsx` | Renders `<Deck>` with slide data |
| `app/globals.css` | Reset + design tokens + type scale |
| `lib/contrast.ts` | Pure WCAG luminance and ratio maths |
| `lib/tokens.ts` | Palette as data, so contrast is testable |
| `lib/timing.ts` | Pure reading-time calculation |
| `lib/speech.ts` | Speech availability, voice pick, utterance build |
| `content/types.ts` | `Slide`, `SlideBody`, `MockLine` and supporting types |
| `content/slides.ts` | All 11 slides as data |
| `hooks/useSpeech.ts` | Speech lifecycle + watchdog |
| `hooks/useAutoplay.ts` | Index advance, pause rules |
| `hooks/usePrefersReducedMotion.ts` | Media query hook |
| `hooks/useSwipe.ts` | Touch swipe navigation with a 60px threshold |
| `components/Deck.tsx` | Orchestrator: state, keyboard, crossfade |
| `components/Slide.tsx` | Dispatch on `body.kind` |
| `components/layouts/*.tsx` | Cover, Overview, Steps, Video, Practice |
| `components/PhoneMock.tsx` | Renders `MockLine[]` |
| `components/Controls.tsx` | Play/pause, prev/next, voice, PDF |
| `components/ProgressBar.tsx` | Position indicator |
| `components/SpeakerNotes.tsx` | Caption panel |
| `components/VideoFacade.tsx` | Click-to-load Facebook embed |
| `components/Quiz.tsx` | Interactive quiz |
| `components/LogoSlot.tsx` | Care Corner logo or placeholder |

---

## Task 1: Scaffold project and toolchain

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `vitest.config.ts`, `vitest.setup.ts`, `.gitignore`
- Create: `app/layout.tsx`, `app/page.tsx`, `app/globals.css`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "nhg-health-app",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint . --max-warnings=0",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "verify": "npm run lint && npm run typecheck && npm run test && npm run build"
  },
  "dependencies": {
    "next": "16.2.12",
    "react": "19.2.8",
    "react-dom": "19.2.8"
  },
  "devDependencies": {
    "@axe-core/playwright": "4.12.1",
    "@eslint/eslintrc": "3.3.1",
    "@playwright/test": "1.62.0",
    "@testing-library/dom": "10.4.1",
    "@testing-library/jest-dom": "6.9.1",
    "@testing-library/react": "16.3.2",
    "@testing-library/user-event": "14.6.1",
    "@types/node": "24.10.1",
    "@types/react": "19.2.8",
    "@types/react-dom": "19.2.8",
    "@vitejs/plugin-react": "6.0.4",
    "eslint": "10.8.0",
    "eslint-config-next": "16.2.12",
    "jsdom": "29.1.1",
    "typescript": "6.0.3",
    "vite-tsconfig-paths": "6.1.1",
    "vitest": "4.1.10"
  }
}
```

- [ ] **Step 2: Install**

Run: `npm install`
Expected: completes with no `ERESOLVE` error. If a peer conflict appears, do **not** add `--legacy-peer-deps`; report it — a real version incompatibility must be resolved, not suppressed.

- [ ] **Step 3: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "ES2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", "tests/e2e"]
}
```

- [ ] **Step 4: Create `next.config.ts`**

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
```

- [ ] **Step 5: Create `eslint.config.mjs`**

```js
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

export default [
  { ignores: ['.next/**', 'node_modules/**', 'playwright-report/**', 'test-results/**'] },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
];
```

- [ ] **Step 6: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['tests/unit/**/*.test.{ts,tsx}'],
  },
});
```

- [ ] **Step 7: Create `vitest.setup.ts`**

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 8: Create `app/globals.css` with tokens**

```css
*, *::before, *::after { box-sizing: border-box; }
* { margin: 0; padding: 0; }

:root {
  --care: #E4572E;
  --care-text: #BC421D;
  --steel: #5980a6;
  --steel-mid: #416180;
  --steel-lt: #94bce3;
  --paper: #f2f2f3;
  --ink: #1d1f20;
  --ink-soft: #424244;
  --steel900: #1d2d3d;
  --on-dark: #d6ebff;
  --on-dark-soft: #bdd8f2;

  --type-title: 34px;
  --type-subtitle: 26px;
  --type-body: 20px;
  --type-small: 18px;

  --tap-min: 56px;
  --fade-ms: 600ms;
}

@media (min-width: 768px) {
  :root {
    --type-title: clamp(44px, 4vw, 76px);
    --type-subtitle: clamp(30px, 2.3vw, 44px);
    --type-body: clamp(20px, 1.8vw, 34px);
    --type-small: clamp(17px, 1.45vw, 28px);
  }
}

@media (prefers-reduced-motion: reduce) {
  :root { --fade-ms: 0ms; }
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

html, body { height: 100%; }
body {
  background: var(--paper);
  color: var(--ink);
  font-size: var(--type-body);
  line-height: 1.45;
  -webkit-text-size-adjust: 100%;
}
:focus-visible { outline: 3px solid var(--care); outline-offset: 3px; }
```

- [ ] **Step 9: Create `app/layout.tsx`**

```tsx
import type { Metadata, Viewport } from 'next';
import { Barlow, Barlow_Condensed } from 'next/font/google';
import './globals.css';

const barlow = Barlow({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
  display: 'swap',
});

const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['500', '600'],
  variable: '--font-heading',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'NHG Health App — A step-by-step guide for seniors',
  description:
    'Care Corner digital education: book appointments, register your queue, check in, and manage medicines with the NHG Health App.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1d2d3d',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-SG" className={`${barlow.variable} ${barlowCondensed.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 10: Create placeholder `app/page.tsx`**

```tsx
export default function Home() {
  return <main>NHG Health App</main>;
}
```

- [ ] **Step 11: Verify the toolchain**

Run: `npm run lint && npm run typecheck && npm run build`
Expected: all three succeed. `next build` reports `/` as a static route.

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js app with pinned toolchain

TypeScript pinned to 6.0.3 because typescript-eslint@8 requires <6.1.0."
```

---

## Task 2: Contrast maths (TDD)

Contrast is a test, not a review comment. This task builds the measuring tool.

**Files:**
- Create: `lib/contrast.ts`, `tests/unit/contrast.test.ts`

- [ ] **Step 1: Write the failing test**

`tests/unit/contrast.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { contrastRatio, relativeLuminance } from '@/lib/contrast';

describe('relativeLuminance', () => {
  it('is 0 for black and 1 for white', () => {
    expect(relativeLuminance('#000000')).toBeCloseTo(0, 5);
    expect(relativeLuminance('#ffffff')).toBeCloseTo(1, 5);
  });

  it('accepts shorthand hex', () => {
    expect(relativeLuminance('#fff')).toBeCloseTo(1, 5);
  });
});

describe('contrastRatio', () => {
  it('is 21:1 for black on white', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 4);
  });

  it('is order independent', () => {
    expect(contrastRatio('#1d1f20', '#f2f2f3')).toBeCloseTo(
      contrastRatio('#f2f2f3', '#1d1f20'),
      6,
    );
  });

  // The measured finding recorded in the spec, locked in as a regression test.
  it('measures Care Corner orange on paper at 3.29:1', () => {
    expect(contrastRatio('#E4572E', '#f2f2f3')).toBeCloseTo(3.29, 1);
  });

  it('measures ink on paper at 14.8:1', () => {
    expect(contrastRatio('#1d1f20', '#f2f2f3')).toBeCloseTo(14.8, 1);
  });

  it('rejects malformed hex', () => {
    expect(() => relativeLuminance('nope')).toThrow(/hex/i);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test -- contrast`
Expected: FAIL — cannot resolve `@/lib/contrast`.

- [ ] **Step 3: Implement `lib/contrast.ts`**

```ts
const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

function expand(hex: string): [number, number, number] {
  if (!HEX.test(hex)) {
    throw new Error(`Invalid hex colour: ${hex}`);
  }
  const body = hex.slice(1);
  const full =
    body.length === 3
      ? body
          .split('')
          .map((c) => c + c)
          .join('')
      : body;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

/** WCAG 2.1 relative luminance, 0 (black) to 1 (white). */
export function relativeLuminance(hex: string): number {
  const [r, g, b] = expand(hex);
  const channel = (v: number): number => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG 2.1 contrast ratio, 1 to 21. Order independent. */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm run test -- contrast`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/contrast.ts tests/unit/contrast.test.ts
git commit -m "feat: add WCAG contrast measurement"
```

---

## Task 3: Palette as data, with enforced contrast (TDD)

**Files:**
- Create: `lib/tokens.ts`, `tests/unit/tokens.test.ts`

- [ ] **Step 1: Write the failing test**

`tests/unit/tokens.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { contrastRatio } from '@/lib/contrast';
import { BODY_TEXT_PAIRS, LARGE_TEXT_PAIRS, PALETTE } from '@/lib/tokens';

describe('palette', () => {
  it('exposes every token as a valid hex string', () => {
    for (const [name, value] of Object.entries(PALETTE)) {
      expect(value, name).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});

describe('body text pairs meet WCAG AA (4.5:1)', () => {
  it.each(BODY_TEXT_PAIRS)('$fg on $bg', ({ fg, bg }) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });
});

describe('large text and UI pairs meet WCAG AA (3:1)', () => {
  it.each(LARGE_TEXT_PAIRS)('$fg on $bg', ({ fg, bg }) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(3);
  });
});

describe('the accent restriction recorded in the spec', () => {
  it('care is NOT usable for body text on paper', () => {
    expect(contrastRatio(PALETTE.care, PALETTE.paper)).toBeLessThan(4.5);
  });

  it('careText IS usable for body text on paper', () => {
    expect(contrastRatio(PALETTE.careText, PALETTE.paper)).toBeGreaterThanOrEqual(4.5);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test -- tokens`
Expected: FAIL — cannot resolve `@/lib/tokens`.

- [ ] **Step 3: Implement `lib/tokens.ts`**

Values mirror `app/globals.css`. `careText` (#BC421D) measures 4.77:1 on paper; `care` (#E4572E) measures 3.29:1 and is therefore large-text/UI only.

```ts
export const PALETTE = {
  care: '#E4572E',
  careText: '#BC421D',
  steel: '#5980a6',
  steelMid: '#416180',
  steelLt: '#94bce3',
  paper: '#f2f2f3',
  ink: '#1d1f20',
  inkSoft: '#424244',
  steel900: '#1d2d3d',
  onDark: '#d6ebff',
  onDarkSoft: '#bdd8f2',
} as const;

export interface ColourPair {
  fg: string;
  bg: string;
}

/** Pairs used for text below 24px. Must meet 4.5:1. */
export const BODY_TEXT_PAIRS: ColourPair[] = [
  { fg: PALETTE.ink, bg: PALETTE.paper },
  { fg: PALETTE.inkSoft, bg: PALETTE.paper },
  { fg: PALETTE.steelMid, bg: PALETTE.paper },
  { fg: PALETTE.careText, bg: PALETTE.paper },
  { fg: PALETTE.paper, bg: PALETTE.steel900 },
  { fg: PALETTE.onDark, bg: PALETTE.steel900 },
  { fg: PALETTE.onDarkSoft, bg: PALETTE.steel900 },
  { fg: PALETTE.steelLt, bg: PALETTE.steel900 },
];

/** Pairs used only for headings, large numerals, rules and control chrome. */
export const LARGE_TEXT_PAIRS: ColourPair[] = [
  { fg: PALETTE.care, bg: PALETTE.paper },
  { fg: PALETTE.care, bg: PALETTE.steel900 },
  { fg: PALETTE.steel, bg: PALETTE.paper },
];
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm run test -- tokens`
Expected: PASS. If any pair fails, darken the foreground token in **both** `lib/tokens.ts` and `app/globals.css` — they must never drift.

- [ ] **Step 5: Commit**

```bash
git add lib/tokens.ts tests/unit/tokens.test.ts
git commit -m "feat: enforce WCAG AA across the palette by test"
```

---

## Task 4: Reading time (TDD)

"Sufficient reading time" is the requirement most likely to be silently wrong, so it is a pure function with exact tests.

**Files:**
- Create: `lib/timing.ts`, `tests/unit/timing.test.ts`

- [ ] **Step 1: Write the failing test**

`tests/unit/timing.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  MAX_SECONDS,
  MIN_SECONDS,
  countWords,
  readingSeconds,
} from '@/lib/timing';

describe('countWords', () => {
  it('counts whitespace-separated words', () => {
    expect(countWords('one two three')).toBe(3);
  });

  it('collapses irregular whitespace', () => {
    expect(countWords('  one \n two \t three  ')).toBe(3);
  });

  it('is 0 for empty or blank input', () => {
    expect(countWords('')).toBe(0);
    expect(countWords('   ')).toBe(0);
  });
});

describe('readingSeconds', () => {
  it('reads at 130 words per minute', () => {
    // 65 words = 30s at 130wpm, which is exactly the cap.
    expect(readingSeconds(65, 0)).toBe(30);
    // 26 words = 12s.
    expect(readingSeconds(26, 0)).toBe(12);
  });

  it('adds 2 seconds per step for scanning the phone mocks', () => {
    expect(readingSeconds(26, 3)).toBe(18);
  });

  it('never returns less than the minimum', () => {
    expect(readingSeconds(0, 0)).toBe(MIN_SECONDS);
    expect(readingSeconds(13, 0)).toBe(MIN_SECONDS); // raw 6s
  });

  it('never returns more than the maximum', () => {
    expect(readingSeconds(1000, 10)).toBe(MAX_SECONDS);
  });

  it('has sane bounds for an elderly audience', () => {
    expect(MIN_SECONDS).toBe(8);
    expect(MAX_SECONDS).toBe(30);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test -- timing`
Expected: FAIL — cannot resolve `@/lib/timing`.

- [ ] **Step 3: Implement `lib/timing.ts`**

```ts
/** Deliberately below conversational pace — the audience is elderly seniors. */
export const WORDS_PER_MINUTE = 130;
/** Phone mocks carry meaning but few words; allow time to scan each one. */
export const SECONDS_PER_STEP = 2;
export const MIN_SECONDS = 8;
export const MAX_SECONDS = 30;

export function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed === '' ? 0 : trimmed.split(/\s+/).length;
}

export function readingSeconds(words: number, stepCount: number): number {
  const raw = (words / WORDS_PER_MINUTE) * 60 + stepCount * SECONDS_PER_STEP;
  return Math.min(MAX_SECONDS, Math.max(MIN_SECONDS, Math.round(raw)));
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm run test -- timing`
Expected: PASS, 9 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/timing.ts tests/unit/timing.test.ts
git commit -m "feat: add reading-time pacing calculation"
```

---

## Task 5: Content types

**Files:**
- Create: `content/types.ts`

- [ ] **Step 1: Write `content/types.ts`**

No test in this task — types are exercised by Task 6's integrity tests and by `tsc`.

```ts
export type Theme = 'dark' | 'light';

export type MockLine =
  | { kind: 'nav'; items: string[]; active?: string }
  | { kind: 'row'; label: string; sub?: string }
  | { kind: 'button'; label: string; primary?: boolean }
  | { kind: 'chips'; items: string[]; active?: string }
  | { kind: 'status'; label: string }
  | { kind: 'itinerary'; items: string[]; doneCount?: number }
  | { kind: 'checkbox'; label: string }
  | { kind: 'big'; label: string }
  | { kind: 'qr' };

export interface Step {
  /** '1'–'5' for numbered slides, 'A'–'C' for the lettered refill slide. */
  marker: string;
  caption: string;
  mockTitle?: string;
  mock: MockLine[];
}

export interface Callout {
  title: string;
  body: string;
}

export interface Stat {
  value: string;
  body: string;
}

export interface OverviewCard {
  number: string;
  title: string;
  body: string;
}

export interface QuizOption {
  label: string;
  correct: boolean;
}

export interface Quiz {
  question: string;
  options: QuizOption[];
  correctFeedback: string;
  retryFeedback: string;
}

export type SlideBody =
  | { kind: 'cover'; presentedBy: string[] }
  | { kind: 'overview'; cards: OverviewCard[] }
  | { kind: 'steps'; callout?: Callout; stat?: Stat; steps: Step[]; lettered?: boolean }
  | { kind: 'video'; embedUrl: string; posterTitle: string; posterBody: string }
  | { kind: 'practice'; tasks: string[]; quiz: Quiz; help: Callout };

export interface Slide {
  id: string;
  /** Display only — '01'…'11'. */
  number: string;
  /** Short name for progress dots and screen-reader announcements. */
  label: string;
  eyebrow?: string;
  title: string;
  lede?: string;
  theme: Theme;
  body: SlideBody;
  /** Narration script. Also rendered as on-screen captions. */
  speakerNotes: string;
}
```

- [ ] **Step 2: Verify it typechecks**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add content/types.ts
git commit -m "feat: add slide content model types"
```

---

## Task 6: Transcribe the deck content (TDD)

**Files:**
- Create: `content/slides.ts`, `tests/unit/slides.test.ts`
- Read: `docs/source/deck-template.html` — the authoritative source

**Transcription rules — follow exactly:**

1. Open `docs/source/deck-template.html`. Each slide is a `<section>` carrying `data-label`, `data-screen-label` and `data-speaker-notes`.
2. Copy `data-speaker-notes` **verbatim** into `speakerNotes`, including the em dashes. Do not paraphrase or "improve" it — this text is the narration and was written for this audience.
3. Copy all visible slide text verbatim, preserving the curly quotes (`'` `"`) and the Chinese characters on slide 08 (`白色药丸`).
4. The bundle's slide 10 (`Practice time`) becomes **slide 11**. A new video slide is inserted at position 10.
5. Slide ids, in order: `cover`, `overview`, `getting-started`, `book-appointment`, `register-queue`, `i-have-arrived`, `allergies`, `medications`, `medicine-refill`, `watch-video`, `practice`.

- [ ] **Step 1: Write the failing integrity test**

`tests/unit/slides.test.ts`. These tests enforce that the transcription is complete — they are the guard against a half-done copy.

```ts
import { describe, expect, it } from 'vitest';
import { SLIDES } from '@/content/slides';
import type { MockLine } from '@/content/types';

const RENDERABLE: MockLine['kind'][] = [
  'nav', 'row', 'button', 'chips', 'status', 'itinerary', 'checkbox', 'big', 'qr',
];

describe('deck integrity', () => {
  it('has exactly 11 slides', () => {
    expect(SLIDES).toHaveLength(11);
  });

  it('uses the agreed ids in the agreed order', () => {
    expect(SLIDES.map((s) => s.id)).toEqual([
      'cover', 'overview', 'getting-started', 'book-appointment',
      'register-queue', 'i-have-arrived', 'allergies', 'medications',
      'medicine-refill', 'watch-video', 'practice',
    ]);
  });

  it('numbers slides sequentially from 01', () => {
    expect(SLIDES.map((s) => s.number)).toEqual([
      '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11',
    ]);
  });

  it('gives every slide a title and a label', () => {
    for (const s of SLIDES) {
      expect(s.title.trim(), s.id).not.toBe('');
      expect(s.label.trim(), s.id).not.toBe('');
    }
  });

  it('gives every slide narration of at least 8 words', () => {
    for (const s of SLIDES) {
      expect(s.speakerNotes.trim().split(/\s+/).length, s.id).toBeGreaterThanOrEqual(8);
    }
  });

  it('gives every steps slide at least one step, each with a caption and a mock', () => {
    for (const s of SLIDES) {
      if (s.body.kind !== 'steps') continue;
      expect(s.body.steps.length, s.id).toBeGreaterThan(0);
      for (const step of s.body.steps) {
        expect(step.marker.trim(), `${s.id} marker`).not.toBe('');
        expect(step.caption.trim(), `${s.id} caption`).not.toBe('');
        expect(step.mock.length, `${s.id} mock`).toBeGreaterThan(0);
      }
    }
  });

  it('uses only renderable mock line kinds', () => {
    for (const s of SLIDES) {
      if (s.body.kind !== 'steps') continue;
      for (const step of s.body.steps) {
        for (const line of step.mock) {
          expect(RENDERABLE, `${s.id}/${step.marker}`).toContain(line.kind);
        }
      }
    }
  });

  it('marks the refill slide as lettered and uses A/B/C markers', () => {
    const refill = SLIDES.find((s) => s.id === 'medicine-refill');
    expect(refill?.body.kind).toBe('steps');
    if (refill?.body.kind !== 'steps') throw new Error('unreachable');
    expect(refill.body.lettered).toBe(true);
    expect(refill.body.steps.map((s) => s.marker)).toEqual(['A', 'B', 'C']);
  });

  it('gives the overview exactly five cards', () => {
    const overview = SLIDES.find((s) => s.id === 'overview');
    if (overview?.body.kind !== 'overview') throw new Error('unreachable');
    expect(overview.body.cards).toHaveLength(5);
  });

  it('points the video slide at the supplied Facebook reel', () => {
    const video = SLIDES.find((s) => s.id === 'watch-video');
    if (video?.body.kind !== 'video') throw new Error('unreachable');
    expect(video.body.embedUrl).toContain('facebook.com/plugins/video.php');
    expect(video.body.embedUrl).toContain('1515863629476795');
  });

  it('gives the quiz exactly one correct answer', () => {
    const practice = SLIDES.find((s) => s.id === 'practice');
    if (practice?.body.kind !== 'practice') throw new Error('unreachable');
    expect(practice.body.quiz.options.filter((o) => o.correct)).toHaveLength(1);
    expect(practice.body.quiz.options.length).toBeGreaterThanOrEqual(3);
  });

  it('preserves the Chinese example note on the medications slide', () => {
    const meds = SLIDES.find((s) => s.id === 'medications');
    if (meds?.body.kind !== 'steps') throw new Error('unreachable');
    expect(JSON.stringify(meds)).toContain('白色药丸');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test -- slides`
Expected: FAIL — cannot resolve `@/content/slides`.

- [ ] **Step 3: Write `content/slides.ts`**

Transcribe all 11 slides from `docs/source/deck-template.html` following the rules above. Here are the first three fully worked, showing the exact shape for each layout. Continue the same way for slides 04–11.

```ts
import type { Slide } from './types';

export const FACEBOOK_REEL_EMBED =
  'https://www.facebook.com/plugins/video.php?height=476&href=https%3A%2F%2Fwww.facebook.com%2Freel%2F1515863629476795%2F&show_text=false&width=267&t=0';

export const SLIDES: Slide[] = [
  {
    id: 'cover',
    number: '01',
    label: 'Welcome',
    eyebrow: 'Digital Education Series',
    title: 'NHG Health App',
    lede: 'A simple, step-by-step guide for seniors',
    theme: 'dark',
    speakerNotes:
      'Welcome everyone. Today we learn the NHG Health App together — one step at a time. No rush.',
    body: {
      kind: 'cover',
      presentedBy: ['Care Corner Singapore', 'Active Ageing & Senior Services'],
    },
  },
  {
    id: 'overview',
    number: '02',
    label: 'What the app does',
    eyebrow: 'Overview',
    title: 'Five things the app does for you',
    lede: 'Everything today happens in the app. You will need your phone and your Singpass.',
    theme: 'light',
    speakerNotes:
      'Five things only. Tell them we will practise each one today. Reassure: they do not need to remember everything.',
    body: {
      kind: 'overview',
      cards: [
        { number: '01', title: 'Book an appointment', body: 'Choose your clinic, reason and time slot.' },
        { number: '02', title: 'Register your queue', body: 'Join the queue from home and see your itinerary.' },
        { number: '03', title: 'Say "I have arrived"', body: 'Check in at the clinic without queueing at a counter.' },
        { number: '04', title: 'See your health info', body: 'Allergies, health issues and medicines in one place.' },
        { number: '05', title: 'Request a refill', body: 'Ask for more medicine and have it delivered.' },
      ],
    },
  },
  {
    id: 'getting-started',
    number: '03',
    label: 'Getting started',
    eyebrow: 'Set up · Once only',
    title: 'Getting started with the app',
    lede: 'Guide page 5 · About 5 minutes',
    theme: 'light',
    speakerNotes:
      'Walk the room through the QR code first. Pause after each step and let everyone catch up before moving on.',
    body: {
      kind: 'steps',
      steps: [
        {
          marker: '1',
          caption: 'Scan the QR code to download NHG Health from Google Play or the App Store.',
          mock: [{ kind: 'qr' }],
        },
        {
          marker: '2',
          caption: 'Tap your preferred language, then Confirm.',
          mock: [
            { kind: 'chips', items: ['English', '中文', 'Melayu'], active: 'English' },
            { kind: 'button', label: 'Confirm', primary: true },
          ],
        },
        {
          marker: '3',
          caption: 'Tap the big Start button.',
          mock: [{ kind: 'button', label: 'Start', primary: true }],
        },
        {
          marker: '4',
          caption: 'Read the Terms of Use, tick the box and tap I accept.',
          mock: [
            { kind: 'checkbox', label: 'I accept the Terms of Use' },
            { kind: 'button', label: 'I accept', primary: true },
          ],
        },
        {
          marker: '5',
          caption: 'Fill in your details and tap Finish Setup. Done!',
          mock: [
            { kind: 'row', label: 'Name' },
            { kind: 'row', label: 'Mobile number' },
            { kind: 'button', label: 'Finish Setup', primary: true },
          ],
        },
      ],
    },
  },
  // Slides 04–11 continue here, transcribed from docs/source/deck-template.html.
  // Exact source line for each <section>, and the shape each one takes:
  //
  //  04 book-appointment  line 565 — eyebrow 'Appointments · Guide page 16'
  //                                  callout 'Good to know', 4 steps, light
  //  05 register-queue    line 622 — eyebrow 'Clinic day · Guide page 18'
  //                                  callout 'Where it works', 3 steps, light
  //  06 i-have-arrived    line 668 — eyebrow 'Clinic day · Guide page 19'
  //                                  stat { value: '30', body: '…minutes before…' }
  //                                  3 steps, theme 'dark'
  //  07 allergies         line 710 — eyebrow 'My Care Plan · Guide page 43'
  //                                  callout 'Tip', 3 steps, light
  //  08 medications       line 758 — eyebrow 'My Care Plan · Guide page 44'
  //                                  callout 'Try this today', 3 steps, light
  //                                  (preserve 白色药丸 in the callout body)
  //  09 medicine-refill   line 804 — eyebrow 'Medication · Guide pages 59–60'
  //                                  lettered: true, markers A/B/C, 3 steps, light
  //  10 watch-video          (new) — see the block below
  //  11 practice          line 847 — 3 tasks, quiz, help callout, light
];
```

For slide 10, which has no source, use exactly this:

```ts
  {
    id: 'watch-video',
    number: '10',
    label: 'See it in action',
    eyebrow: 'Watch',
    title: 'See it in action',
    lede: 'A short video showing the app being used, before you try it yourself.',
    theme: 'dark',
    speakerNotes:
      'Play the video for the room. Afterwards, ask if anyone saw a screen they recognise from their own phone.',
    body: {
      kind: 'video',
      embedUrl: FACEBOOK_REEL_EMBED,
      posterTitle: 'Watch: using the NHG Health App',
      posterBody: 'Tap to play. The video loads from Facebook only when you tap.',
    },
  },
```

And for slide 11's quiz:

```ts
      quiz: {
        question: 'How many minutes before your appointment can you tap "I have arrived"?',
        options: [
          { label: '10', correct: false },
          { label: '30', correct: true },
          { label: '60', correct: false },
        ],
        correctFeedback: 'That is right — 30 minutes before your appointment.',
        retryFeedback: 'Not quite. Have another look at the "I have arrived" slide, then try again.',
      },
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm run test -- slides`
Expected: PASS, 12 tests. Any failure names the slide id at fault.

- [ ] **Step 5: Commit**

```bash
git add content/slides.ts tests/unit/slides.test.ts
git commit -m "feat: transcribe the 11-slide deck into typed content"
```

---

## Task 7: Slide reading time from content (TDD)

Wires Task 4's pure function to the real slides.

**Files:**
- Modify: `lib/timing.ts`
- Create: `tests/unit/slide-timing.test.ts`

- [ ] **Step 1: Write the failing test**

`tests/unit/slide-timing.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { SLIDES } from '@/content/slides';
import { MAX_SECONDS, MIN_SECONDS, slideText, slideSeconds } from '@/lib/timing';

describe('slideText', () => {
  it('includes the title, lede and step captions', () => {
    const slide = SLIDES.find((s) => s.id === 'getting-started')!;
    const text = slideText(slide);
    expect(text).toContain('Getting started with the app');
    expect(text).toContain('Tap the big Start button.');
  });

  it('excludes speaker notes, which are narrated rather than read', () => {
    const slide = SLIDES.find((s) => s.id === 'cover')!;
    expect(slideText(slide)).not.toContain('No rush');
  });
});

describe('slideSeconds', () => {
  it('stays within bounds for every real slide', () => {
    for (const slide of SLIDES) {
      const s = slideSeconds(slide);
      expect(s, slide.id).toBeGreaterThanOrEqual(MIN_SECONDS);
      expect(s, slide.id).toBeLessThanOrEqual(MAX_SECONDS);
    }
  });

  it('gives a dense steps slide more time than the sparse cover', () => {
    const cover = SLIDES.find((s) => s.id === 'cover')!;
    const started = SLIDES.find((s) => s.id === 'getting-started')!;
    expect(slideSeconds(started)).toBeGreaterThan(slideSeconds(cover));
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test -- slide-timing`
Expected: FAIL — `slideText` is not exported.

- [ ] **Step 3: Add to `lib/timing.ts`**

```ts
import type { Slide } from '@/content/types';

/** All text a viewer must actually read on screen. Narration is excluded. */
export function slideText(slide: Slide): string {
  const parts: string[] = [slide.eyebrow ?? '', slide.title, slide.lede ?? ''];
  const b = slide.body;

  switch (b.kind) {
    case 'cover':
      parts.push(...b.presentedBy);
      break;
    case 'overview':
      for (const c of b.cards) parts.push(c.title, c.body);
      break;
    case 'steps':
      if (b.callout) parts.push(b.callout.title, b.callout.body);
      if (b.stat) parts.push(b.stat.value, b.stat.body);
      for (const s of b.steps) parts.push(s.caption, s.mockTitle ?? '');
      break;
    case 'video':
      parts.push(b.posterTitle, b.posterBody);
      break;
    case 'practice':
      parts.push(...b.tasks, b.quiz.question, b.help.title, b.help.body);
      for (const o of b.quiz.options) parts.push(o.label);
      break;
  }

  return parts.filter(Boolean).join(' ');
}

export function stepCount(slide: Slide): number {
  return slide.body.kind === 'steps' ? slide.body.steps.length : 0;
}

export function slideSeconds(slide: Slide): number {
  return readingSeconds(countWords(slideText(slide)), stepCount(slide));
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm run test -- slide-timing`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/timing.ts tests/unit/slide-timing.test.ts
git commit -m "feat: derive per-slide reading time from content"
```

---

## Task 8: Speech wrapper with watchdog (TDD)

Web Speech `onend` is unreliable and is known to drop on long utterances. The watchdog is the whole point of this task: speech failure must degrade to timer pacing, never stall the deck.

**Files:**
- Create: `lib/speech.ts`, `tests/unit/speech.test.ts`

- [ ] **Step 1: Write the failing test**

`tests/unit/speech.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSpeaker, isSpeechSupported, watchdogMs } from '@/lib/speech';

class FakeUtterance {
  text: string;
  lang = '';
  rate = 1;
  pitch = 1;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(text: string) {
    this.text = text;
  }
}

function installFakeSpeech(opts: { fireEnd: boolean }) {
  const spoken: FakeUtterance[] = [];
  const synth = {
    speak: (u: FakeUtterance) => {
      spoken.push(u);
      if (opts.fireEnd) queueMicrotask(() => u.onend?.());
    },
    cancel: vi.fn(),
    getVoices: () => [],
  };
  vi.stubGlobal('speechSynthesis', synth);
  vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
  return { spoken, synth };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('isSpeechSupported', () => {
  it('is false when the API is absent', () => {
    vi.stubGlobal('speechSynthesis', undefined);
    expect(isSpeechSupported()).toBe(false);
  });

  it('is true when the API is present', () => {
    installFakeSpeech({ fireEnd: true });
    expect(isSpeechSupported()).toBe(true);
  });
});

describe('watchdogMs', () => {
  it('scales with utterance length and adds headroom', () => {
    expect(watchdogMs(0)).toBeGreaterThanOrEqual(5000);
    expect(watchdogMs(100)).toBeGreaterThan(watchdogMs(10));
  });
});

describe('createSpeaker', () => {
  it('resolves when onend fires', async () => {
    installFakeSpeech({ fireEnd: true });
    const speaker = createSpeaker();
    const done = speaker.speak('hello there everyone');
    await vi.advanceTimersByTimeAsync(0);
    await expect(done).resolves.toBe('ended');
  });

  it('resolves via the watchdog when onend never fires', async () => {
    installFakeSpeech({ fireEnd: false });
    const speaker = createSpeaker();
    const done = speaker.speak('hello there everyone');
    await vi.advanceTimersByTimeAsync(120_000);
    await expect(done).resolves.toBe('watchdog');
  });

  it('resolves immediately when speech is unsupported', async () => {
    vi.stubGlobal('speechSynthesis', undefined);
    const speaker = createSpeaker();
    await expect(speaker.speak('anything')).resolves.toBe('unsupported');
  });

  it('cancel is safe to call repeatedly and when idle', () => {
    const { synth } = installFakeSpeech({ fireEnd: false });
    const speaker = createSpeaker();
    expect(() => {
      speaker.cancel();
      speaker.cancel();
    }).not.toThrow();
    expect(synth.cancel).toHaveBeenCalled();
  });

  it('cancelling a pending utterance resolves it as cancelled', async () => {
    installFakeSpeech({ fireEnd: false });
    const speaker = createSpeaker();
    const done = speaker.speak('a long sentence that never ends');
    speaker.cancel();
    await expect(done).resolves.toBe('cancelled');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test -- speech`
Expected: FAIL — cannot resolve `@/lib/speech`.

- [ ] **Step 3: Implement `lib/speech.ts`**

```ts
export type SpeechOutcome = 'ended' | 'watchdog' | 'cancelled' | 'unsupported' | 'error';

/** Rough spoken pace, used only to size the watchdog. */
const SPOKEN_WPM = 150;
const WATCHDOG_HEADROOM = 1.5;
const WATCHDOG_FLOOR_MS = 5_000;

export function isSpeechSupported(): boolean {
  return (
    typeof globalThis.speechSynthesis !== 'undefined' &&
    typeof globalThis.SpeechSynthesisUtterance !== 'undefined'
  );
}

export function estimatedSpeechMs(wordCount: number): number {
  return (wordCount / SPOKEN_WPM) * 60_000;
}

export function watchdogMs(wordCount: number): number {
  return estimatedSpeechMs(wordCount) * WATCHDOG_HEADROOM + WATCHDOG_FLOOR_MS;
}

export interface Speaker {
  speak(text: string): Promise<SpeechOutcome>;
  cancel(): void;
}

export function createSpeaker(): Speaker {
  let settle: ((o: SpeechOutcome) => void) | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const finish = (outcome: SpeechOutcome): void => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    const s = settle;
    settle = null;
    s?.(outcome);
  };

  return {
    speak(text: string): Promise<SpeechOutcome> {
      if (!isSpeechSupported()) return Promise.resolve('unsupported');

      // A previous utterance must never leak its resolution into this one.
      finish('cancelled');
      globalThis.speechSynthesis.cancel();

      return new Promise<SpeechOutcome>((resolve) => {
        settle = resolve;
        const utterance = new globalThis.SpeechSynthesisUtterance(text);
        utterance.lang = 'en-SG';
        // Slower than default: the audience is elderly seniors.
        utterance.rate = 0.9;
        utterance.onend = () => finish('ended');
        utterance.onerror = () => finish('error');

        const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
        timer = setTimeout(() => finish('watchdog'), watchdogMs(words));

        globalThis.speechSynthesis.speak(utterance);
      });
    },

    cancel(): void {
      finish('cancelled');
      if (isSpeechSupported()) globalThis.speechSynthesis.cancel();
    },
  };
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm run test -- speech`
Expected: PASS, 8 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/speech.ts tests/unit/speech.test.ts
git commit -m "feat: add speech wrapper with watchdog fallback

Web Speech onend is unreliable across browsers; the watchdog guarantees
the deck keeps advancing when it drops."
```

---

## Task 9: Autoplay hook (TDD)

**Files:**
- Create: `hooks/useAutoplay.ts`, `tests/unit/useAutoplay.test.ts`

- [ ] **Step 1: Write the failing test**

`tests/unit/useAutoplay.test.ts`:

```ts
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAutoplay } from '@/hooks/useAutoplay';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('useAutoplay', () => {
  it('does not advance while paused', () => {
    const onAdvance = vi.fn();
    renderHook(() => useAutoplay({ playing: false, durationMs: 1000, onAdvance }));
    act(() => { vi.advanceTimersByTime(5000); });
    expect(onAdvance).not.toHaveBeenCalled();
  });

  it('advances once per duration while playing', () => {
    const onAdvance = vi.fn();
    renderHook(() => useAutoplay({ playing: true, durationMs: 1000, onAdvance }));
    act(() => { vi.advanceTimersByTime(999); });
    expect(onAdvance).not.toHaveBeenCalled();
    act(() => { vi.advanceTimersByTime(1); });
    expect(onAdvance).toHaveBeenCalledTimes(1);
  });

  it('restarts the timer when the duration changes', () => {
    const onAdvance = vi.fn();
    const { rerender } = renderHook(
      ({ durationMs }) => useAutoplay({ playing: true, durationMs, onAdvance }),
      { initialProps: { durationMs: 1000 } },
    );
    act(() => { vi.advanceTimersByTime(900); });
    rerender({ durationMs: 2000 });
    act(() => { vi.advanceTimersByTime(1100); });
    expect(onAdvance).not.toHaveBeenCalled();
    act(() => { vi.advanceTimersByTime(900); });
    expect(onAdvance).toHaveBeenCalledTimes(1);
  });

  it('clears its timer on unmount', () => {
    const onAdvance = vi.fn();
    const { unmount } = renderHook(() =>
      useAutoplay({ playing: true, durationMs: 1000, onAdvance }),
    );
    unmount();
    act(() => { vi.advanceTimersByTime(5000); });
    expect(onAdvance).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test -- useAutoplay`
Expected: FAIL — cannot resolve `@/hooks/useAutoplay`.

- [ ] **Step 3: Implement `hooks/useAutoplay.ts`**

```ts
'use client';

import { useEffect, useRef } from 'react';

export interface AutoplayOptions {
  playing: boolean;
  durationMs: number;
  onAdvance: () => void;
}

/**
 * Fires `onAdvance` once every `durationMs` while `playing`.
 * The timer restarts whenever `playing` or `durationMs` changes, so a slide
 * always gets its own full reading time.
 */
export function useAutoplay({ playing, durationMs, onAdvance }: AutoplayOptions): void {
  const callback = useRef(onAdvance);
  callback.current = onAdvance;

  useEffect(() => {
    if (!playing) return;
    const id = setTimeout(() => callback.current(), durationMs);
    return () => clearTimeout(id);
  }, [playing, durationMs]);
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm run test -- useAutoplay`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add hooks/useAutoplay.ts tests/unit/useAutoplay.test.ts
git commit -m "feat: add autoplay timer hook"
```

---

## Task 10: Reduced-motion, speech and swipe hooks

**Files:**
- Create: `hooks/usePrefersReducedMotion.ts`, `hooks/useSpeech.ts`, `hooks/useSwipe.ts`
- Create: `tests/unit/usePrefersReducedMotion.test.ts`, `tests/unit/useSwipe.test.tsx`

- [ ] **Step 1: Write the failing test**

`tests/unit/usePrefersReducedMotion.test.ts`:

```ts
import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

function stubMatchMedia(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({
      matches,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  );
}

afterEach(() => vi.unstubAllGlobals());

describe('usePrefersReducedMotion', () => {
  it('reports true when the user prefers reduced motion', () => {
    stubMatchMedia(true);
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(true);
  });

  it('reports false otherwise', () => {
    stubMatchMedia(false);
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test -- usePrefersReducedMotion`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `hooks/usePrefersReducedMotion.ts`**

```ts
'use client';

import { useEffect, useState } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof matchMedia !== 'function') return;
    const mq = matchMedia(QUERY);
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent): void => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return reduced;
}
```

- [ ] **Step 4: Implement `hooks/useSpeech.ts`**

```ts
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createSpeaker, isSpeechSupported, type SpeechOutcome } from '@/lib/speech';

export interface UseSpeech {
  supported: boolean;
  speaking: boolean;
  speak: (text: string) => Promise<SpeechOutcome>;
  cancel: () => void;
}

export function useSpeech(): UseSpeech {
  const speakerRef = useRef<ReturnType<typeof createSpeaker> | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(isSpeechSupported());
    speakerRef.current = createSpeaker();
    return () => speakerRef.current?.cancel();
  }, []);

  const speak = useCallback(async (text: string): Promise<SpeechOutcome> => {
    const speaker = speakerRef.current;
    if (!speaker) return 'unsupported';
    setSpeaking(true);
    try {
      return await speaker.speak(text);
    } finally {
      setSpeaking(false);
    }
  }, []);

  const cancel = useCallback(() => {
    speakerRef.current?.cancel();
    setSpeaking(false);
  }, []);

  return useMemo(
    () => ({ supported, speaking, speak, cancel }),
    [supported, speaking, speak, cancel],
  );
}
```

- [ ] **Step 5: Write the failing swipe test**

`tests/unit/useSwipe.test.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useSwipe } from '@/hooks/useSwipe';

function Harness({ onLeft, onRight }: { onLeft: () => void; onRight: () => void }) {
  const handlers = useSwipe({ onLeft, onRight });
  return <div data-testid="stage" {...handlers}>stage</div>;
}

function swipe(from: number, to: number) {
  const stage = screen.getByTestId('stage');
  fireEvent.touchStart(stage, { changedTouches: [{ clientX: from, clientY: 0 }] });
  fireEvent.touchEnd(stage, { changedTouches: [{ clientX: to, clientY: 0 }] });
}

describe('useSwipe', () => {
  it('fires onLeft when swiping right-to-left', () => {
    const onLeft = vi.fn();
    const onRight = vi.fn();
    render(<Harness onLeft={onLeft} onRight={onRight} />);
    swipe(300, 100);
    expect(onLeft).toHaveBeenCalledTimes(1);
    expect(onRight).not.toHaveBeenCalled();
  });

  it('fires onRight when swiping left-to-right', () => {
    const onLeft = vi.fn();
    const onRight = vi.fn();
    render(<Harness onLeft={onLeft} onRight={onRight} />);
    swipe(100, 300);
    expect(onRight).toHaveBeenCalledTimes(1);
  });

  it('ignores small movements, so a shaky hand does not change slide', () => {
    const onLeft = vi.fn();
    const onRight = vi.fn();
    render(<Harness onLeft={onLeft} onRight={onRight} />);
    swipe(200, 175);
    expect(onLeft).not.toHaveBeenCalled();
    expect(onRight).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 6: Run to verify it fails**

Run: `npm run test -- useSwipe`
Expected: FAIL — cannot resolve `@/hooks/useSwipe`.

- [ ] **Step 7: Implement `hooks/useSwipe.ts`**

The 60px threshold is deliberately generous: an unsteady hand must not flip the slide by accident.

```ts
'use client';

import { useRef, type TouchEvent } from 'react';

const THRESHOLD_PX = 60;

export interface SwipeOptions {
  onLeft: () => void;
  onRight: () => void;
}

export interface SwipeHandlers {
  onTouchStart: (e: TouchEvent) => void;
  onTouchEnd: (e: TouchEvent) => void;
}

export function useSwipe({ onLeft, onRight }: SwipeOptions): SwipeHandlers {
  const startX = useRef<number | null>(null);

  return {
    onTouchStart: (e: TouchEvent) => {
      startX.current = e.changedTouches[0]?.clientX ?? null;
    },
    onTouchEnd: (e: TouchEvent) => {
      const from = startX.current;
      const to = e.changedTouches[0]?.clientX;
      startX.current = null;
      if (from === null || to === undefined) return;

      const dx = to - from;
      if (Math.abs(dx) < THRESHOLD_PX) return;
      if (dx < 0) onLeft();
      else onRight();
    },
  };
}
```

- [ ] **Step 8: Run tests and typecheck**

Run: `npm run test && npm run typecheck`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add hooks/ tests/unit/usePrefersReducedMotion.test.ts tests/unit/useSwipe.test.tsx
git commit -m "feat: add reduced-motion, speech and swipe React hooks"
```

---

## Task 11: PhoneMock component (TDD)

**Files:**
- Create: `components/PhoneMock.tsx`, `components/PhoneMock.module.css`, `tests/unit/PhoneMock.test.tsx`

- [ ] **Step 1: Write the failing test**

`tests/unit/PhoneMock.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PhoneMock } from '@/components/PhoneMock';
import type { MockLine } from '@/content/types';

describe('PhoneMock', () => {
  it('renders nav items and marks the active one', () => {
    const lines: MockLine[] = [
      { kind: 'nav', items: ['Home', 'Appointments', 'Payments'], active: 'Appointments' },
    ];
    render(<PhoneMock lines={lines} />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Appointments')).toHaveAttribute('data-active', 'true');
    expect(screen.getByText('Payments')).toHaveAttribute('data-active', 'false');
  });

  it('renders a row with its sub-label', () => {
    render(<PhoneMock lines={[{ kind: 'row', label: 'Metformin 500mg', sub: 'Twice daily' }]} />);
    expect(screen.getByText('Metformin 500mg')).toBeInTheDocument();
    expect(screen.getByText('Twice daily')).toBeInTheDocument();
  });

  it('renders mock buttons as inert, not as real buttons', () => {
    render(<PhoneMock lines={[{ kind: 'button', label: 'Submit', primary: true }]} />);
    expect(screen.getByText('Submit')).toBeInTheDocument();
    // These are pictures of buttons. A screen reader user must not be offered them.
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('marks completed itinerary stops', () => {
    render(
      <PhoneMock
        lines={[{ kind: 'itinerary', items: ['Registration', 'Consultation', 'Pharmacy'], doneCount: 1 }]}
      />,
    );
    expect(screen.getByText('Registration')).toHaveAttribute('data-done', 'true');
    expect(screen.getByText('Consultation')).toHaveAttribute('data-done', 'false');
  });

  it('renders the whole mock as a single decorative image to assistive tech', () => {
    const { container } = render(<PhoneMock lines={[{ kind: 'qr' }]} />);
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test -- PhoneMock`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `components/PhoneMock.tsx`**

The mock is a *picture of a phone screen*. Its content is decorative — the meaning lives in the step caption, which is real text. So the whole mock is `aria-hidden`, and nothing inside it is focusable.

```tsx
import type { MockLine } from '@/content/types';
import styles from './PhoneMock.module.css';

function Line({ line }: { line: MockLine }) {
  switch (line.kind) {
    case 'nav':
      return (
        <div className={styles.nav}>
          {line.items.map((item) => (
            <span key={item} className={styles.navItem} data-active={String(item === line.active)}>
              {item}
            </span>
          ))}
        </div>
      );
    case 'row':
      return (
        <div className={styles.row}>
          <span className={styles.rowLabel}>{line.label}</span>
          {line.sub ? <span className={styles.rowSub}>{line.sub}</span> : null}
        </div>
      );
    case 'button':
      return (
        <span className={styles.button} data-primary={String(Boolean(line.primary))}>
          {line.label}
        </span>
      );
    case 'chips':
      return (
        <div className={styles.chips}>
          {line.items.map((item) => (
            <span key={item} className={styles.chip} data-active={String(item === line.active)}>
              {item}
            </span>
          ))}
        </div>
      );
    case 'status':
      return <span className={styles.status}>{line.label}</span>;
    case 'itinerary':
      return (
        <ol className={styles.itinerary}>
          {line.items.map((item, i) => (
            <li key={item} className={styles.stop} data-done={String(i < (line.doneCount ?? 0))}>
              {item}
            </li>
          ))}
        </ol>
      );
    case 'checkbox':
      return (
        <div className={styles.checkbox}>
          <span className={styles.tick}>✓</span>
          <span>{line.label}</span>
        </div>
      );
    case 'big':
      return <span className={styles.big}>{line.label}</span>;
    case 'qr':
      return <div className={styles.qr}>QR CODE</div>;
  }
}

export function PhoneMock({ lines }: { lines: MockLine[] }) {
  return (
    <div className={styles.screen} aria-hidden="true">
      {lines.map((line, i) => (
        <Line key={`${line.kind}-${i}`} line={line} />
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Create `components/PhoneMock.module.css`**

```css
.screen {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: #fff;
  border: 1px solid color-mix(in srgb, var(--ink) 18%, transparent);
  font-size: var(--type-small);
}

.nav, .chips { display: flex; flex-wrap: wrap; gap: 8px; }
.navItem, .chip {
  padding: 6px 10px;
  border: 1px solid color-mix(in srgb, var(--ink) 20%, transparent);
  color: var(--ink-soft);
}
.navItem[data-active='true'], .chip[data-active='true'] {
  border-color: var(--care);
  color: var(--care-text);
  font-weight: 600;
}

.row { display: flex; flex-direction: column; gap: 2px; padding: 8px 0;
  border-bottom: 1px solid color-mix(in srgb, var(--ink) 10%, transparent); }
.rowLabel { color: var(--ink); }
.rowSub { color: var(--ink-soft); font-size: 0.85em; }

.button {
  display: block; text-align: center; padding: 12px;
  border: 1px solid var(--ink-soft); color: var(--ink);
}
.button[data-primary='true'] { background: var(--care); border-color: var(--care); color: #fff; }

.status { align-self: flex-start; padding: 6px 12px; background: var(--steel-lt); color: var(--steel900); }

.itinerary { list-style: none; display: flex; flex-direction: column; gap: 8px; }
.stop { color: var(--ink-soft); }
.stop[data-done='true'] { color: var(--care-text); font-weight: 600; }
.stop[data-done='true']::before { content: '✓ '; }

.checkbox { display: flex; align-items: center; gap: 10px; color: var(--ink); }
.tick { width: 28px; height: 28px; display: grid; place-items: center;
  border: 2px solid var(--care); color: var(--care-text); }

.big { font-family: var(--font-heading); font-size: 2.2em; color: var(--care-text); text-align: center; }

.qr { aspect-ratio: 1; display: grid; place-items: center; border: 2px solid var(--ink);
  color: var(--ink-soft); font-family: var(--font-heading); }
```

- [ ] **Step 5: Run to verify it passes**

Run: `npm run test -- PhoneMock`
Expected: PASS, 5 tests.

- [ ] **Step 6: Commit**

```bash
git add components/PhoneMock.tsx components/PhoneMock.module.css tests/unit/PhoneMock.test.tsx
git commit -m "feat: add PhoneMock component"
```

---

## Task 12: Logo slot, video facade and quiz (TDD)

Three small interactive components. Each has one responsibility.

**Files:**
- Create: `components/LogoSlot.tsx`, `components/VideoFacade.tsx`, `components/Quiz.tsx` and matching `.module.css`
- Create: `tests/unit/VideoFacade.test.tsx`, `tests/unit/Quiz.test.tsx`

- [ ] **Step 1: Write the failing tests**

`tests/unit/VideoFacade.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { VideoFacade } from '@/components/VideoFacade';

const props = {
  embedUrl: 'https://www.facebook.com/plugins/video.php?href=x',
  posterTitle: 'Watch: using the NHG Health App',
  posterBody: 'Tap to play.',
};

describe('VideoFacade', () => {
  it('renders no iframe before activation', () => {
    const { container } = render(<VideoFacade {...props} />);
    expect(container.querySelector('iframe')).toBeNull();
    expect(screen.getByText('Watch: using the NHG Health App')).toBeInTheDocument();
  });

  it('exposes a large, clearly named play control', () => {
    render(<VideoFacade {...props} />);
    expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
  });

  it('injects the iframe only after the user activates it', async () => {
    const user = userEvent.setup();
    const { container } = render(<VideoFacade {...props} />);
    await user.click(screen.getByRole('button', { name: /play/i }));
    const iframe = container.querySelector('iframe');
    expect(iframe).not.toBeNull();
    expect(iframe?.getAttribute('src')).toBe(props.embedUrl);
  });

  it('notifies the deck when playback starts so autoplay can pause', async () => {
    const user = userEvent.setup();
    let started = false;
    render(<VideoFacade {...props} onPlay={() => { started = true; }} />);
    await user.click(screen.getByRole('button', { name: /play/i }));
    expect(started).toBe(true);
  });
});
```

`tests/unit/Quiz.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Quiz } from '@/components/Quiz';
import type { Quiz as QuizData } from '@/content/types';

const quiz: QuizData = {
  question: 'How many minutes before your appointment can you tap "I have arrived"?',
  options: [
    { label: '10', correct: false },
    { label: '30', correct: true },
    { label: '60', correct: false },
  ],
  correctFeedback: 'That is right — 30 minutes before your appointment.',
  retryFeedback: 'Not quite. Have another look, then try again.',
};

describe('Quiz', () => {
  it('renders every option as a real button', () => {
    render(<Quiz quiz={quiz} />);
    for (const o of quiz.options) {
      expect(screen.getByRole('button', { name: o.label })).toBeInTheDocument();
    }
  });

  it('confirms a correct answer', async () => {
    const user = userEvent.setup();
    render(<Quiz quiz={quiz} />);
    await user.click(screen.getByRole('button', { name: '30' }));
    expect(screen.getByText(quiz.correctFeedback)).toBeInTheDocument();
  });

  it('invites another try after a wrong answer, without locking out', async () => {
    const user = userEvent.setup();
    render(<Quiz quiz={quiz} />);
    await user.click(screen.getByRole('button', { name: '10' }));
    expect(screen.getByText(quiz.retryFeedback)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '30' })).toBeEnabled();
    await user.click(screen.getByRole('button', { name: '30' }));
    expect(screen.getByText(quiz.correctFeedback)).toBeInTheDocument();
  });

  it('announces feedback politely to assistive tech', async () => {
    const user = userEvent.setup();
    render(<Quiz quiz={quiz} />);
    await user.click(screen.getByRole('button', { name: '30' }));
    expect(screen.getByRole('status')).toHaveTextContent(quiz.correctFeedback);
  });

  it('pauses autoplay on first interaction', async () => {
    const user = userEvent.setup();
    const onInteract = vi.fn();
    render(<Quiz quiz={quiz} onInteract={onInteract} />);
    await user.click(screen.getByRole('button', { name: '10' }));
    expect(onInteract).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npm run test -- VideoFacade Quiz`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement `components/VideoFacade.tsx`**

```tsx
'use client';

import { useState } from 'react';
import styles from './VideoFacade.module.css';

export interface VideoFacadeProps {
  embedUrl: string;
  posterTitle: string;
  posterBody: string;
  onPlay?: () => void;
}

/**
 * Click-to-load wrapper for the Facebook reel. No Facebook request, script or
 * cookie is issued until the user activates it — this keeps viewers who never
 * watch untracked, and keeps the third party off the critical render path.
 */
export function VideoFacade({ embedUrl, posterTitle, posterBody, onPlay }: VideoFacadeProps) {
  const [active, setActive] = useState(false);

  if (active) {
    return (
      <div className={styles.frame}>
        <iframe
          src={embedUrl}
          title={posterTitle}
          className={styles.iframe}
          allow="clipboard-write; encrypted-media; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    );
  }

  return (
    <div className={styles.frame}>
      <button
        type="button"
        className={styles.poster}
        onClick={() => {
          setActive(true);
          onPlay?.();
        }}
      >
        <span className={styles.playIcon} aria-hidden="true">▶</span>
        <span className={styles.posterTitle}>Play video</span>
        <span className={styles.posterBody}>{posterBody}</span>
      </button>
      <p className={styles.caption}>{posterTitle}</p>
    </div>
  );
}
```

- [ ] **Step 4: Create `components/VideoFacade.module.css`**

```css
.frame { display: flex; flex-direction: column; gap: 16px; align-items: center; }
.poster {
  width: min(267px, 100%); aspect-ratio: 267 / 591;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px;
  padding: 24px; cursor: pointer;
  background: var(--steel900); color: var(--on-dark);
  border: 2px solid var(--care);
  font: inherit; text-align: center;
}
.playIcon { font-size: 44px; color: var(--care); }
.posterTitle { font-family: var(--font-heading); font-size: var(--type-subtitle); }
.posterBody { font-size: var(--type-small); color: var(--on-dark-soft); }
.iframe { width: min(267px, 100%); height: 591px; max-height: 70vh; border: 0; }
.caption { font-size: var(--type-small); color: var(--ink-soft); text-align: center; }
```

- [ ] **Step 5: Implement `components/Quiz.tsx`**

```tsx
'use client';

import { useState } from 'react';
import type { Quiz as QuizData } from '@/content/types';
import styles from './Quiz.module.css';

export interface QuizProps {
  quiz: QuizData;
  onInteract?: () => void;
}

type Result = 'none' | 'correct' | 'retry';

export function Quiz({ quiz, onInteract }: QuizProps) {
  const [result, setResult] = useState<Result>('none');

  const answer = (correct: boolean): void => {
    onInteract?.();
    setResult(correct ? 'correct' : 'retry');
  };

  return (
    <div className={styles.quiz}>
      <p className={styles.question}>{quiz.question}</p>
      <div className={styles.options}>
        {quiz.options.map((o) => (
          <button
            key={o.label}
            type="button"
            className={styles.option}
            onClick={() => answer(o.correct)}
          >
            {o.label}
          </button>
        ))}
      </div>
      <p role="status" aria-live="polite" className={styles.feedback} data-result={result}>
        {result === 'correct' ? quiz.correctFeedback : result === 'retry' ? quiz.retryFeedback : ''}
      </p>
    </div>
  );
}
```

- [ ] **Step 6: Create `components/Quiz.module.css`**

```css
.quiz { display: flex; flex-direction: column; gap: 18px; }
.question { font-size: var(--type-body); }
.options { display: flex; flex-wrap: wrap; gap: 14px; }
.option {
  min-width: var(--tap-min); min-height: var(--tap-min);
  padding: 12px 28px; cursor: pointer;
  font: inherit; font-family: var(--font-heading); font-size: var(--type-subtitle);
  background: transparent; color: var(--ink); border: 2px solid var(--steel-mid);
}
.option:hover { border-color: var(--care); }
.feedback { min-height: 2.4em; font-size: var(--type-small); }
.feedback[data-result='correct'] { color: var(--care-text); font-weight: 600; }
.feedback[data-result='retry'] { color: var(--ink-soft); }
```

- [ ] **Step 7: Implement `components/LogoSlot.tsx`**

The logo file may be absent. A missing logo must never break build, test or deploy.

```tsx
'use client';

import Image from 'next/image';
import { useState } from 'react';
import styles from './LogoSlot.module.css';

export interface LogoSlotProps {
  src?: string;
  alt: string;
  fallback: string[];
}

export function LogoSlot({ src, alt, fallback }: LogoSlotProps) {
  const [failed, setFailed] = useState(false);

  if (src && !failed) {
    return (
      <div className={styles.slot}>
        <Image
          src={src}
          alt={alt}
          width={332}
          height={212}
          className={styles.image}
          onError={() => setFailed(true)}
          priority
        />
      </div>
    );
  }

  return (
    <div className={styles.slot} role="img" aria-label={alt}>
      {fallback.map((line) => (
        <span key={line} className={styles.fallbackLine}>{line}</span>
      ))}
    </div>
  );
}
```

- [ ] **Step 8: Create `components/LogoSlot.module.css`**

The supplied logo is **332×212 px with an opaque dark background** baked in
(white wordmark, crimson knot mark). It therefore must NOT sit on a light panel —
no `background: var(--paper)` here. Slide 01 is the dark-themed cover, so the
slot stays transparent and the logo's own dark ground blends into it.

```css
.slot {
  width: min(420px, 100%); min-height: 140px;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px;
  padding: 20px;
  /* Transparent: the supplied logo carries its own dark background. */
  background: transparent;
}
/* Never upscale past the asset's native 332px — it blurs on high-DPI screens. */
.image { width: 100%; max-width: 332px; height: auto; object-fit: contain; }
.fallbackLine {
  font-family: var(--font-heading); font-size: var(--type-subtitle);
  color: var(--steel900); text-align: center; line-height: 1.15;
}
```

- [ ] **Step 9: Run to verify tests pass**

Run: `npm run test -- VideoFacade Quiz`
Expected: PASS, 9 tests.

- [ ] **Step 10: Commit**

```bash
git add components/ tests/unit/VideoFacade.test.tsx tests/unit/Quiz.test.tsx
git commit -m "feat: add logo slot, click-to-load video facade and interactive quiz"
```

---

## Task 13: Slide layouts

**Files:**
- Create: `components/layouts/CoverSlide.tsx`, `OverviewSlide.tsx`, `StepsSlide.tsx`, `VideoSlide.tsx`, `PracticeSlide.tsx`
- Create: `components/layouts/layouts.module.css`
- Create: `components/Slide.tsx`
- Create: `tests/unit/Slide.test.tsx`

- [ ] **Step 1: Write the failing test**

`tests/unit/Slide.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Slide } from '@/components/Slide';
import { SLIDES } from '@/content/slides';

describe('Slide', () => {
  it.each(SLIDES.map((s) => [s.id, s] as const))('renders %s without throwing', (_id, slide) => {
    render(<Slide slide={slide} />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(slide.title);
  });

  it('applies the slide theme as a data attribute', () => {
    const cover = SLIDES.find((s) => s.id === 'cover')!;
    const { container } = render(<Slide slide={cover} />);
    expect(container.firstElementChild).toHaveAttribute('data-theme', 'dark');
  });

  it('renders every step caption on a steps slide', () => {
    const slide = SLIDES.find((s) => s.id === 'getting-started')!;
    if (slide.body.kind !== 'steps') throw new Error('unreachable');
    render(<Slide slide={slide} />);
    for (const step of slide.body.steps) {
      expect(screen.getByText(step.caption)).toBeInTheDocument();
    }
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test -- Slide`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `components/Slide.tsx`**

```tsx
import type { Slide as SlideData } from '@/content/types';
import { CoverSlide } from './layouts/CoverSlide';
import { OverviewSlide } from './layouts/OverviewSlide';
import { PracticeSlide } from './layouts/PracticeSlide';
import { StepsSlide } from './layouts/StepsSlide';
import { VideoSlide } from './layouts/VideoSlide';
import styles from './layouts/layouts.module.css';

export interface SlideProps {
  slide: SlideData;
  onInteract?: () => void;
}

export function Slide({ slide, onInteract }: SlideProps) {
  const body = slide.body;

  return (
    <section className={styles.slide} data-theme={slide.theme} aria-label={slide.label}>
      <header className={styles.header}>
        {slide.eyebrow ? <p className={styles.eyebrow}>{slide.eyebrow}</p> : null}
        <h2 className={styles.title}>{slide.title}</h2>
        {slide.lede ? <p className={styles.lede}>{slide.lede}</p> : null}
      </header>

      {body.kind === 'cover' ? <CoverSlide body={body} /> : null}
      {body.kind === 'overview' ? <OverviewSlide body={body} /> : null}
      {body.kind === 'steps' ? <StepsSlide body={body} /> : null}
      {body.kind === 'video' ? <VideoSlide body={body} onInteract={onInteract} /> : null}
      {body.kind === 'practice' ? <PracticeSlide body={body} onInteract={onInteract} /> : null}
    </section>
  );
}
```

- [ ] **Step 4: Implement the five layout components**

`components/layouts/CoverSlide.tsx`:

```tsx
import { LogoSlot } from '../LogoSlot';
import type { SlideBody } from '@/content/types';
import styles from './layouts.module.css';

type Body = Extract<SlideBody, { kind: 'cover' }>;

export function CoverSlide({ body }: { body: Body }) {
  return (
    <div className={styles.cover}>
      <p className={styles.presentedBy}>Presented by</p>
      <LogoSlot src="/images/care-corner-logo.png" alt="Care Corner Singapore" fallback={body.presentedBy} />
    </div>
  );
}
```

`components/layouts/OverviewSlide.tsx`:

```tsx
import type { SlideBody } from '@/content/types';
import styles from './layouts.module.css';

type Body = Extract<SlideBody, { kind: 'overview' }>;

export function OverviewSlide({ body }: { body: Body }) {
  return (
    <ol className={styles.cards}>
      {body.cards.map((card) => (
        <li key={card.number} className={styles.card}>
          <span className={styles.cardNumber}>{card.number}</span>
          <h3 className={styles.cardTitle}>{card.title}</h3>
          <p className={styles.cardBody}>{card.body}</p>
        </li>
      ))}
    </ol>
  );
}
```

`components/layouts/StepsSlide.tsx`:

```tsx
import { PhoneMock } from '../PhoneMock';
import type { SlideBody } from '@/content/types';
import styles from './layouts.module.css';

type Body = Extract<SlideBody, { kind: 'steps' }>;

export function StepsSlide({ body }: { body: Body }) {
  return (
    <div className={styles.stepsWrap}>
      {body.callout ? (
        <aside className={styles.callout}>
          <h3 className={styles.calloutTitle}>{body.callout.title}</h3>
          <p>{body.callout.body}</p>
        </aside>
      ) : null}

      {body.stat ? (
        <aside className={styles.stat}>
          <span className={styles.statValue}>{body.stat.value}</span>
          <p>{body.stat.body}</p>
        </aside>
      ) : null}

      <ol className={styles.steps} data-lettered={String(Boolean(body.lettered))}>
        {body.steps.map((step) => (
          <li key={step.marker} className={styles.step}>
            <span className={styles.marker} aria-hidden="true">{step.marker}</span>
            {step.mockTitle ? <h3 className={styles.mockTitle}>{step.mockTitle}</h3> : null}
            <PhoneMock lines={step.mock} />
            <p className={styles.caption}>{step.caption}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
```

`components/layouts/VideoSlide.tsx`:

```tsx
import { VideoFacade } from '../VideoFacade';
import type { SlideBody } from '@/content/types';
import styles from './layouts.module.css';

type Body = Extract<SlideBody, { kind: 'video' }>;

export function VideoSlide({ body, onInteract }: { body: Body; onInteract?: () => void }) {
  return (
    <div className={styles.video}>
      <VideoFacade
        embedUrl={body.embedUrl}
        posterTitle={body.posterTitle}
        posterBody={body.posterBody}
        onPlay={onInteract}
      />
    </div>
  );
}
```

`components/layouts/PracticeSlide.tsx`:

```tsx
import { Quiz } from '../Quiz';
import type { SlideBody } from '@/content/types';
import styles from './layouts.module.css';

type Body = Extract<SlideBody, { kind: 'practice' }>;

export function PracticeSlide({ body, onInteract }: { body: Body; onInteract?: () => void }) {
  return (
    <div className={styles.practice}>
      <ol className={styles.tasks}>
        {body.tasks.map((task) => (
          <li key={task} className={styles.task}>{task}</li>
        ))}
      </ol>

      <div className={styles.practiceAside}>
        <Quiz quiz={body.quiz} onInteract={onInteract} />
        <aside className={styles.callout}>
          <h3 className={styles.calloutTitle}>{body.help.title}</h3>
          <p>{body.help.body}</p>
        </aside>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create `components/layouts/layouts.module.css`**

Mobile-first. The desktop presentation composition arrives at the 768px breakpoint.

```css
.slide {
  display: flex; flex-direction: column; gap: 24px;
  padding: 32px 20px 40px;
  min-height: 100%;
  background: var(--paper); color: var(--ink);
}
.slide[data-theme='dark'] { background: var(--steel900); color: var(--paper); }

.header { display: flex; flex-direction: column; gap: 10px; }
.eyebrow {
  font-family: var(--font-heading); font-size: var(--type-small);
  letter-spacing: 0.18em; text-transform: uppercase; color: var(--steel-mid);
}
.slide[data-theme='dark'] .eyebrow { color: var(--steel-lt); }
.title {
  font-family: var(--font-heading); font-weight: 600;
  font-size: var(--type-title); line-height: 1.05;
}
.lede { font-size: var(--type-body); color: var(--ink-soft); }
.slide[data-theme='dark'] .lede { color: var(--on-dark); }

.cover { display: flex; flex-direction: column; align-items: center; gap: 16px; margin-top: auto; }
.presentedBy {
  font-family: var(--font-heading); font-size: var(--type-small);
  letter-spacing: 0.2em; text-transform: uppercase; color: var(--steel-lt);
}

.cards, .steps, .tasks { list-style: none; display: grid; gap: 20px; }
.card, .step {
  display: flex; flex-direction: column; gap: 12px;
  padding: 20px; border: 1px solid color-mix(in srgb, currentColor 22%, transparent);
}
.cardNumber, .marker {
  font-family: var(--font-heading); font-size: var(--type-subtitle);
  line-height: 1; color: var(--care);
}
.cardTitle, .mockTitle { font-family: var(--font-heading); font-size: var(--type-subtitle); }
.cardBody, .caption { font-size: var(--type-small); color: var(--ink-soft); }
.slide[data-theme='dark'] .cardBody, .slide[data-theme='dark'] .caption { color: var(--on-dark-soft); }

.callout, .stat {
  display: flex; flex-direction: column; gap: 8px;
  padding: 18px; border-left: 5px solid var(--care);
  background: color-mix(in srgb, var(--care) 8%, transparent);
  font-size: var(--type-small);
}
.calloutTitle { font-family: var(--font-heading); font-size: var(--type-subtitle); }
.statValue { font-family: var(--font-heading); font-size: var(--type-title); color: var(--care); line-height: 1; }

.stepsWrap, .practice, .video { display: flex; flex-direction: column; gap: 24px; }
.task { padding: 16px 20px; border: 1px solid color-mix(in srgb, currentColor 22%, transparent); }
.practiceAside { display: flex; flex-direction: column; gap: 24px; }

@media (min-width: 768px) {
  .slide { padding: 56px 64px 64px; gap: 32px; }
  .cards { grid-template-columns: repeat(5, 1fr); }
  .steps { grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); }
  .steps[data-lettered='true'] { grid-template-columns: repeat(3, 1fr); }
  .stepsWrap { display: grid; grid-template-columns: minmax(240px, 320px) 1fr; align-items: start; gap: 40px; }
  .stepsWrap:not(:has(.callout)):not(:has(.stat)) { display: flex; }
  .practice { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; }
  .cover { flex-direction: column; margin-top: 0; }
}
```

- [ ] **Step 6: Run to verify it passes**

Run: `npm run test -- Slide`
Expected: PASS, 13 tests (11 parameterised + 2).

- [ ] **Step 7: Commit**

```bash
git add components/ tests/unit/Slide.test.tsx
git commit -m "feat: add the five slide layouts"
```

---

## Task 14: Deck orchestrator, controls and page

**Files:**
- Create: `components/Deck.tsx`, `components/Deck.module.css`, `components/Controls.tsx`, `components/Controls.module.css`, `components/ProgressBar.tsx`, `components/ProgressBar.module.css`, `components/SpeakerNotes.tsx`, `components/SpeakerNotes.module.css`
- Modify: `app/page.tsx`
- Create: `tests/unit/Deck.test.tsx`

- [ ] **Step 1: Write the failing test**

`tests/unit/Deck.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Deck } from '@/components/Deck';
import { SLIDES } from '@/content/slides';

describe('Deck', () => {
  it('starts on the first slide', () => {
    render(<Deck slides={SLIDES} />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(SLIDES[0]!.title);
  });

  it('advances and retreats with the controls', async () => {
    const user = userEvent.setup();
    render(<Deck slides={SLIDES} />);
    await user.click(screen.getByRole('button', { name: /next slide/i }));
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(SLIDES[1]!.title);
    await user.click(screen.getByRole('button', { name: /previous slide/i }));
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(SLIDES[0]!.title);
  });

  it('does not retreat past the first slide', async () => {
    const user = userEvent.setup();
    render(<Deck slides={SLIDES} />);
    await user.click(screen.getByRole('button', { name: /previous slide/i }));
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(SLIDES[0]!.title);
  });

  it('advances with the arrow key', async () => {
    const user = userEvent.setup();
    render(<Deck slides={SLIDES} />);
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(SLIDES[1]!.title);
  });

  it('announces the current slide politely', () => {
    render(<Deck slides={SLIDES} />);
    const live = screen.getByRole('status');
    expect(live).toHaveAttribute('aria-live', 'polite');
    expect(live).toHaveTextContent(SLIDES[0]!.label);
  });

  it('starts paused, so it never surprises a room with sound or motion', () => {
    render(<Deck slides={SLIDES} />);
    expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
  });

  it('offers the reference PDF as a download from every slide', () => {
    render(<Deck slides={SLIDES} />);
    const link = screen.getByRole('link', { name: /download/i });
    expect(link).toHaveAttribute('href', '/docs/nhg-health-digital-education.pdf');
    expect(link).toHaveAttribute('download');
  });

  it('shows the position out of the total', () => {
    render(<Deck slides={SLIDES} />);
    expect(screen.getByText(`1 / ${SLIDES.length}`)).toBeInTheDocument();
  });

  it('toggles play with the P key and narration with the V key', async () => {
    const user = userEvent.setup();
    render(<Deck slides={SLIDES} />);
    await user.keyboard('p');
    expect(screen.getByRole('button', { name: /pause slideshow/i })).toBeInTheDocument();
    await user.keyboard('p');
    expect(screen.getByRole('button', { name: /play slideshow/i })).toBeInTheDocument();
  });

  it('jumps to the last slide with End and back with Home', async () => {
    const user = userEvent.setup();
    render(<Deck slides={SLIDES} />);
    await user.keyboard('{End}');
    expect(screen.getByText(`${SLIDES.length} / ${SLIDES.length}`)).toBeInTheDocument();
    await user.keyboard('{Home}');
    expect(screen.getByText(`1 / ${SLIDES.length}`)).toBeInTheDocument();
  });

  // Slides are keyed by id, so leaving and returning remounts the layer and
  // clears quiz state — the deck can be re-run for the next group.
  it('resets quiz state when the practice slide is left and re-entered', async () => {
    const user = userEvent.setup();
    render(<Deck slides={SLIDES} />);
    await user.keyboard('{End}');
    await user.click(screen.getByRole('button', { name: '30' }));
    expect(screen.getByText(/that is right/i)).toBeInTheDocument();

    await user.keyboard('{Home}');
    await user.keyboard('{End}');
    expect(screen.queryByText(/that is right/i)).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test -- Deck`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `components/ProgressBar.tsx`**

```tsx
import styles from './ProgressBar.module.css';

export function ProgressBar({ index, total }: { index: number; total: number }) {
  const percent = ((index + 1) / total) * 100;
  return (
    <div className={styles.track}>
      <div className={styles.fill} style={{ width: `${percent}%` }} />
      <span className={styles.count}>{`${index + 1} / ${total}`}</span>
    </div>
  );
}
```

`components/ProgressBar.module.css`:

```css
.track { position: relative; height: 8px; background: color-mix(in srgb, currentColor 18%, transparent); }
.fill { height: 100%; background: var(--care); transition: width 300ms ease; }
.count { position: absolute; right: 0; top: 12px; font-size: var(--type-small); color: var(--ink-soft); }
```

- [ ] **Step 4: Implement `components/SpeakerNotes.tsx`**

```tsx
import styles from './SpeakerNotes.module.css';

export function SpeakerNotes({ notes, visible }: { notes: string; visible: boolean }) {
  return (
    <p className={styles.notes} data-visible={String(visible)}>
      {notes}
    </p>
  );
}
```

`components/SpeakerNotes.module.css`:

```css
/* Always in the DOM so screen readers reach the same words the synthesiser
   speaks; visually hidden unless captions are switched on. */
.notes[data-visible='false'] {
  position: absolute; width: 1px; height: 1px;
  overflow: hidden; clip-path: inset(50%); white-space: nowrap;
}
.notes[data-visible='true'] {
  padding: 16px 20px; font-size: var(--type-small);
  background: var(--steel900); color: var(--on-dark);
}
```

- [ ] **Step 5: Implement `components/Controls.tsx`**

```tsx
import styles from './Controls.module.css';

export interface ControlsProps {
  playing: boolean;
  voiceOn: boolean;
  voiceSupported: boolean;
  captionsOn: boolean;
  onTogglePlay: () => void;
  onToggleVoice: () => void;
  onToggleCaptions: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export function Controls({
  playing, voiceOn, voiceSupported, captionsOn,
  onTogglePlay, onToggleVoice, onToggleCaptions, onPrev, onNext,
}: ControlsProps) {
  return (
    <div className={styles.bar}>
      <button type="button" className={styles.btn} onClick={onPrev} aria-label="Previous slide">←</button>
      <button type="button" className={styles.btn} onClick={onTogglePlay}
        aria-label={playing ? 'Pause slideshow' : 'Play slideshow'}>
        {playing ? '❚❚' : '▶'}
      </button>
      <button type="button" className={styles.btn} onClick={onNext} aria-label="Next slide">→</button>

      {voiceSupported ? (
        <button type="button" className={styles.btn} onClick={onToggleVoice}
          aria-pressed={voiceOn} aria-label="Read slides aloud">
          {voiceOn ? '🔊' : '🔇'}
        </button>
      ) : null}

      <button type="button" className={styles.btn} onClick={onToggleCaptions}
        aria-pressed={captionsOn} aria-label="Show narration text">CC</button>

      <a className={styles.btn} href="/docs/nhg-health-digital-education.pdf"
        download aria-label="Download the guide as PDF">⤓ PDF</a>
    </div>
  );
}
```

`components/Controls.module.css`:

```css
.bar {
  display: flex; flex-wrap: wrap; align-items: center; gap: 10px;
  padding: 12px 16px;
  background: var(--paper); border-top: 1px solid color-mix(in srgb, var(--ink) 15%, transparent);
}
.btn {
  min-width: var(--tap-min); min-height: var(--tap-min);
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  padding: 8px 16px; cursor: pointer;
  font: inherit; font-size: var(--type-small);
  background: transparent; color: var(--ink);
  border: 2px solid var(--steel-mid); text-decoration: none;
}
.btn:hover { border-color: var(--care); }
.btn[aria-pressed='true'] { background: var(--steel900); color: var(--paper); border-color: var(--steel900); }
```

- [ ] **Step 6: Implement `components/Deck.tsx`**

```tsx
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Slide as SlideData } from '@/content/types';
import { useAutoplay } from '@/hooks/useAutoplay';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { useSpeech } from '@/hooks/useSpeech';
import { useSwipe } from '@/hooks/useSwipe';
import { slideSeconds } from '@/lib/timing';
import { Controls } from './Controls';
import { ProgressBar } from './ProgressBar';
import { Slide } from './Slide';
import { SpeakerNotes } from './SpeakerNotes';
import styles from './Deck.module.css';

const BREATH_MS = 1200;

export function Deck({ slides }: { slides: SlideData[] }) {
  const [index, setIndex] = useState(0);
  // Starts paused: a deck that talks or moves by itself is disruptive in a
  // group room, and iOS will not produce audio without a gesture anyway.
  const [playing, setPlaying] = useState(false);
  const [voiceOn, setVoiceOn] = useState(false);
  const [captionsOn, setCaptionsOn] = useState(false);

  const reducedMotion = usePrefersReducedMotion();
  const speech = useSpeech();
  const slide = slides[index]!;

  const goTo = useCallback(
    (next: number) => setIndex(Math.min(slides.length - 1, Math.max(0, next))),
    [slides.length],
  );

  const pause = useCallback(() => setPlaying(false), []);
  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  // Manual navigation always pauses — nobody should be hurried.
  const manualNext = useCallback(() => { pause(); next(); }, [pause, next]);
  const manualPrev = useCallback(() => { pause(); prev(); }, [pause, prev]);

  const durationMs = useMemo(() => slideSeconds(slide) * 1000, [slide]);

  useAutoplay({
    playing: playing && !voiceOn,
    durationMs,
    onAdvance: () => (index < slides.length - 1 ? next() : setPlaying(false)),
  });

  // With narration on, the slide never advances mid-sentence, and never
  // faster than the reading time.
  useEffect(() => {
    if (!playing || !voiceOn) return;
    let cancelled = false;
    const started = Date.now();

    void speech.speak(slide.speakerNotes).then(() => {
      if (cancelled) return;
      const elapsed = Date.now() - started;
      const remaining = Math.max(0, durationMs - elapsed);
      setTimeout(() => {
        if (cancelled) return;
        if (index < slides.length - 1) next();
        else setPlaying(false);
      }, remaining + BREATH_MS);
    });

    return () => {
      cancelled = true;
      speech.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, voiceOn, index, durationMs]);

  // Never keep talking or advancing into a hidden tab.
  useEffect(() => {
    const onHide = (): void => {
      if (document.hidden) { setPlaying(false); speech.cancel(); }
    };
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, [speech]);

  const toggleVoice = useCallback(() => {
    setVoiceOn((v) => !v);
    speech.cancel();
  }, [speech]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      // Never hijack typing in a form control.
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;

      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      const handled = ['ArrowRight', 'ArrowLeft', ' ', 'PageDown', 'PageUp', 'Home', 'End', 'p', 'v'];
      if (!handled.includes(key)) return;
      e.preventDefault();

      if (key === 'ArrowRight' || key === ' ' || key === 'PageDown') manualNext();
      else if (key === 'ArrowLeft' || key === 'PageUp') manualPrev();
      else if (key === 'Home') { pause(); goTo(0); }
      else if (key === 'End') { pause(); goTo(slides.length - 1); }
      else if (key === 'p') setPlaying((p) => !p);
      else if (key === 'v') toggleVoice();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [manualNext, manualPrev, pause, goTo, slides.length, toggleVoice]);

  const swipe = useSwipe({ onLeft: manualNext, onRight: manualPrev });

  return (
    <main className={styles.deck} aria-label="NHG Health App guide">
      <ProgressBar index={index} total={slides.length} />

      <div className={styles.stage} data-reduced={String(reducedMotion)} {...swipe}>
        <div key={slide.id} className={styles.layer}>
          <Slide slide={slide} onInteract={pause} />
        </div>
      </div>

      <p role="status" aria-live="polite" className={styles.srOnly}>
        {`Slide ${index + 1} of ${slides.length}: ${slide.label}`}
      </p>

      <SpeakerNotes notes={slide.speakerNotes} visible={captionsOn} />

      <Controls
        playing={playing}
        voiceOn={voiceOn}
        voiceSupported={speech.supported}
        captionsOn={captionsOn}
        onTogglePlay={() => setPlaying((p) => !p)}
        onToggleVoice={toggleVoice}
        onToggleCaptions={() => setCaptionsOn((c) => !c)}
        onPrev={manualPrev}
        onNext={manualNext}
      />
    </main>
  );
}
```

- [ ] **Step 7: Create `components/Deck.module.css`**

```css
.deck { display: flex; flex-direction: column; min-height: 100dvh; }
.stage { position: relative; flex: 1; overflow: hidden; }
.layer { animation: fadeIn var(--fade-ms) ease both; height: 100%; }
.stage[data-reduced='true'] .layer { animation: none; }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

.srOnly {
  position: absolute; width: 1px; height: 1px;
  overflow: hidden; clip-path: inset(50%); white-space: nowrap;
}

@media (min-width: 768px) {
  .stage { aspect-ratio: 16 / 9; flex: none; }
  .deck { max-width: 1600px; margin: 0 auto; }
}
```

- [ ] **Step 8: Wire `app/page.tsx`**

```tsx
import { Deck } from '@/components/Deck';
import { SLIDES } from '@/content/slides';

export default function Home() {
  return <Deck slides={SLIDES} />;
}
```

- [ ] **Step 9: Run to verify it passes**

Run: `npm run test -- Deck`
Expected: PASS, 11 tests.

- [ ] **Step 10: Full verify**

Run: `npm run verify`
Expected: lint, typecheck, all unit tests and build all pass.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: add deck orchestrator, controls and page wiring"
```

---

## Task 15: Assets — PDF and logo slot

**Files:**
- Create: `public/docs/nhg-health-digital-education.pdf`, `public/images/README.md`
- Create: `tests/unit/assets.test.ts`

- [ ] **Step 1: Confirm the assets are already in place**

Both assets were placed before execution began. Verify rather than re-copy:

```bash
ls -l public/docs/nhg-health-digital-education.pdf public/images/care-corner-logo.png
```

Expected: PDF ~109 KB, logo ~73 KB. If either is missing:

```bash
mkdir -p public/docs public/images
cp "/c/Users/admin/Downloads/nhg-health digital-education.pdf" public/docs/nhg-health-digital-education.pdf
cp "/c/Users/admin/Downloads/care-corner-logo.png" public/images/care-corner-logo.png
```

Note the PDF source filename contains a space; the destination deliberately does not.

- [ ] **Step 2: Write the failing test**

`tests/unit/assets.test.ts`:

```ts
import { existsSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('static assets', () => {
  it('ships the reference PDF at the path the download control uses', () => {
    const path = 'public/docs/nhg-health-digital-education.pdf';
    expect(existsSync(path)).toBe(true);
    expect(statSync(path).size).toBeGreaterThan(10_000);
  });

  it('ships the Care Corner logo at the path the cover slide uses', () => {
    const path = 'public/images/care-corner-logo.png';
    expect(existsSync(path)).toBe(true);
    expect(statSync(path).size).toBeGreaterThan(1_000);
  });
});
```

- [ ] **Step 3: Run to verify it passes**

Run: `npm run test -- assets`
Expected: PASS. If it fails, the copy in Step 1 did not land.

- [ ] **Step 4: Create `public/images/README.md`**

```markdown
# Images

## care-corner-logo.png — supplied

The official Care Corner Singapore logo, rendered on slide 01.

Supplied asset: 332 × 212 px PNG, white "care corner" wordmark and crimson knot
mark on an **opaque dark background**.

Two consequences for anyone replacing it:

1. The logo carries its own dark ground, so `LogoSlot` renders it on a
   transparent slot over the dark cover slide. A light-background logo would
   need that CSS changed.
2. At 332 px native width it is not retina-crisp much beyond its own size, so
   `.image` caps at `max-width: 332px` rather than upscaling. **If a higher
   resolution version (≥ 840 px wide) or an SVG becomes available, drop it in
   and raise that cap** — the render will sharpen on high-DPI phones, which is
   most of the audience's devices.

If the file is ever absent, `LogoSlot` falls back to type reading
"Care Corner Singapore / Active Ageing & Senior Services". Build, tests and
deploy all succeed either way.
```

- [ ] **Step 5: Commit**

```bash
git add public tests/unit/assets.test.ts
git commit -m "feat: ship the reference PDF and document the logo slot"
```

---

## Task 16: End-to-end and accessibility tests

**Files:**
- Create: `playwright.config.ts`, `tests/e2e/deck.spec.ts`, `tests/e2e/a11y.spec.ts`

- [ ] **Step 1: Install browsers**

Run: `npx playwright install chromium`
Expected: chromium downloads and installs.

- [ ] **Step 2: Create `playwright.config.ts`**

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: { baseURL: 'http://localhost:3000', trace: 'on-first-retry' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'npm run build && npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
```

- [ ] **Step 3: Write `tests/e2e/deck.spec.ts`**

```ts
import { expect, test } from '@playwright/test';

test('reaches the last slide through the controls', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 2 })).toHaveText('NHG Health App');

  for (let i = 0; i < 10; i += 1) {
    await page.getByRole('button', { name: /next slide/i }).click();
  }
  await expect(page.getByText('11 / 11')).toBeVisible();
});

test('autoplay advances, and no faster than the reading time', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /play slideshow/i }).click();

  // The cover's reading time floors at 8s, so at 3s it must still be slide 1.
  await page.waitForTimeout(3000);
  await expect(page.getByText('1 / 11')).toBeVisible();

  await expect(page.getByText('2 / 11')).toBeVisible({ timeout: 30_000 });
});

test('manual navigation pauses autoplay', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /play slideshow/i }).click();
  await page.getByRole('button', { name: /next slide/i }).click();
  await expect(page.getByRole('button', { name: /play slideshow/i })).toBeVisible();
});

test('the video slide issues no Facebook request until activated', async ({ page }) => {
  const facebookRequests: string[] = [];
  page.on('request', (r) => {
    if (r.url().includes('facebook.com')) facebookRequests.push(r.url());
  });

  await page.goto('/');
  for (let i = 0; i < 9; i += 1) {
    await page.getByRole('button', { name: /next slide/i }).click();
  }
  await expect(page.getByRole('button', { name: /play video/i })).toBeVisible();
  expect(facebookRequests, 'no third-party request before consent').toHaveLength(0);

  await page.getByRole('button', { name: /play video/i }).click();
  await expect(page.locator('iframe')).toHaveCount(1);
});

test('the quiz gives feedback', async ({ page }) => {
  await page.goto('/');
  for (let i = 0; i < 10; i += 1) {
    await page.getByRole('button', { name: /next slide/i }).click();
  }
  await page.getByRole('button', { name: '30', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: /that is right/i })).toBeVisible();
});

test('the PDF is downloadable', async ({ page, request }) => {
  await page.goto('/');
  const link = page.getByRole('link', { name: /download/i });
  const href = await link.getAttribute('href');
  expect(href).toBe('/docs/nhg-health-digital-education.pdf');

  const res = await request.get(href!);
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toContain('pdf');
});

test('body text is never smaller than 18px', async ({ page }) => {
  await page.goto('/');
  for (let i = 0; i < 11; i += 1) {
    const tooSmall = await page.evaluate(() => {
      const bad: string[] = [];
      for (const el of document.querySelectorAll('p, li, span, h2, h3, button, a')) {
        if (!el.textContent?.trim()) continue;
        if (el.closest('[aria-hidden="true"]')) continue;
        const size = parseFloat(getComputedStyle(el).fontSize);
        if (size < 18) bad.push(`${el.tagName}:${size}px:${el.textContent.slice(0, 30)}`);
      }
      return bad;
    });
    expect(tooSmall, `slide ${i + 1}`).toEqual([]);
    if (i < 10) await page.getByRole('button', { name: /next slide/i }).click();
  }
});
```

- [ ] **Step 4: Write `tests/e2e/a11y.spec.ts`**

```ts
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('every slide passes an automated accessibility scan', async ({ page }) => {
  await page.goto('/');

  for (let i = 0; i < 11; i += 1) {
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(results.violations, `slide ${i + 1}: ${JSON.stringify(results.violations.map((v) => v.id))}`)
      .toEqual([]);

    if (i < 10) await page.getByRole('button', { name: /next slide/i }).click();
  }
});

test('all controls are reachable by keyboard', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('ArrowRight');
  await expect(page.getByText('2 / 11')).toBeVisible();
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByText('1 / 11')).toBeVisible();
  await page.keyboard.press('End');
  await expect(page.getByText('11 / 11')).toBeVisible();
  await page.keyboard.press('Home');
  await expect(page.getByText('1 / 11')).toBeVisible();
});
```

- [ ] **Step 5: Run the e2e suite**

Run: `npm run test:e2e`
Expected: PASS on both `desktop` and `mobile` projects. Fix any failure in the **source**, not by loosening the assertion — each assertion encodes a spec requirement.

- [ ] **Step 6: Commit**

```bash
git add playwright.config.ts tests/e2e
git commit -m "test: add e2e and accessibility coverage across all slides"
```

---

## Task 17: Deployment

**Files:**
- Create: `vercel.json`, `README.md`

- [ ] **Step 1: Create `vercel.json`**

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "nextjs",
  "headers": [
    {
      "source": "/docs/nhg-health-digital-education.pdf",
      "headers": [
        { "key": "Content-Type", "value": "application/pdf" },
        { "key": "Cache-Control", "value": "public, max-age=3600" }
      ]
    }
  ]
}
```

- [ ] **Step 2: Write `README.md`**

````markdown
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

## Version pin

TypeScript is pinned to **6.0.3**, not the newer `latest`. `typescript-eslint@8`
declares `typescript: >=4.8.4 <6.1.0`, so TypeScript 7 breaks linting. Check
`npm view typescript-eslint peerDependencies` before changing it.

## The Care Corner logo

Slide 01 expects the official logo at `public/images/care-corner-logo.png`.
Until that file exists, a typographic fallback renders instead. The build, the
tests and the deploy all succeed either way.

## Content

Slides live in `content/slides.ts` as typed data — there is no slide markup to
edit. The original approved design is preserved at `docs/source/deck-template.html`
for reference. Speaker notes double as the narration script and the captions.

## Deploy

```bash
vercel deploy         # preview
vercel deploy --prod  # nhg-health-app.vercel.app
```
````

- [ ] **Step 3: Final verify**

Run: `npm run verify && npm run test:e2e`
Expected: everything passes. Do not proceed otherwise.

- [ ] **Step 4: Commit**

```bash
git add vercel.json README.md
git commit -m "chore: add Vercel config and README"
```

- [ ] **Step 5: STOP — confirm before pushing**

Ask the operator before running any of the following. Do not push or deploy on your own initiative.

```bash
git remote add origin https://github.com/JohnTan38/nhg-health-app.git
git push -u origin main
```

- [ ] **Step 6: Preview deploy**

```bash
vercel link --project nhg-health-app
vercel deploy
```

Open the preview URL and confirm slide 1 renders, autoplay advances, and the PDF downloads.

- [ ] **Step 7: STOP — confirm before production**

```bash
vercel deploy --prod
```

Target: `nhg-health-app.vercel.app`. This is a separate Vercel project from the
existing `ntuc-health-activity-registration`; do not link into that project.

---

## Definition of Done

- [ ] `npm run verify` passes
- [ ] `npm run test:e2e` passes on desktop and mobile projects
- [ ] All 11 slides render, in order, with correct content
- [ ] Autoplay advances at reading pace and pauses on interaction and tab hide
- [ ] Keyboard (arrows, Space, Home, End, P, V) and touch swipe both navigate
- [ ] Narration toggles on and off; deck still advances if speech fails
- [ ] No Facebook request before the user taps play
- [ ] PDF downloads from every slide
- [ ] No text below 18px on any slide, at 375px and 1280px
- [ ] Zero axe violations on all 11 slides
- [ ] Logo slot shows the real logo when supplied, fallback type when not
